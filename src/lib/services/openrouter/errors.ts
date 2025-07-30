/**
 * Error classes for OpenRouter service
 *
 * This file contains custom error classes for different error scenarios
 * that may occur when using the OpenRouter service.
 */
import { ErrorCode } from "./types";

/**
 * Base error class for all OpenRouter errors
 */
export class OpenRouterError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode = ErrorCode.API_ERROR) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;

    // Ensure proper prototype chaining in transpiled JS
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Error class for API-related errors
 */
export class OpenRouterAPIError extends OpenRouterError {
  status: number;

  constructor(message: string, status: number, code: ErrorCode = ErrorCode.API_ERROR) {
    super(message, code);
    this.name = "OpenRouterAPIError";
    this.status = status;

    Object.setPrototypeOf(this, OpenRouterAPIError.prototype);
  }
}

/**
 * Error class for configuration errors
 */
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message, ErrorCode.CONFIG_ERROR);
    this.name = "OpenRouterConfigError";

    Object.setPrototypeOf(this, OpenRouterConfigError.prototype);
  }
}

/**
 * Error class for cost limit errors
 */
export class OpenRouterCostLimitError extends OpenRouterError {
  limit: number;
  usage: number;

  constructor(message: string, limit: number, usage: number) {
    super(message, ErrorCode.COST_LIMIT_ERROR);
    this.name = "OpenRouterCostLimitError";
    this.limit = limit;
    this.usage = usage;

    Object.setPrototypeOf(this, OpenRouterCostLimitError.prototype);
  }
}

/**
 * Error class for network errors
 */
export class OpenRouterNetworkError extends OpenRouterError {
  originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message, ErrorCode.NETWORK_ERROR);
    this.name = "OpenRouterNetworkError";
    this.originalError = originalError;

    Object.setPrototypeOf(this, OpenRouterNetworkError.prototype);
  }
}

/**
 * Error class for validation errors
 */
export class OpenRouterValidationError extends OpenRouterError {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR);
    this.name = "OpenRouterValidationError";
    this.details = details;

    Object.setPrototypeOf(this, OpenRouterValidationError.prototype);
  }
}

/**
 * Error class for timeout errors
 */
export class OpenRouterTimeoutError extends OpenRouterError {
  timeout: number;

  constructor(message: string, timeout: number) {
    super(message, ErrorCode.TIMEOUT_ERROR);
    this.name = "OpenRouterTimeoutError";
    this.timeout = timeout;

    Object.setPrototypeOf(this, OpenRouterTimeoutError.prototype);
  }
}

/**
 * Error class for rate limit errors
 */
export class OpenRouterRateLimitError extends OpenRouterAPIError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, ErrorCode.RATE_LIMIT_ERROR);
    this.name = "OpenRouterRateLimitError";
    this.retryAfter = retryAfter;

    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}
