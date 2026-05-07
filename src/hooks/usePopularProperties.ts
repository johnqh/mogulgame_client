import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';
import type {
  Optional,
  PropertyViewsResponse,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';

export interface UsePopularPropertiesReturn {
  data: PropertyViewsResponse | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const usePopularProperties = (
  networkClient: NetworkClient,
  baseUrl: string,
  sortBy: 'popularity' | 'recent',
  page: number,
  options?: { enabled?: boolean }
): UsePopularPropertiesReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = options?.enabled ?? true;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.popularProperties(sortBy, page),
    queryFn: async () => {
      const response = await client.getPopularProperties({
        sort_by: sortBy,
        page: String(page),
        limit: '25',
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch popular properties');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  return useMemo(
    () => ({
      data: data ?? null,
      isLoading,
      error: error instanceof Error ? error.message : null,
      update: refetch,
    }),
    [data, isLoading, error, refetch]
  );
};
