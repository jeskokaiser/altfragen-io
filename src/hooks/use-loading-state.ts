
import { useState, useCallback, useEffect } from 'react';
import { showToast } from '@/utils/toast';
import { handleApiError, logError, getUserFriendlyErrorMessage } from '@/utils/errorHandler';

interface UseLoadingStateOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorMessage?: string;
  autoReset?: boolean;
  resetDelay?: number;
}

/**
 * Hook for managing loading state, errors, and toast messages in a consistent way
 * 
 * @param options - Configuration options for the loading state
 * @returns An object with loading state, error, data, and functions to execute async operations
 * 
 * @example
 * ```tsx
 * const { isLoading, error, data, execute } = useLoadingState<User>({
 *   showSuccessToast: true,
 *   successMessage: 'User profile updated!',
 *   showErrorToast: true
 * });
 * 
 * const handleSubmit = () => {
 *   execute(async () => {
 *     const result = await updateUserProfile(user);
 *     return result;
 *   });
 * };
 * ```
 */
export const useLoadingState = <T>(options: UseLoadingStateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Default options
  const defaultOptions: UseLoadingStateOptions = {
    showSuccessToast: false,
    successMessage: 'Operation completed successfully',
    showErrorToast: true,
    errorMessage: undefined,
    autoReset: false,
    resetDelay: 3000
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Auto-reset error state after delay if autoReset is enabled
    if (error && mergedOptions.autoReset && mergedOptions.resetDelay) {
      timeoutId = setTimeout(() => {
        setError(null);
      }, mergedOptions.resetDelay);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [error, mergedOptions.autoReset, mergedOptions.resetDelay]);

  /**
   * Executes an async function with loading state management
   * 
   * @param asyncFunction - The async function to execute
   * @param customOptions - Custom options for this specific execution
   * @returns The result of the async function or null if there was an error
   */
  const execute = useCallback(async <R>(
    asyncFunction: () => Promise<R>,
    customOptions?: UseLoadingStateOptions
  ): Promise<R | null> => {
    const execOptions = { ...mergedOptions, ...customOptions };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result as unknown as T);
      
      if (execOptions.showSuccessToast && execOptions.successMessage) {
        showToast.success(execOptions.successMessage);
      }
      
      return result;
    } catch (err) {
      const appError = handleApiError(err, execOptions.errorMessage || 'An error occurred');
      setError(appError);
      logError(appError);
      
      if (execOptions.showErrorToast) {
        const errorMessage = getUserFriendlyErrorMessage(
          appError, 
          execOptions.errorMessage || 'Ein Fehler ist aufgetreten'
        );
        showToast.error(errorMessage);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mergedOptions]);

  /**
   * Resets the loading state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  };
};
