import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  Optional,
  Property,
  PropertyPriceHistoryResponse,
  PropertySearchResponse,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

export interface UsePropertySearchReturn {
  data: PropertySearchResponse | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const usePropertySearch = (
  networkClient: NetworkClient,
  baseUrl: string,
  params: Record<string, string>,
  options?: { enabled?: boolean }
): UsePropertySearchReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const paramsKey = JSON.stringify(params);
  const enabled = options?.enabled ?? true;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.propertySearch(paramsKey),
    queryFn: async () => {
      const response = await client.searchProperties(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search properties');
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

export interface UsePropertyReturn {
  property: Property | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const useProperty = (
  networkClient: NetworkClient,
  baseUrl: string,
  propertyId: string | null,
  options?: { enabled?: boolean; crawler?: boolean }
): UsePropertyReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = (options?.enabled ?? true) && !!propertyId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.property(propertyId ?? ''),
    queryFn: async () => {
      const response = await client.getProperty(propertyId!, {
        crawler: options?.crawler,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch property');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  return useMemo(
    () => ({
      property: data ?? null,
      isLoading,
      error: error instanceof Error ? error.message : null,
      update: refetch,
    }),
    [data, isLoading, error, refetch]
  );
};

export interface UsePropertyHistoryReturn {
  data: PropertyPriceHistoryResponse | null;
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
}

export const usePropertyHistory = (
  networkClient: NetworkClient,
  baseUrl: string,
  propertyId: string | null,
  options?: { enabled?: boolean; crawler?: boolean }
): UsePropertyHistoryReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = (options?.enabled ?? true) && !!propertyId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.propertyHistory(propertyId ?? ''),
    queryFn: async () => {
      const response = await client.getPropertyHistory(propertyId!, {
        crawler: options?.crawler,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch price history');
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
