
import { useState, useCallback } from 'react';
import { showToast } from '@/utils/toast';
import { handleApiError, logError } from '@/utils/errorHandler';

interface UseLoadingStateOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorMessage?: string;
}

/**
 * Hook for managing loading state, errors, and toast messages
 */
export const useLoadingState = <T>(options: UseLoadingStateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async <R>(
    asyncFunction: () => Promise<R>,
    customOptions?: UseLoadingStateOptions
  ): Promise<R | null> => {
    const mergedOptions = { ...options, ...customOptions };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result as unknown as T);
      
      if (mergedOptions.showSuccessToast && mergedOptions.successMessage) {
        showToast.success(mergedOptions.successMessage);
      }
      
      return result;
    } catch (err) {
      const appError = handleApiError(err, mergedOptions.errorMessage || 'An error occurred');
      setError(appError);
      logError(appError);
      
      if (mergedOptions.showErrorToast) {
        showToast.error(mergedOptions.errorMessage || appError.message);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

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
