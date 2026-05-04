import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Optional } from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

/**
 * Return type for the {@link useHistoriesTotal} hook.
 */
export interface UseHistoriesTotalReturn {
  /** The global total count of histories, or `0` if not yet loaded. */
  total: number;
  /** Whether the query is currently loading. */
  isLoading: boolean;
  /** An error message if the query failed, or `null` if no error. */
  error: Optional<string>;
  /** Function to manually trigger a refetch of the total. */
  refetch: () => void;
}

/**
 * TanStack Query hook that fetches the global total count of all histories.
 *
 * This uses a public endpoint and does not require authentication.
 *
 * @param networkClient - A {@link NetworkClient} implementation for making HTTP requests
 * @param baseUrl - The base URL of the Starter API
 * @param options - Optional configuration
 * @param options.enabled - Whether the query should execute (default: `true`)
 * @returns An object containing the total count, loading state, error, and refetch function
 */
export const useHistoriesTotal = (
  networkClient: NetworkClient,
  baseUrl: string,
  options?: {
    enabled?: boolean;
  }
): UseHistoriesTotalReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = options?.enabled ?? true;

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.historiesTotal(),
    queryFn: async () => {
      const response = await client.getHistoriesTotal();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch total');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return useMemo(
    () => ({
      total: data?.total ?? 0,
      isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch]
  );
};
