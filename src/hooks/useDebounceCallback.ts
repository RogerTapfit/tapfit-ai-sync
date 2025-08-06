import { useCallback, useRef, useState } from 'react';

interface DebounceOptions {
  delay: number;
  maxWait?: number;
}

interface DebounceResult<T extends (...args: any[]) => any> {
  debouncedCallback: T;
  isLoading: boolean;
  error: string | null;
  cancel: () => void;
  flush: () => void;
}

export const useDebounceCallback = <T extends (...args: any[]) => Promise<any>>(
  callback: T,
  options: DebounceOptions
): DebounceResult<T> => {
  const { delay, maxWait } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);
  const promiseRef = useRef<{ resolve: (value: any) => void; reject: (error: any) => void } | null>(null);

  const execute = useCallback(async () => {
    if (!argsRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await callback(...argsRef.current);
      
      if (promiseRef.current) {
        promiseRef.current.resolve(result);
        promiseRef.current = null;
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      if (promiseRef.current) {
        promiseRef.current.reject(err);
        promiseRef.current = null;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
      argsRef.current = null;
    }
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    
    if (promiseRef.current) {
      promiseRef.current.reject(new Error('Debounced call was cancelled'));
      promiseRef.current = null;
    }
    
    setIsLoading(false);
    setError(null);
    argsRef.current = null;
  }, []);

  const flush = useCallback(async () => {
    cancel();
    return execute();
  }, [cancel, execute]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return new Promise((resolve, reject) => {
        // Store the arguments and promise handlers
        argsRef.current = args;
        promiseRef.current = { resolve, reject };
        
        // Clear existing timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set up the debounced execution
        timeoutRef.current = setTimeout(execute, delay);
        
        // Set up max wait timeout if specified
        if (maxWait && !maxWaitTimeoutRef.current) {
          maxWaitTimeoutRef.current = setTimeout(() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            execute();
          }, maxWait);
        }
      });
    },
    [delay, maxWait, execute]
  ) as T;

  return {
    debouncedCallback,
    isLoading,
    error,
    cancel,
    flush
  };
};