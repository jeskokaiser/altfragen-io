
import { useState, useEffect, useCallback } from 'react';
import { logError } from '@/utils/errorHandler';

/**
 * Custom hook for managing localStorage data with type safety, loading states, and error handling
 * 
 * @param key - The localStorage key to use for storage
 * @param initialValue - The initial value to use if no value is stored
 * @param options - Additional options for customizing behavior
 * @returns Object containing the value, setter, loading state, error state, and utility functions
 * 
 * @example
 * ```tsx
 * const { 
 *   value: questions, 
 *   setValue: setQuestions,
 *   isLoading,
 *   error,
 *   removeItem
 * } = useLocalStorage<Question[]>('trainingQuestions', []);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    expirationMs?: number;
  }
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Custom serialization/deserialization functions with fallbacks
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      
      const storedItem = localStorage.getItem(key);
      if (storedItem === null) {
        setValue(initialValue);
        return;
      }
      
      const parsedItem = deserialize(storedItem);
      
      // Check if the item has expired
      const storedWithMetadata = parsedItem && typeof parsedItem === 'object' && '_timestamp' in parsedItem;
      if (
        storedWithMetadata && 
        options?.expirationMs && 
        Date.now() - parsedItem._timestamp > options.expirationMs
      ) {
        // Item expired, remove it and use initial value
        localStorage.removeItem(key);
        setValue(initialValue);
      } else {
        // Item valid, use the stored value (remove metadata if present)
        if (storedWithMetadata) {
          const { _timestamp, ...data } = parsedItem;
          setValue(data as T);
        } else {
          setValue(parsedItem);
        }
      }
    } catch (err) {
      logError(err, { hook: 'useLocalStorage', key });
      setError(err instanceof Error ? err : new Error('Error loading from localStorage'));
      
      // Fallback to initial value on error
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue, options?.expirationMs, deserialize]);
  
  // Update localStorage when value changes
  const updateValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      setIsLoading(true);
      
      // Handle functional updates
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      
      // Add expiration metadata if needed
      const valueWithMetadata = options?.expirationMs
        ? { ...valueToStore, _timestamp: Date.now() }
        : valueToStore;
      
      // Update state with the new value (without metadata)
      setValue(valueToStore);
      
      // Store in localStorage with metadata if applicable
      localStorage.setItem(key, serialize(valueWithMetadata as any));
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      logError(err, { hook: 'useLocalStorage', key, value: newValue });
      setError(err instanceof Error ? err : new Error('Error saving to localStorage'));
    } finally {
      setIsLoading(false);
    }
  }, [key, value, options?.expirationMs, serialize]);
  
  // Remove item from localStorage
  const removeItem = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (err) {
      logError(err, { hook: 'useLocalStorage', key });
      setError(err instanceof Error ? err : new Error('Error removing from localStorage'));
    }
  }, [key, initialValue]);
  
  return {
    value,
    setValue: updateValue,
    isLoading,
    error,
    removeItem
  };
}

/**
 * Hook to access session data with loading and error states
 * 
 * @param key - The sessionStorage key to use
 * @param initialValue - Initial value if nothing is stored
 * @returns Object with value, setter, and state indicators
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    try {
      setIsLoading(true);
      const item = sessionStorage.getItem(key);
      setValue(item !== null ? JSON.parse(item) : initialValue);
    } catch (err) {
      logError(err, { hook: 'useSessionStorage', key });
      setError(err instanceof Error ? err : new Error('Error loading from sessionStorage'));
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue]);
  
  const updateValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      setIsLoading(true);
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      sessionStorage.setItem(key, JSON.stringify(valueToStore));
      setError(null);
    } catch (err) {
      logError(err, { hook: 'useSessionStorage', key, value: newValue });
      setError(err instanceof Error ? err : new Error('Error saving to sessionStorage'));
    } finally {
      setIsLoading(false);
    }
  }, [key, value]);
  
  const removeItem = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setValue(initialValue);
    } catch (err) {
      logError(err, { hook: 'useSessionStorage', key });
      setError(err instanceof Error ? err : new Error('Error removing from sessionStorage'));
    }
  }, [key, initialValue]);
  
  return {
    value,
    setValue: updateValue,
    isLoading,
    error,
    removeItem
  };
}
