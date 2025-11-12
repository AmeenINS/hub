/**
 * Performance Optimization Utilities
 * Helper functions and HOCs for optimizing React components
 */

import { useState, useEffect, useCallback, useRef, DependencyList } from 'react';

/**
 * Custom hook for debouncing values
 * Useful for search inputs and other frequently changing values
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * Useful for scroll handlers and resize events
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Custom hook for detecting if component is in viewport
 * Useful for lazy loading images or data
 */
export function useInView(ref: React.RefObject<HTMLElement>, rootMargin = '0px'): boolean {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, rootMargin]);

  return isInView;
}

/**
 * Custom hook that only runs effect when specified dependencies truly change
 * Uses deep comparison instead of reference comparison
 */
export function useDeepCompareEffect(
  callback: () => void | (() => void),
  dependencies: DependencyList
) {
  const currentDepsRef = useRef<DependencyList | undefined>(undefined);

  if (!currentDepsRef.current || !areDeepEqual(currentDepsRef.current, dependencies)) {
    currentDepsRef.current = dependencies;
  }

  useEffect(callback, [currentDepsRef.current]);
}

function areDeepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Custom hook for managing async operations
 * Prevents state updates on unmounted components
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((callback: () => void) => {
    if (isMountedRef.current) {
      callback();
    }
  }, []);

  return safeSetState;
}

/**
 * Custom hook for request deduplication
 * Prevents multiple identical requests from being made simultaneously
 */
const requestCache = new Map<string, Promise<any>>();

export function useDedupedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if request is already in progress
        let promise = requestCache.get(key);

        if (!promise) {
          // Create new request
          promise = fetcher();
          requestCache.set(key, promise);

          // Clean up cache after request completes
          promise.finally(() => {
            requestCache.delete(key);
          });
        }

        const result = await promise;

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...dependencies]);

  return { data, loading, error };
}
