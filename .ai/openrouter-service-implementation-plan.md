# OpenRouter Service - Plan Implementacji

## 1. Opis Usługi

OpenRouter Service to centralna usługa do komunikacji z API OpenRouter.ai, zaprojektowana specjalnie dla aplikacji 10x-cards. Usługa zapewnia:

- **Zunifikowany interfejs** do różnych modeli AI (OpenAI, Anthropic, Google)
- **Type-safe komunikację** z pełnym wsparciem TypeScript 5
- **Zarządzanie kosztami** z limitami i monitorowaniem użycia
- **Structured responses** przez JSON Schema validation
- **Integrację z Astro 5** i istniejącymi serwisami aplikacji
- **Obsługę błędów** z retry logic i graceful degradation

## 2. Opis Konstruktora

```typescript
interface OpenRouterConfig {
  apiKey: string;                    // Klucz API OpenRouter (wymagany) 
  baseUrl?: string;                 // URL bazowy API (opcjonalny)
  defaultModel?: string;            // Domyślny model AI
  costLimit?: number;               // Limit kosztów w USD
  timeout?: number;                 // Timeout żądań HTTP w ms
  retryConfig?: RetryConfig;        // Konfiguracja retry logic
}

interface RetryConfig {
  maxRetries: number;               // Maksymalna liczba powtórzeń
  backoffMultiplier: number;        // Mnożnik opóźnienia
  initialDelay: number;             // Początkowe opóźnienie w ms
}

class OpenRouterService {
  constructor(config: OpenRouterConfig)
}
```

## 3. Publiczne Metody i Pola

### 3.1 Metody Główne

#### generateCompletion
```typescript
async generateCompletion<T>(params: CompletionParams<T>): Promise<CompletionResponse<T>>
```
Główna metoda do generowania odpowiedzi z modelami AI z obsługą structured output.

#### getAvailableModels
```typescript
async getAvailableModels(): Promise<ModelInfo[]>
```
Pobiera listę dostępnych modeli z OpenRouter API.

#### getCostUsage
```typescript
getCostUsage(): CostUsageInfo
```
Zwraca informacje o zużyciu.

#### validateApiKey
```typescript
async validateApiKey(): Promise<boolean>
```
Sprawdza poprawność klucza API.

### 3.2 Pola

```typescript
readonly config: Readonly<OpenRouterConfig>  // Konfiguracja tylko do odczytu
readonly isConfigured: boolean               // Status konfiguracji
```

## 4. Prywatne Metody i Pola

### 4.1 Metody

```typescript
private async buildRequest(params: CompletionParams): Promise<RequestInit>
private async handleResponse<T>(response: Response): Promise<T>
private async retryRequest<T>(fn: () => Promise<T>): Promise<T>
private validateResponseFormat(format: ResponseFormat): void
private trackCostUsage(usage: TokenUsage): void
private checkCostLimit(): void
```

### 4.2 Pola

```typescript
private httpClient: AxiosInstance
private costTracker: CostTracker
private retryManager: RetryManager
```

## 5. Obsługa Błędów

### 5.1 Hierarchia Błędów

```typescript
class OpenRouterError extends Error
class OpenRouterAPIError extends OpenRouterError
class OpenRouterConfigError extends OpenRouterError
class OpenRouterCostLimitError extends OpenRouterError
class OpenRouterNetworkError extends OpenRouterError
class OpenRouterValidationError extends OpenRouterError
```

### 5.2 Scenariusze i Obsługa

1. **Błędy Autoryzacji (401)**
   ```typescript
   throw new OpenRouterAPIError('Invalid API key', 401, 'INVALID_API_KEY');
   ```

2. **Przekroczenie Limitów (429)**
   ```typescript
   throw new OpenRouterAPIError('Rate limit exceeded', 429, 'RATE_LIMITED');
   ```

3. **Błędy Sieci**
   ```typescript
   throw new OpenRouterNetworkError('Network timeout', error);
   ```

4. **Błędy Walidacji**
   ```typescript
   throw new OpenRouterValidationError('Invalid response format', details);
   ```

## 6. Kwestie Bezpieczeństwa

### 6.1 Zarządzanie Kluczami API
- Przechowywanie w zmiennych środowiskowych
- Nigdy nie logowanie kluczy
- Regularny rotation kluczy

### 6.2 Limity i Monitoring
- Hard i soft limity kosztów
- Monitorowanie użycia w czasie rzeczywistym
- Alerty przy przekroczeniu progów

### 6.3 Walidacja Danych
- Sanityzacja wszystkich inputs
- Walidacja schematów JSON
- Content filtering

## 7. Plan Wdrożenia

### Krok 1: Instalacja Zależności

```bash
npm install axios zod env-cmd
npm install --save-dev @types/node
```

### Krok 2: Struktura Plików

```
src/lib/services/openrouter/
├── index.ts              # Eksport publicznego API
├── types.ts             # TypeScript types/interfaces
├── errors.ts            # Custom error classes
├── config.ts            # Configuration management
├── cost-tracker.ts      # Cost tracking implementation
├── retry-manager.ts     # Retry logic
└── openrouter.service.ts # Main service implementation
```

### Krok 3: Implementacja Kluczowych Komponentów

1. **types.ts** - Definicje typów
2. **errors.ts** - Klasy błędów
3. **config.ts** - Zarządzanie konfiguracją
4. **cost-tracker.ts** - Śledzenie kosztów
5. **retry-manager.ts** - Logika retry
6. **openrouter.service.ts** - Główna implementacja

### Krok 4: Konfiguracja Środowiska

**.env.local**:
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-4
OPENROUTER_COST_LIMIT=10.00
```

### Krok 5: Przykład Użycia

```typescript
// src/lib/services/ai.service.ts
import { OpenRouterService, createResponseFormat } from './openrouter';

export class AIService {
  private openRouter = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY!,
    costLimit: 10,
    defaultModel: 'openai/gpt-4'
  });

  async generateFlashcards(text: string, count: number = 5) {
    const format = createResponseFormat('flashcards', {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' }
            }
          }
        }
      }
    });

    const response = await this.openRouter.generateCompletion({
      model: 'openai/gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert flashcard generator.'
        },
        {
          role: 'user',
          content: `Generate ${count} flashcards from: ${text}`
        }
      ],
      responseFormat: format,
      temperature: 0.7
    });

    return response.choices[0].message.parsed?.flashcards || [];
  }
}
```

### Krok 6: Testy

1. Utworzenie testów jednostkowych
2. Testy integracyjne z API
3. Testy obsługi błędów
4. Testy wydajnościowe

### Krok 7: Dokumentacja i Monitoring

1. Dokumentacja API i przykłady użycia
2. Setup monitoringu kosztów
3. Konfiguracja logowania błędów
4. Implementacja metryk użycia

### Krok 8: Deployment

1. Konfiguracja zmiennych środowiskowych w CI/CD
2. Setup monitoringu produkcyjnego
3. Wdrożenie na staging
4. Wdrożenie na produkcję