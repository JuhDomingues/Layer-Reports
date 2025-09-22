import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export interface RetryResult<T> {
  result?: T;
  error?: any;
  attempts: number;
  totalTime: number;
  success: boolean;
}

/**
 * Default retryable error checker for Facebook API
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP status codes that should be retried
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  // Facebook API specific error codes that are retryable
  const retryableFacebookCodes = [
    1,    // API Unknown error
    2,    // API Service temporarily unavailable
    4,    // API Too many calls
    17,   // API User request limit reached
    80004 // Throttled
  ];

  const fbErrorCode = error.response?.data?.error?.code;
  if (fbErrorCode && retryableFacebookCodes.includes(fbErrorCode)) {
    return true;
  }

  return false;
}

/**
 * Retry handler with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = isRetryableError,
    onRetry
  } = options;

  const startTime = Date.now();
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      const totalTime = Date.now() - startTime;

      logger.debug('Operation succeeded', {
        attempt,
        totalTime,
        retriesUsed: attempt - 1
      });

      return {
        result,
        attempts: attempt,
        totalTime,
        success: true
      };
    } catch (error) {
      lastError = error;
      
      logger.warn('Operation failed', {
        attempt,
        maxAttempts,
        error: error.message,
        errorCode: error.response?.data?.error?.code,
        statusCode: error.response?.status
      });

      // Check if we should retry
      if (attempt === maxAttempts || !retryableErrors(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const finalDelay = delay + jitter;

      logger.info('Retrying operation', {
        attempt: attempt + 1,
        maxAttempts,
        delayMs: Math.round(finalDelay),
        retriesRemaining: maxAttempts - attempt
      });

      // Call retry callback if provided
      if (onRetry) {
        try {
          onRetry(error, attempt);
        } catch (callbackError) {
          logger.warn('Retry callback failed', { error: callbackError });
        }
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  const totalTime = Date.now() - startTime;

  logger.error('Operation failed after all retries', {
    attempts: maxAttempts,
    totalTime,
    finalError: lastError.message,
    errorCode: lastError.response?.data?.error?.code,
    statusCode: lastError.response?.status
  });

  return {
    error: lastError,
    attempts: maxAttempts,
    totalTime,
    success: false
  };
}

/**
 * Retry-aware Facebook API wrapper
 */
export class RetryableFacebookApi {
  private retryOptions: RetryOptions;

  constructor(retryOptions: Partial<RetryOptions> = {}) {
    this.retryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: isRetryableError,
      ...retryOptions
    };
  }

  /**
   * Execute API call with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const options = { ...this.retryOptions, ...customOptions };
    
    const result = await withRetry(operation, {
      ...options,
      onRetry: (error, attempt) => {
        logger.warn(`${operationName} retry`, {
          attempt,
          error: error.message,
          errorCode: error.response?.data?.error?.code
        });
        
        // Call custom onRetry if provided
        if (options.onRetry) {
          options.onRetry(error, attempt);
        }
      }
    });

    if (!result.success) {
      throw result.error;
    }

    return result.result!;
  }

  /**
   * Create retry options for specific Facebook API rate limits
   */
  static createRateLimitOptions(): RetryOptions {
    return {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      retryableErrors: (error) => {
        // Rate limit specific errors
        const fbErrorCode = error.response?.data?.error?.code;
        const statusCode = error.response?.status;
        
        return (
          statusCode === 429 || // Too Many Requests
          fbErrorCode === 4 ||  // API Too many calls
          fbErrorCode === 17 || // API User request limit reached
          fbErrorCode === 80004 // Throttled
        );
      }
    };
  }

  /**
   * Create retry options for network/temporary errors
   */
  static createNetworkErrorOptions(): RetryOptions {
    return {
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryableErrors: (error) => {
        return (
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          [500, 502, 503, 504].includes(error.response?.status)
        );
      }
    };
  }
}

/**
 * Circuit breaker pattern for Facebook API
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private monitorWindow: number = 300000   // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN - too many recent failures');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info('Circuit breaker reset to CLOSED after successful call');
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened due to failures', {
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}