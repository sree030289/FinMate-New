// src/utils/safeDataFetching.ts

import { useFetch } from '../hooks/useData';

interface SafeFetchOptions {
  cacheKey?: string;
  cacheDuration?: number;
  enabled?: boolean;
}

/**
 * Safely fetch data with default empty array fallback
 * This prevents null/undefined errors when using array methods
 */
export function useSafeFetch<T>(
  fetcher: (() => Promise<T[] | null | undefined>) | null,
  options?: SafeFetchOptions
) {
  const result = useFetch(fetcher, options);
  
  return {
    ...result,
    data: result.data || [] as T[],
  };
}

/**
 * Safely fetch single item data with null fallback
 */
export function useSafeFetchItem<T>(
  fetcher: (() => Promise<T | null | undefined>) | null,
  options?: SafeFetchOptions
) {
  const result = useFetch(fetcher, options);
  
  return {
    ...result,
    data: result.data || null,
  };
}