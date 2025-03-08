
import { 
  AppError, 
  handleApiError, 
  logError,
  getUserFriendlyErrorMessage,
  ErrorCode
} from '@/utils/errorHandler';

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('errorHandler utilities', () => {
  describe('AppError', () => {
    it('should create an instance with the correct properties', () => {
      const context = { userId: '123' };
      const originalError = new Error('Original error');
      const error = new AppError('Test error', originalError, context, ErrorCode.VALIDATION);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('Test error');
      expect(error.originalError).toBe(originalError);
      expect(error.context).toBe(context);
      expect(error.code).toBe(ErrorCode.VALIDATION);
    });
  });
  
  describe('handleApiError', () => {
    it('should return the original error if it is an AppError', () => {
      const originalError = new AppError('Original AppError');
      const result = handleApiError(originalError);
      
      expect(result).toBe(originalError);
    });
    
    it('should wrap a standard Error in an AppError', () => {
      const originalError = new Error('Standard error');
      const result = handleApiError(originalError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Standard error');
      expect(result.originalError).toBe(originalError);
    });
    
    it('should handle non-Error objects with a fallback message', () => {
      const result = handleApiError('Not an error', 'Fallback message');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Fallback message');
      expect(result.originalError).toBe('Not an error');
    });
  });
  
  describe('logError', () => {
    it('should log the error details to the console', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };
      
      logError(error, context);
      
      expect(console.error).toHaveBeenCalled();
      const consoleArgs = (console.error as jest.Mock).mock.calls[0][1];
      expect(consoleArgs.message).toBe('Test error');
      expect(consoleArgs.context).toEqual(context);
    });
    
    it('should wrap non-AppError errors in an AppError', () => {
      logError('Not an error');
      
      expect(console.error).toHaveBeenCalled();
      const consoleArgs = (console.error as jest.Mock).mock.calls[0][1];
      expect(consoleArgs.message).toBe('Unknown error');
    });
  });
  
  describe('getUserFriendlyErrorMessage', () => {
    it('should return the error message for an AppError', () => {
      const error = new AppError('Custom error message');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe('Custom error message');
    });
    
    it('should return specific messages based on error codes', () => {
      const unauthorizedError = new AppError('Auth error', null, null, ErrorCode.UNAUTHORIZED);
      expect(getUserFriendlyErrorMessage(unauthorizedError)).toBe('Du bist nicht berechtigt, diese Aktion durchzuführen');
      
      const notFoundError = new AppError('Not found', null, null, ErrorCode.NOT_FOUND);
      expect(getUserFriendlyErrorMessage(notFoundError)).toBe('Die angeforderte Ressource wurde nicht gefunden');
    });
    
    it('should use the default message for unknown errors', () => {
      const message = getUserFriendlyErrorMessage(null, 'Default message');
      expect(message).toBe('Default message');
    });
  });
});
