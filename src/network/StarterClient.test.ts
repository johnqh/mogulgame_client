import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarterClient } from './StarterClient';
import type { NetworkClient } from '@sudobility/types';

function createMockNetworkClient(
  responseData: unknown = {
    success: true,
    data: null,
    timestamp: '2024-01-01T00:00:00Z',
  }
): NetworkClient {
  const mockResponse = { data: responseData };
  return {
    get: vi.fn().mockResolvedValue(mockResponse),
    post: vi.fn().mockResolvedValue(mockResponse),
    put: vi.fn().mockResolvedValue(mockResponse),
    delete: vi.fn().mockResolvedValue(mockResponse),
  };
}

describe('StarterClient', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;
  let client: StarterClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });
  });

  describe('constructor', () => {
    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(StarterClient);
    });
  });

  describe('getUser', () => {
    it('should call GET with correct URL', async () => {
      await client.getUser('user-123', 'token-abc');
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });

    it('should return response data', async () => {
      const userData = {
        success: true,
        data: {
          firebase_uid: 'user-123',
          email: 'test@example.com',
          display_name: 'Test',
          created_at: null,
          updated_at: null,
        },
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(userData);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getUser('user-123', 'token');
      expect(result.success).toBe(true);
      expect(result.data!.firebase_uid).toBe('user-123');
    });

    it('should throw on invalid response shape', async () => {
      mockNetworkClient = createMockNetworkClient('not an object');
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });
  });

  describe('URL construction', () => {
    it('should strip trailing slash from baseUrl', async () => {
      const trailingSlashClient = new StarterClient({
        baseUrl: 'https://api.example.com/',
        networkClient: mockNetworkClient,
      });
      await trailingSlashClient.getUser('user-123', 'token');
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123',
        expect.any(Object)
      );
    });
  });

  describe('response validation', () => {
    it('should accept valid BaseResponse with success: true', async () => {
      const validResponse = {
        success: true,
        data: {
          firebase_uid: 'user-123',
          email: 'test@example.com',
          display_name: 'Test',
          created_at: null,
          updated_at: null,
        },
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(validResponse);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getUser('user-123', 'token');
      expect(result.success).toBe(true);
      expect(result.data!.firebase_uid).toBe('user-123');
    });

    it('should accept valid BaseResponse with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Not found',
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(errorResponse);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getUser('user-123', 'token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('should throw on null response data', async () => {
      mockNetworkClient = createMockNetworkClient(null);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });

    it('should throw on primitive string response data', async () => {
      mockNetworkClient = createMockNetworkClient('raw string');
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });

    it('should throw on response missing success field', async () => {
      mockNetworkClient = createMockNetworkClient({ data: 'some data' });
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });

    it('should throw on response with non-boolean success field', async () => {
      mockNetworkClient = createMockNetworkClient({ success: 'yes', data: {} });
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });
  });
});
