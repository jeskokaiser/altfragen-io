
import { toast } from 'sonner';

/**
 * Generic error handler for API calls
 * @param error - The error to handle
 * @param customMessage - Optional custom error message
 */
export const handleAPIError = (error: unknown, customMessage?: string): void => {
  console.error('API Error:', error);
  
  let errorMessage = customMessage || 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: string }).message);
  }
  
  toast.error('Error', {
    description: errorMessage
  });
};

/**
 * Wrapper function for API calls to handle errors consistently
 * @param apiCall - The API call to execute
 * @param errorMessage - Optional custom error message
 */
export async function safeAPICall<T>(
  apiCall: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    handleAPIError(error, errorMessage);
    return null;
  }
}
