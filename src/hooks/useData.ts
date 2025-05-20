import { useState, useEffect, useCallback } from 'react';
import { handleError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseFetchOptions {
  cacheKey?: string;
  cacheDuration?: number; // Duration in milliseconds
  dependencies?: any[];
  initialData?: any;
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
    initialData = null
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

  const fetchData = useCallback(async (ignoreCache: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
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

      // Fetch fresh data
      const result = await fetchFn();
      setData(result);
      
      // Cache the result if caching is enabled
      if (cacheKey) {
        await storeInCache(result);
      }
    } catch (err) {
      const errorData = handleError(err, 'useFetch');
      setError({ message: errorData.message, code: errorData.code });
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, cacheKey, getFromCache, storeInCache, isCacheValid]);

  // Refetch function that can be called from the component to force refresh
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);

  return { data, error, isLoading, refetch };
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
