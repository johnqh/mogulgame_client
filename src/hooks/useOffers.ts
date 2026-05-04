import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  Optional,
  PretendOffer,
  PretendOfferCreateRequest,
  PretendOfferUpdateRequest,
} from '@sudobility/mogulgame_types';
import type { NetworkClient } from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

const EMPTY_OFFERS: PretendOffer[] = [];

export interface UseOffersReturn {
  offers: PretendOffer[];
  isLoading: boolean;
  error: Optional<string>;
  update: () => void;
  createOffer: (
    data: PretendOfferCreateRequest
  ) => Promise<BaseResponse<PretendOffer>>;
  updateOffer: (
    offerId: string,
    data: PretendOfferUpdateRequest
  ) => Promise<BaseResponse<PretendOffer>>;
  cancelOffer: (offerId: string) => Promise<BaseResponse<null>>;
  isCreating: boolean;
  isUpdating: boolean;
  isCancelling: boolean;
  clearError: () => void;
}

export const useOffers = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseOffersReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const enabled = (options?.enabled ?? true) && !!token;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.offers(),
    queryFn: async () => {
      const response = await client.getOffers(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch offers');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.offers() });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile() });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: PretendOfferCreateRequest) => {
      return client.createOffer(data, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      offerId,
      data,
    }: {
      offerId: string;
      data: PretendOfferUpdateRequest;
    }) => {
      return client.updateOffer(offerId, data, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return client.cancelOffer(offerId, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const createOffer = useCallback(
    (data: PretendOfferCreateRequest) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateOffer = useCallback(
    (offerId: string, data: PretendOfferUpdateRequest) =>
      updateMutation.mutateAsync({ offerId, data }),
    [updateMutation]
  );

  const cancelOffer = useCallback(
    (offerId: string) => cancelMutation.mutateAsync(offerId),
    [cancelMutation]
  );

  const mutationError =
    createMutation.error ?? updateMutation.error ?? cancelMutation.error;
  const queryErrorMessage =
    queryError instanceof Error ? queryError.message : null;
  const mutationErrorMessage =
    mutationError instanceof Error ? mutationError.message : null;
  const error = queryErrorMessage ?? mutationErrorMessage;

  const clearError = useCallback(() => {
    createMutation.reset();
    updateMutation.reset();
    cancelMutation.reset();
  }, [createMutation, updateMutation, cancelMutation]);

  return useMemo(
    () => ({
      offers: data ?? EMPTY_OFFERS,
      isLoading,
      error,
      update: refetch,
      createOffer,
      updateOffer,
      cancelOffer,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isCancelling: cancelMutation.isPending,
      clearError,
    }),
    [
      data,
      isLoading,
      error,
      refetch,
      createOffer,
      updateOffer,
      cancelOffer,
      createMutation.isPending,
      updateMutation.isPending,
      cancelMutation.isPending,
      clearError,
    ]
  );
};
