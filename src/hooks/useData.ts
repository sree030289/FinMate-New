import { useState, useEffect, useCallback, useRef } from 'react';
import { handleError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitForAuthReady } from '../utils/authUtils';

interface UseFetchOptions {
  cacheKey?: string;
  cacheDuration?: number; // Duration in milliseconds
  dependencies?: any[];
  initialData?: any;
  skipIfNoAuth?: boolean; // Skip fetch if no auth
  retries?: number; // Number of retries on failure
  retryDelay?: number; // Delay between retries in milliseconds
  fallbackToCache?: boolean; // Whether to fallback to cache on error, even if cache is expired
}

/**
 * Hook for handling data fetching with loading, error states, and optional caching
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    dependencies = [],
    initialData = null,
    skipIfNoAuth = false, // Default to false for backward compatibility
    retries = 2, // Default to 2 retries
    retryDelay = 1000, // Default to 1 second delay
    fallbackToCache = true // Default to fallback to cache on error
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Function to check if cache is valid
  const isCacheValid = useCallback((timestamp: number): boolean => {
    if (!cacheDuration) return false;
    return Date.now() - timestamp < cacheDuration;
  }, [cacheDuration]);

  // Function to get data from cache
  const getFromCache = useCallback(async (): Promise<{ data: T | null; timestamp: number | null }> => {
    if (!cacheKey) return { data: null, timestamp: null };

    try {
      const cachedData = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (!cachedData) return { data: null, timestamp: null };

      const parsed = JSON.parse(cachedData);
      return {
        data: parsed.data,
        timestamp: parsed.timestamp
      };
    } catch (err) {
      console.warn('Error reading from cache:', err);
      return { data: null, timestamp: null };
    }
  }, [cacheKey]);

  // Function to store data in cache
  const storeInCache = useCallback(async (data: T) => {
    if (!cacheKey) return;

    try {
      const timestamp = Date.now();
      await AsyncStorage.setItem(
        `cache_${cacheKey}`,
        JSON.stringify({ data, timestamp })
      );
      setLastFetched(timestamp);
    } catch (err) {
      console.warn('Error writing to cache:', err);
    }
  }, [cacheKey]);

  // Use useRef to keep reference to fetchFn without causing re-renders
  const fetchFnRef = useRef(fetchFn);
  
  // Update the ref when fetchFn changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async (ignoreCache: boolean = false, retriesLeft: number = retries) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if we're authenticated if skipIfNoAuth is enabled
      if (skipIfNoAuth) {
        const isAuth = await waitForAuthReady();
        if (!isAuth) {
          setError({ message: "No authenticated user" });
          setIsLoading(false);
          return;
        }
      }

      // Check cache first if enabled and not explicitly ignoring cache
      if (cacheKey && !ignoreCache) {
        const { data: cachedData, timestamp } = await getFromCache();
        
        if (cachedData && timestamp && isCacheValid(timestamp)) {
          setData(cachedData);
          setLastFetched(timestamp);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data using the ref to avoid dependency cycle
      const result = await fetchFnRef.current();
      setData(result);
      
      // Cache the result if caching is enabled
      if (cacheKey) {
        await storeInCache(result);
      }
    } catch (err) {
      // Log the error
      const errorData = handleError(err, 'useFetch');
      console.error('[USEFETCH] Error:', errorData);

      // Retry logic if we have retries left
      if (retriesLeft > 0) {
        console.log(`[USEFETCH] Retrying... ${retriesLeft} attempts left`);
        setTimeout(() => {
          fetchData(ignoreCache, retriesLeft - 1);
        }, retryDelay);
        return;
      }

      // Try to get data from cache, even if expired
      if (fallbackToCache && cacheKey) {
        console.log('[USEFETCH] Trying to fallback to cache after error');
        const { data: cachedData, timestamp } = await getFromCache();
        
        if (cachedData && timestamp) {
          console.log('[USEFETCH] Using expired cache data after fetch failure');
          setData(cachedData);
          setLastFetched(timestamp);
          // Set error but still provide cached data
          setError({ 
            message: "Using cached data. Refresh to try again.",
            code: errorData.code 
          });
          setIsLoading(false);
          return;
        }
      }

      // If we reach here, we've exhausted retries and have no cache
      setError({ message: errorData.message, code: errorData.code });
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, getFromCache, storeInCache, isCacheValid, skipIfNoAuth, retries, retryDelay, fallbackToCache]);

  // Refetch function that can be called from the component to force refresh
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [...dependencies, fetchData]); // Include fetchData in dependencies

  return { data, error, isLoading, refetch, lastFetched };
}

/**
 * Hook for handling mutations (create, update, delete operations)
 */
export function useMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mutate = async (variables: V) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      return result;
    } catch (err) {
      const errorData = handleError(err, 'useMutation');
      setError({ message: errorData.message, code: errorData.code });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    data,
    error,
    isLoading,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
}

/**
 * Hook for handling real-time data with Firebase onSnapshot
 * To be implemented when needed
 */
// export function useFirebaseRealtime() {
//   // Implementation for real-time listeners
// }
