/**
 * Branded type alias for Firebase ID tokens used to authenticate API requests.
 *
 * All protected endpoints require a valid Firebase ID token passed in the
 * `Authorization: Bearer <token>` header. Obtain this token from
 * `firebase.auth().currentUser.getIdToken()`.
 */
export type FirebaseIdToken = string;

/**
 * Default stale time for TanStack Query hooks (5 minutes).
 *
 * Cached data is considered fresh for this duration. Queries will not
 * refetch in the background while data is still fresh.
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default garbage collection time for TanStack Query hooks (30 minutes).
 *
 * Inactive cached data is kept in memory for this duration before being
 * garbage collected. This allows instant restoration when a component
 * remounts within the window.
 */
export const DEFAULT_GC_TIME = 30 * 60 * 1000;

/**
 * Type-safe cache key factory for TanStack Query.
 *
 * Provides structured, deterministic query keys used internally by all hooks
 * and available for consumers who need manual cache invalidation or prefetching.
 *
 * @example
 * ```typescript
 * import { QUERY_KEYS } from '@sudobility/mogulgame_client';
 *
 * // Manual invalidation
 * queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(userId) });
 * ```
 */
export const QUERY_KEYS = {
  /** Cache key for a user profile. */
  user: (userId: string) => ['mogulgame', 'user', userId] as const,
  /** Cache key for property search results. */
  propertySearch: (params: string) =>
    ['mogulgame', 'properties', 'search', params] as const,
  /** Cache key for a single property. */
  property: (propertyId: string) =>
    ['mogulgame', 'properties', propertyId] as const,
  /** Cache key for a property's price history. */
  propertyHistory: (propertyId: string) =>
    ['mogulgame', 'properties', propertyId, 'history'] as const,
  /** Cache key for user's offers. */
  offers: () => ['mogulgame', 'offers'] as const,
  /** Cache key for a single offer. */
  offer: (offerId: string) => ['mogulgame', 'offers', offerId] as const,
  /** Cache key for current user profile. */
  userProfile: () => ['mogulgame', 'userProfile'] as const,
  /** Cache key for user transactions. */
  transactions: () => ['mogulgame', 'transactions'] as const,
  /** Cache key for leaderboard. */
  leaderboard: (sortBy: string, country: string) =>
    ['mogulgame', 'leaderboard', sortBy, country] as const,
  /** Cache key for popular properties. */
  popularProperties: (sortBy: string, page: number) =>
    ['mogulgame', 'popular', sortBy, page] as const,
  /** Cache key for user's favorites. */
  favorites: () => ['mogulgame', 'favorites'] as const,
  /** Cache key for checking if properties are favorited. */
  favoritesCheck: (propertyIds: string) =>
    ['mogulgame', 'favorites', 'check', propertyIds] as const,
} as const;
