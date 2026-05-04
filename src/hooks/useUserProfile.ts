import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  Optional,
  Transaction,
  UserProfile,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const useUserProfile = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseUserProfileReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = (options?.enabled ?? true) && !!token;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.userProfile(),
    queryFn: async () => {
      const response = await client.getUserProfile(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user profile');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  return useMemo(
    () => ({
      profile: data ?? null,
      isLoading,
      error: error instanceof Error ? error.message : null,
      update: refetch,
    }),
    [data, isLoading, error, refetch]
  );
};

const EMPTY_TRANSACTIONS: Transaction[] = [];

export interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const useTransactions = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseTransactionsReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = (options?.enabled ?? true) && !!token;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.transactions(),
    queryFn: async () => {
      const response = await client.getTransactions(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch transactions');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  return useMemo(
    () => ({
      transactions: data ?? EMPTY_TRANSACTIONS,
      isLoading,
      error: error instanceof Error ? error.message : null,
      update: refetch,
    }),
    [data, isLoading, error, refetch]
  );
};
