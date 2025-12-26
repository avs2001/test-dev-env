import type { ChatErrorCode, ChatMessageError } from './message.model';

/** Error code definitions with default messages and retry behavior */
export const ERROR_CODES: Record<
  ChatErrorCode,
  { readonly code: ChatErrorCode; readonly message: string; readonly retryable: boolean }
> = {
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    retryable: true,
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'Request timed out',
    retryable: true,
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Server error occurred',
    retryable: true,
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    retryable: true,
  },
  INVALID_CONTENT: {
    code: 'INVALID_CONTENT',
    message: 'Message content is invalid',
    retryable: false,
  },
  ATTACHMENT_TOO_LARGE: {
    code: 'ATTACHMENT_TOO_LARGE',
    message: 'File exceeds size limit',
    retryable: false,
  },
  ATTACHMENT_TYPE_NOT_ALLOWED: {
    code: 'ATTACHMENT_TYPE_NOT_ALLOWED',
    message: 'File type is not allowed',
    retryable: false,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    retryable: false,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access denied',
    retryable: false,
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred',
    retryable: true,
  },
};

/**
 * Factory function to create a ChatMessageError
 * @param code - Error code
 * @param customMessage - Optional custom message to override default
 * @param retryCount - Number of retry attempts made
 * @returns ChatMessageError object
 */
export function createError(
  code: ChatErrorCode,
  customMessage?: string,
  retryCount = 0
): ChatMessageError {
  const errorDef = ERROR_CODES[code] ?? ERROR_CODES.UNKNOWN;
  return {
    code,
    message: customMessage ?? errorDef.message,
    retryable: errorDef.retryable,
    retryCount,
    lastRetryAt: retryCount > 0 ? new Date() : undefined,
  };
}

/**
 * Check if an error is retryable based on its code and retry count
 * @param error - The error to check
 * @param maxRetries - Maximum number of retries allowed
 * @returns Whether the error can be retried
 */
export function isRetryable(error: ChatMessageError, maxRetries = 3): boolean {
  if (!error.retryable) {
    return false;
  }
  return (error.retryCount ?? 0) < maxRetries;
}

/**
 * Create an error with incremented retry count
 * @param error - The original error
 * @returns New error with incremented retry count
 */
export function incrementRetryCount(error: ChatMessageError): ChatMessageError {
  return {
    ...error,
    retryCount: (error.retryCount ?? 0) + 1,
    lastRetryAt: new Date(),
  };
}
