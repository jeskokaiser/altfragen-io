
/**
 * Utility for standardized error handling across the application
 */

export class AppError extends Error {
  public readonly originalError?: unknown;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, originalError?: unknown, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.originalError = originalError;
    this.context = context;
    
    // Preserves proper stack trace in modern JavaScript engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Handles API errors in a consistent way across the application
 */
export const handleApiError = (error: unknown, fallbackMessage: string = "An error occurred"): AppError => {
  console.error("API Error:", error);
  
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, error);
  }
  
  return new AppError(fallbackMessage, error);
};

/**
 * Logs the error to the console and optionally sends it to an error tracking service
 */
export const logError = (error: unknown, context?: Record<string, unknown>): void => {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(error instanceof Error ? error.message : 'Unknown error', error, context);

  console.error("Application error:", {
    message: appError.message,
    originalError: appError.originalError,
    context: appError.context,
    stack: appError.stack
  });

  // If we had an error tracking service, we would send the error here
  // For example: errorTrackingService.captureException(appError);
};
