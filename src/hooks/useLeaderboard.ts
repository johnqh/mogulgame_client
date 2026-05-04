import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  LeaderboardResponse,
  Optional,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

export interface UseLeaderboardReturn {
  data: LeaderboardResponse | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const useLeaderboard = (
  networkClient: NetworkClient,
  baseUrl: string,
  sortBy: 'balance' | 'wins' = 'balance',
  options?: { enabled?: boolean; page?: number; limit?: number }
): UseLeaderboardReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = options?.enabled ?? true;
  const params: Record<string, string> = { sort_by: sortBy };
  if (options?.page) params.page = String(options.page);
  if (options?.limit) params.limit = String(options.limit);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.leaderboard(sortBy),
    queryFn: async () => {
      const response = await client.getLeaderboard(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch leaderboard');
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
