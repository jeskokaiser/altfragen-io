
/**
 * Utility for standardized error handling across the application
 */

export class AppError extends Error {
  public readonly originalError?: unknown;
  public readonly context?: Record<string, unknown>;
  public readonly code?: string;

  constructor(
    message: string, 
    originalError?: unknown, 
    context?: Record<string, unknown>,
    code?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.originalError = originalError;
    this.context = context;
    this.code = code;
    
    // Preserves proper stack trace in modern JavaScript engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error codes for common application errors
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Handles API errors in a consistent way across the application
 * @param error - The error to handle
 * @param fallbackMessage - A fallback message to use if the error doesn't have a message
 * @returns An AppError instance
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
 * @param error - The error to log
 * @param context - Additional context for the error
 */
export const logError = (error: unknown, context?: Record<string, unknown>): void => {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(error instanceof Error ? error.message : 'Unknown error', error, context);

  console.error("Application error:", {
    message: appError.message,
    originalError: appError.originalError,
    context: appError.context,
    stack: appError.stack,
    code: appError.code
  });

  // If we had an error tracking service, we would send the error here
  // For example: errorTrackingService.captureException(appError);
};

/**
 * Gets a user-friendly error message based on the error
 * @param error - The error to get a message for
 * @param defaultMessage - A default message to use if the error doesn't have a message
 * @returns A user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: unknown, defaultMessage: string = "Ein Fehler ist aufgetreten"): string => {
  if (error instanceof AppError) {
    // Return a user-friendly message based on the error code
    if (error.code === ErrorCode.UNAUTHORIZED) {
      return "Du bist nicht berechtigt, diese Aktion durchzuführen";
    }
    if (error.code === ErrorCode.NOT_FOUND) {
      return "Die angeforderte Ressource wurde nicht gefunden";
    }
    if (error.code === ErrorCode.VALIDATION) {
      return "Bitte überprüfe deine Eingaben";
    }
    if (error.code === ErrorCode.NETWORK_ERROR) {
      return "Netzwerkfehler. Bitte überprüfe deine Internetverbindung";
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
};
