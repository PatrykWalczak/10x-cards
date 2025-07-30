/**
 * Types for OpenRouter Service
 *
 * This file contains all TypeScript types and interfaces used by the OpenRouter service.
 */

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterConfig {
  apiKey: string; // API key for OpenRouter (required)
  baseUrl?: string; // Base URL for API (optional)
  defaultModel?: string; // Default AI model to use
  costLimit?: number; // Cost limit in USD
  timeout?: number; // HTTP request timeout in ms
  retryConfig?: RetryConfig; // Configuration for retry logic
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxRetries: number; // Maximum number of retries
  backoffMultiplier: number; // Delay multiplier for exponential backoff
  initialDelay: number; // Initial delay in ms
}

/**
 * Information about an AI model
 */
export interface ModelInfo {
  id: string; // Model identifier
  name: string; // Human-readable name
  description?: string; // Model description
  context_length: number; // Maximum context length
  pricing: {
    prompt: number; // Cost per 1K tokens for prompt
    completion: number; // Cost per 1K tokens for completion
  };
}

/**
 * Cost usage information
 */
export interface CostUsageInfo {
  totalCost: number; // Total cost used in USD
  tokenUsage: {
    prompt: number; // Number of prompt tokens used
    completion: number; // Number of completion tokens used
    total: number; // Total tokens used
  };
  limitReached: boolean; // Whether cost limit has been reached
  costLimit: number | null; // The configured cost limit, if any
}

/**
 * Token usage information returned by the API
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Message role for chat completions
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/**
 * Single message in a chat completion
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

/**
 * JSON Schema for structured output
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: JSONSchema;
  [key: string]: unknown;
}

/**
 * Response format configuration
 */
export interface ResponseFormat {
  type: "json_object" | "text";
  schema?: JSONSchema;
}

/**
 * Parameters for completion request
 */
export interface CompletionParams {
  model?: string; // Model ID to use (optional, falls back to default)
  messages: ChatMessage[]; // Array of chat messages
  responseFormat?: ResponseFormat; // Format for the response
  temperature?: number; // Sampling temperature (0-1)
  max_tokens?: number; // Maximum tokens to generate
  stream?: boolean; // Whether to stream the response
  stop?: string[]; // Stop sequences
}

/**
 * Choice returned in completion response
 */
export interface CompletionChoice<T = unknown> {
  index: number;
  message: {
    role: MessageRole;
    content: string;
    parsed?: T; // Parsed JSON result when using structured output
  };
  finish_reason: string;
}

/**
 * Response from completion request
 */
export interface CompletionResponse<T = unknown> {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CompletionChoice<T>[];
  usage: TokenUsage;
}

/**
 * Helper function to create response format with JSON schema
 */
export function createResponseFormat(name: string, schema: JSONSchema): ResponseFormat {
  return {
    type: "json_object",
    schema,
  };
}

/**
 * Available error codes
 */
export enum ErrorCode {
  API_ERROR = "API_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  COST_LIMIT_ERROR = "COST_LIMIT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  INVALID_API_KEY = "INVALID_API_KEY",
}
