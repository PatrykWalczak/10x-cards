/**
 * OpenRouter Service - główna implementacja
 * 
 * Serwis zapewniający komunikację z API OpenRouter.ai, umożliwiający dostęp
 * do różnych modeli AI w sposób ujednolicony, z obsługą błędów i typesafe API.
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { 
  OpenRouterConfig,
  CompletionParams,
  CompletionResponse,
  ModelInfo,
  CostUsageInfo,
  TokenUsage,
  ResponseFormat
} from './types';
import { ErrorCode } from './types';
import { validateConfig } from './config';
import { 
  OpenRouterError, 
  OpenRouterAPIError,
  OpenRouterNetworkError,
  OpenRouterTimeoutError, 
  OpenRouterValidationError,
  OpenRouterRateLimitError
} from './errors';

/**
 * Główna klasa serwisu OpenRouter do komunikacji z API OpenRouter.ai
 */
export class OpenRouterService {
  /**
   * Konfiguracja serwisu (tylko do odczytu)
   */
  readonly config: Readonly<Required<OpenRouterConfig>>;
  
  /**
   * Status konfiguracji serwisu
   */
  readonly isConfigured: boolean;
  
  /**
   * Klient HTTP do komunikacji z API
   */
  private httpClient: AxiosInstance;
  
  /**
   * Łączny koszt użycia serwisu od momentu inicjalizacji
   */
  private totalCost = 0;
  
  /**
   * Łączna liczba tokenów użytych do promptów
   */
  private promptTokens = 0;
  
  /**
   * Łączna liczba tokenów użytych do odpowiedzi
   */
  private completionTokens = 0;
  
  /**
   * Tworzy nową instancję serwisu OpenRouter
   * 
   * @param config Konfiguracja serwisu
   * @throws OpenRouterConfigError jeśli konfiguracja jest nieprawidłowa
   */
  constructor(config: OpenRouterConfig) {
    // Walidacja i inicjalizacja konfiguracji
    this.config = validateConfig(config);
    this.isConfigured = true;
    
    // Inicjalizacja klienta HTTP
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://10x-cards.app', // Dobre praktyki OpenRouter
        'X-Title': '10x Cards App' // Dobre praktyki OpenRouter
      }
    });
  }

  /**
   * Generuje odpowiedź modelu AI na podstawie podanych parametrów
   * 
   * @param params Parametry żądania do modelu AI
   * @returns Odpowiedź modelu AI
   * @throws OpenRouterError w przypadku błędów komunikacji lub limitów
   */
  async generateCompletion<T>(params: CompletionParams<T>): Promise<CompletionResponse<T>> {
    try {
      // Sprawdzenie limitów kosztów
      this.checkCostLimit();
      
      // Przygotowanie parametrów żądania
      const model = params.model || this.config.defaultModel;
      
      // Walidacja formatu odpowiedzi
      if (params.responseFormat) {
        this.validateResponseFormat(params.responseFormat);
      }
      
      // Przygotowanie żądania
      const requestData = {
        model,
        messages: params.messages,
        response_format: params.responseFormat ? {
          type: params.responseFormat.type,
          schema: params.responseFormat.schema
        } : undefined,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        stream: params.stream || false,
        stop: params.stop
      };
      
      // Wykonanie żądania
      const response = await this.httpClient.post<CompletionResponse<T>>(
        '/chat/completions',
        requestData
      );
      
      // Śledzenie użycia tokenów
      if (response.data.usage) {
        this.trackCostUsage(response.data.usage);
      }

      // Parsowanie JSON jeśli stosowany jest format JSON
      const result = response.data;
      
      if (params.responseFormat?.type === 'json_object' && result.choices && result.choices.length > 0) {
        try {
          for (const choice of result.choices) {
            if (choice.message && typeof choice.message.content === 'string') {
              const content = choice.message.content.trim();
              // Parsuj tylko jeśli zawartość wygląda jak JSON
              if (content.startsWith('{') || content.startsWith('[')) {
                choice.message.parsed = JSON.parse(content);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to parse JSON response:', error);
          // Nie rzucamy błędu, aby nie przerwać wykonania, ale logujemy ostrzeżenie
        }
      }
      
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Pobiera listę dostępnych modeli z OpenRouter API
   * 
   * @returns Lista dostępnych modeli
   * @throws OpenRouterError w przypadku błędów komunikacji
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.httpClient.get<{ data: ModelInfo[] }>('/models');
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Sprawdza poprawność klucza API
   * 
   * @returns True jeśli klucz API jest poprawny
   * @throws OpenRouterError w przypadku błędów komunikacji
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getAvailableModels();
      return true;
    } catch (error) {
      if (error instanceof OpenRouterAPIError && error.status === 401) {
        return false;
      }
      this.handleError(error);
    }
  }
  
  /**
   * Zwraca informacje o zużyciu kosztów
   * 
   * @returns Informacje o zużyciu kosztów
   */
  getCostUsage(): CostUsageInfo {
    return {
      totalCost: this.totalCost,
      tokenUsage: {
        prompt: this.promptTokens,
        completion: this.completionTokens,
        total: this.promptTokens + this.completionTokens
      },
      limitReached: this.config.costLimit !== Infinity && this.totalCost >= this.config.costLimit,
      costLimit: this.config.costLimit !== Infinity ? this.config.costLimit : null
    };
  }
  
  /**
   * Sprawdza, czy limit kosztów został przekroczony
   * 
   * @throws OpenRouterCostLimitError jeśli limit został przekroczony
   */
  private checkCostLimit(): void {    // Uproszczona wersja bez osobnego serwisu cost-tracker
    if (this.config.costLimit !== Infinity && this.totalCost >= this.config.costLimit) {
      throw new OpenRouterError(
        `Cost limit of $${this.config.costLimit.toFixed(2)} has been reached. Current usage: $${this.totalCost.toFixed(2)}.`,
        ErrorCode.COST_LIMIT_ERROR
      );
    }
  }
  
  /**
   * Śledzi użycie tokenów i oblicza koszty
   * 
   * @param usage Informacje o użyciu tokenów
   */
  private trackCostUsage(usage: TokenUsage): void {
    // Uproszczona wersja bez osobnego serwisu cost-tracker
    this.promptTokens += usage.prompt_tokens;
    this.completionTokens += usage.completion_tokens;
    
    // Przybliżone koszty - w rzeczywistości różne modele mają różne ceny
    // W pełnej wersji byłyby pobierane ceny dla konkretnego modelu
    const APPROX_PROMPT_COST_PER_1K = 0.01;
    const APPROX_COMPLETION_COST_PER_1K = 0.03;
    
    const promptCost = (usage.prompt_tokens / 1000) * APPROX_PROMPT_COST_PER_1K;
    const completionCost = (usage.completion_tokens / 1000) * APPROX_COMPLETION_COST_PER_1K;
    
    this.totalCost += promptCost + completionCost;
  }
  
  /**
   * Waliduje format odpowiedzi
   * 
   * @param format Format odpowiedzi do walidacji
   * @throws OpenRouterValidationError jeśli format jest nieprawidłowy
   */
  private validateResponseFormat(format: ResponseFormat): void {
    if (!format.type || !['json_object', 'text'].includes(format.type)) {
      throw new OpenRouterValidationError('Invalid response format type. Must be "json_object" or "text"');
    }
    
    if (format.type === 'json_object' && !format.schema) {
      throw new OpenRouterValidationError('JSON schema is required when using json_object response format');
    }
  }
    /**
   * Obsługuje i normalizuje błędy HTTP/API
   * 
   * @param error Błąd przechwycony podczas wykonywania żądania
   * @throws OpenRouterError z odpowiednimi informacjami o błędzie
   */  private handleError(error: any): never {
    console.error('OpenRouter API Error:', {
      isAxiosError: axios.isAxiosError(error),
      message: error?.message,
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      request: error?.request ? {
        method: error.request.method,
        path: error.request.path,
        url: error.request.url
      } : null,
      code: error?.code,
      config: error?.config ? {
        url: error.config.url,
        method: error.config.method,
        data: error.config.data
      } : null
    });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Odpowiedź serwera ze statusem błędu
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        console.error('Detailed error data:', data);
        
        const message = data?.error?.message || data?.error || axiosError.message || 'API error';
        
        // Specjalne przypadki statusów
        if (status === 401) {
          throw new OpenRouterAPIError('Invalid API key', status, ErrorCode.INVALID_API_KEY);
        } else if (status === 429) {
          // Sprawdzenie nagłówka retry-after
          const retryAfter = axiosError.response.headers['retry-after'];
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
          
          throw new OpenRouterRateLimitError('Rate limit exceeded', retrySeconds);
        }
        
        throw new OpenRouterAPIError(message, status);
      } else if (axiosError.request) {
        // Żądanie wysłane, ale brak odpowiedzi
        if (axiosError.code === 'ECONNABORTED') {
          throw new OpenRouterTimeoutError(`Request timed out after ${this.config.timeout}ms`, this.config.timeout);
        }
        
        throw new OpenRouterNetworkError('Network error: No response received', axiosError);
      }
      
      // Inny błąd Axios
      throw new OpenRouterNetworkError(`Network error: ${axiosError.message}`, axiosError);
    }
    
    // Nieznany błąd
    throw new OpenRouterError(`Unexpected error: ${error?.message || 'Unknown error'}`);
  }
}
