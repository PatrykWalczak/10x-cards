/**
 * Eksport publicznego API serwisu OpenRouter
 *
 * Ten plik eksportuje wszystkie publiczne elementy serwisu OpenRouter,
 * w tym główną klasę serwisu, typy, błędy i funkcje pomocnicze.
 */

// Główna klasa serwisu
export { OpenRouterService } from "./openrouter.service";

// Typy
export type {
  OpenRouterConfig,
  RetryConfig,
  ModelInfo,
  CostUsageInfo,
  ChatMessage,
  MessageRole,
  CompletionParams,
  CompletionResponse,
  CompletionChoice,
  ResponseFormat,
  JSONSchema,
  TokenUsage,
} from "./types";

// Błędy
export {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterConfigError,
  OpenRouterCostLimitError,
  OpenRouterNetworkError,
  OpenRouterValidationError,
  OpenRouterTimeoutError,
  OpenRouterRateLimitError,
} from "./errors";

// Funkcje pomocnicze
export { createResponseFormat } from "./types";
export { validateConfig } from "./config";
