/**
 * Configuration management for OpenRouter service
 *
 * This file contains functionality for managing and validating the
 * service configuration.
 */
import type { OpenRouterConfig, RetryConfig } from "./types";
import { OpenRouterConfigError } from "./errors";

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<OpenRouterConfig> = {
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "meta-llama/llama-3.2-3b-instruct:free",
  timeout: 30000, // 30 seconds
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 500,
  },
};

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 500,
};

/**
 * Validates the OpenRouter configuration, throwing errors for invalid values
 *
 * @param config The configuration to validate
 * @returns The validated configuration with defaults applied
 * @throws OpenRouterConfigError if the configuration is invalid
 */
export function validateConfig(config: OpenRouterConfig): Required<OpenRouterConfig> {
  if (!config) {
    throw new OpenRouterConfigError("Configuration is required");
  }

  if (!config.apiKey) {
    throw new OpenRouterConfigError("API key is required");
  }

  if (config.costLimit !== undefined && (typeof config.costLimit !== "number" || config.costLimit <= 0)) {
    throw new OpenRouterConfigError("Cost limit must be a positive number");
  }

  if (config.timeout !== undefined && (typeof config.timeout !== "number" || config.timeout <= 0)) {
    throw new OpenRouterConfigError("Timeout must be a positive number");
  }

  // Apply default values
  const validatedConfig: Required<OpenRouterConfig> = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || DEFAULT_CONFIG.baseUrl || "https://openrouter.ai/api/v1",
    defaultModel: config.defaultModel || DEFAULT_CONFIG.defaultModel || "meta-llama/llama-3.2-3b-instruct:free",
    costLimit: config.costLimit !== undefined ? config.costLimit : Infinity,
    timeout: config.timeout || DEFAULT_CONFIG.timeout || 30000,
    retryConfig: {
      ...DEFAULT_RETRY_CONFIG,
      ...(config.retryConfig || {}),
    },
  };

  validateRetryConfig(validatedConfig.retryConfig);

  return validatedConfig;
}

/**
 * Validates the retry configuration
 *
 * @param retryConfig The retry configuration to validate
 * @throws OpenRouterConfigError if the retry configuration is invalid
 */
function validateRetryConfig(retryConfig: RetryConfig): void {
  if (retryConfig.maxRetries < 0 || !Number.isInteger(retryConfig.maxRetries)) {
    throw new OpenRouterConfigError("maxRetries must be a non-negative integer");
  }

  if (retryConfig.backoffMultiplier <= 0) {
    throw new OpenRouterConfigError("backoffMultiplier must be a positive number");
  }

  if (retryConfig.initialDelay <= 0) {
    throw new OpenRouterConfigError("initialDelay must be a positive number");
  }
}
