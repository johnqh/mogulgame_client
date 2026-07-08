import type { NetworkClient } from '@sudobility/types';
import type {
  BaseResponse,
  LeaderboardResponse,
  PretendOffer,
  PretendOfferCreateRequest,
  PretendOfferUpdateRequest,
  Property,
  PropertyFavoritesResponse,
  PropertyPriceHistoryResponse,
  PropertySearchResponse,
  PropertyViewsResponse,
  Transaction,
  User,
  UserProfile,
} from '@sudobility/mogulgame_types';
import type { FirebaseIdToken } from '../types';
import {
  buildUrl,
  createAuthHeaders,
  createHeaders,
} from '../utils/starter-helpers';

/**
 * Validates that a response from the API conforms to the expected {@link BaseResponse} shape.
 *
 * Performs a defensive check that the response has a `success` boolean field,
 * guarding against unexpected response shapes from the network layer.
 *
 * @param data - The raw response data from the network client
 * @param operation - Description of the operation, used in the error message if validation fails
 * @returns The validated response cast to `BaseResponse<T>`
 * @throws {Error} If the response does not have a `success` boolean field
 *
 * @internal
 */
function validateResponse<T>(
  data: unknown,
  operation: string
): BaseResponse<T> {
  if (
    data != null &&
    typeof data === 'object' &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean'
  ) {
    return data as BaseResponse<T>;
  }
  throw new Error(
    `Invalid API response for ${operation}: response does not match expected BaseResponse shape`
  );
}

/**
 * HTTP client for the Starter API.
 *
 * Communicates with the Starter backend using dependency-injected {@link NetworkClient}.
 * All HTTP calls go through the injected `networkClient` -- this class never uses `fetch` directly.
 *
 * @example
 * ```typescript
 * import { StarterClient } from '@sudobility/mogulgame_client';
 *
 * const client = new StarterClient({
 *   baseUrl: 'https://api.example.com',
 *   networkClient: myNetworkClient,
 * });
 *
 * // Fetch user profile
 * const user = await client.getUser(userId, idToken);
 * ```
 */
export class StarterClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  /**
   * Creates a new StarterClient instance.
   *
   * @param config - Client configuration
   * @param config.baseUrl - The base URL of the Starter API (e.g., `"https://api.example.com"`)
   * @param config.networkClient - A {@link NetworkClient} implementation for making HTTP requests
   */
  constructor(config: { baseUrl: string; networkClient: NetworkClient }) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
  }

  // --- User ---

  /**
   * Fetches a user profile by ID.
   *
   * @param userId - The Firebase UID of the user to fetch
   * @param token - A valid Firebase ID token for authentication
   * @returns The user profile wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.getUser('user-123', idToken);
   * if (response.success && response.data) {
   *   console.log(response.data.email);
   * }
   * ```
   */
  async getUser(
    userId: string,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<User>> {
    const url = buildUrl(this.baseUrl, `/api/v1/users/${userId}`);
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<User>(response.data, 'getUser');
  }

  // --- Properties (public) ---

  async searchProperties(
    params: Record<string, string>,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PropertySearchResponse>> {
    const query = new URLSearchParams(params).toString();
    const url = buildUrl(this.baseUrl, `/api/v1/properties/search?${query}`);
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
      timeout: options?.timeout,
    });
    return validateResponse<PropertySearchResponse>(
      response.data,
      'searchProperties'
    );
  }

  async getProperty(
    propertyId: string,
    options?: { timeout?: number; crawler?: boolean }
  ): Promise<BaseResponse<Property>> {
    const query = options?.crawler ? '?crawler=true' : '';
    const url = buildUrl(
      this.baseUrl,
      `/api/v1/properties/${propertyId}${query}`
    );
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
      timeout: options?.timeout,
    });
    return validateResponse<Property>(response.data, 'getProperty');
  }

  async getPropertyHistory(
    propertyId: string,
    options?: { timeout?: number; crawler?: boolean }
  ): Promise<BaseResponse<PropertyPriceHistoryResponse>> {
    const query = options?.crawler ? '?crawler=true' : '';
    const url = buildUrl(
      this.baseUrl,
      `/api/v1/properties/${propertyId}/history${query}`
    );
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
      timeout: options?.timeout,
    });
    return validateResponse<PropertyPriceHistoryResponse>(
      response.data,
      'getPropertyHistory'
    );
  }

  // --- Offers (auth required) ---

  async getOffers(
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PretendOffer[]>> {
    const url = buildUrl(this.baseUrl, '/api/v1/offers');
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<PretendOffer[]>(response.data, 'getOffers');
  }

  async getOffer(
    offerId: string,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PretendOffer>> {
    const url = buildUrl(this.baseUrl, `/api/v1/offers/${offerId}`);
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<PretendOffer>(response.data, 'getOffer');
  }

  async createOffer(
    data: PretendOfferCreateRequest,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PretendOffer>> {
    const url = buildUrl(this.baseUrl, '/api/v1/offers');
    const response = await this.networkClient.post(url, data, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<PretendOffer>(response.data, 'createOffer');
  }

  async updateOffer(
    offerId: string,
    data: PretendOfferUpdateRequest,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PretendOffer>> {
    const url = buildUrl(this.baseUrl, `/api/v1/offers/${offerId}`);
    const response = await this.networkClient.put(url, data, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<PretendOffer>(response.data, 'updateOffer');
  }

  async cancelOffer(
    offerId: string,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<null>> {
    const url = buildUrl(this.baseUrl, `/api/v1/offers/${offerId}`);
    const response = await this.networkClient.delete(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<null>(response.data, 'cancelOffer');
  }

  // --- User Profile (auth required) ---

  async getUserProfile(
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<UserProfile>> {
    const url = buildUrl(this.baseUrl, '/api/v1/users/me');
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<UserProfile>(response.data, 'getUserProfile');
  }

  async getTransactions(
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<Transaction[]>> {
    const url = buildUrl(this.baseUrl, '/api/v1/users/me/transactions');
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse<Transaction[]>(response.data, 'getTransactions');
  }

  // --- Leaderboard (public) ---

  async getLeaderboard(
    params?: Record<string, string>,
    options?: { timeout?: number }
  ): Promise<BaseResponse<LeaderboardResponse>> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = buildUrl(this.baseUrl, `/api/v1/leaderboard${query}`);
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
      timeout: options?.timeout,
    });
    return validateResponse<LeaderboardResponse>(
      response.data,
      'getLeaderboard'
    );
  }

  // --- Popular Properties (public) ---

  async getPopularProperties(
    params?: Record<string, string>,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PropertyViewsResponse>> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = buildUrl(this.baseUrl, `/api/v1/views/popular${query}`);
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
      timeout: options?.timeout,
    });
    return validateResponse(response.data, 'getPopularProperties');
  }

  // --- Favorites (auth required) ---

  async favoriteProperty(
    propertyId: string,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<{ favorited: boolean }>> {
    const url = buildUrl(this.baseUrl, `/api/v1/favorites/${propertyId}`);
    const response = await this.networkClient.post(
      url,
      {},
      {
        headers: createAuthHeaders(token),
        timeout: options?.timeout,
      }
    );
    return validateResponse(response.data, 'favoriteProperty');
  }

  async unfavoriteProperty(
    propertyId: string,
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<{ favorited: boolean }>> {
    const url = buildUrl(this.baseUrl, `/api/v1/favorites/${propertyId}`);
    const response = await this.networkClient.delete(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse(response.data, 'unfavoriteProperty');
  }

  async getFavorites(
    token: FirebaseIdToken,
    params?: Record<string, string>,
    options?: { timeout?: number }
  ): Promise<BaseResponse<PropertyFavoritesResponse>> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = buildUrl(this.baseUrl, `/api/v1/favorites${query}`);
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse(response.data, 'getFavorites');
  }

  async checkFavorites(
    propertyIds: string[],
    token: FirebaseIdToken,
    options?: { timeout?: number }
  ): Promise<BaseResponse<{ favorites: Record<string, boolean> }>> {
    const url = buildUrl(
      this.baseUrl,
      `/api/v1/favorites/check?property_ids=${propertyIds.join(',')}`
    );
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
      timeout: options?.timeout,
    });
    return validateResponse(response.data, 'checkFavorites');
  }
}
