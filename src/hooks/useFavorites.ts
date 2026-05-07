import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';
import type { FirebaseIdToken } from '../types';
import type {
  Optional,
  PropertyFavoritesResponse,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';

export interface UseFavoritesReturn {
  data: PropertyFavoritesResponse | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
  favorite: (propertyId: string) => Promise<void>;
  unfavorite: (propertyId: string) => Promise<void>;
  isFavoriting: boolean;
}

export const useFavorites = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseFavoritesReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );
  const enabled = (options?.enabled ?? true) && !!token;
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.favorites(),
    queryFn: async () => {
      const response = await client.getFavorites(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch favorites');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites() });
    queryClient.invalidateQueries({
      queryKey: ['mogulgame', 'favorites', 'check'],
    });
    queryClient.invalidateQueries({ queryKey: ['mogulgame', 'popular'] });
  }, [queryClient]);

  const favoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return client.favoriteProperty(propertyId, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const unfavoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return client.unfavoriteProperty(propertyId, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const favorite = useCallback(
    async (propertyId: string) => {
      await favoriteMutation.mutateAsync(propertyId);
    },
    [favoriteMutation]
  );

  const unfavorite = useCallback(
    async (propertyId: string) => {
      await unfavoriteMutation.mutateAsync(propertyId);
    },
    [unfavoriteMutation]
  );

  return useMemo(
    () => ({
      data: data ?? null,
      isLoading,
      error: error instanceof Error ? error.message : null,
      update: refetch,
      favorite,
      unfavorite,
      isFavoriting: favoriteMutation.isPending || unfavoriteMutation.isPending,
    }),
    [
      data,
      isLoading,
      error,
      refetch,
      favorite,
      unfavorite,
      favoriteMutation.isPending,
      unfavoriteMutation.isPending,
    ]
  );
};

export interface UseFavoriteCheckReturn {
  favorites: Record<string, boolean>;
  isLoading: boolean;
}

export const useFavoriteCheck = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  propertyIds: string[],
  options?: { enabled?: boolean }
): UseFavoriteCheckReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );
  const idsKey = propertyIds.sort().join(',');
  const enabled =
    (options?.enabled ?? true) && !!token && propertyIds.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.favoritesCheck(idsKey),
    queryFn: async () => {
      const response = await client.checkFavorites(propertyIds, token!);
      if (!response.success || !response.data) {
        return {};
      }
      return response.data.favorites;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  return useMemo(
    () => ({
      favorites: data ?? {},
      isLoading,
    }),
    [data, isLoading]
  );
};
