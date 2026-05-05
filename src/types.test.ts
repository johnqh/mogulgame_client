import { describe, it, expect } from 'vitest';
import { QUERY_KEYS } from './types';

describe('QUERY_KEYS', () => {
  describe('user', () => {
    it('should return correct key for a user', () => {
      const key = QUERY_KEYS.user('user-xyz');
      expect(key).toEqual(['mogulgame', 'user', 'user-xyz']);
    });

    it('should have user as second element', () => {
      const key = QUERY_KEYS.user('any-user');
      expect(key[1]).toBe('user');
    });
  });
});
