// tests/uuid.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { generateUUID, getCurrentUUID, setCurrentUUID, clearCurrentUUID } from '../scripts/uuid.js';

describe('uuid', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('getCurrentUUID', () => {
    it('should return empty string when no UUID is set', () => {
      expect(getCurrentUUID()).toBe('');
    });

    it('should return UUID from localStorage', () => {
      localStorage.setItem('currentUUID', 'test-uuid-123');
      expect(getCurrentUUID()).toBe('test-uuid-123');
    });
  });

  describe('setCurrentUUID', () => {
    it('should store UUID in localStorage', () => {
      setCurrentUUID('test-uuid-456');
      expect(localStorage.getItem('currentUUID')).toBe('test-uuid-456');
    });

    it('should return the UUID that was set', () => {
      const result = setCurrentUUID('test-uuid-789');
      expect(result).toBe('test-uuid-789');
    });
  });

  describe('clearCurrentUUID', () => {
    it('should remove UUID from localStorage', () => {
      localStorage.setItem('currentUUID', 'test-uuid');
      clearCurrentUUID();
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });

    it('should not throw if no UUID is set', () => {
      expect(() => clearCurrentUUID()).not.toThrow();
    });
  });
});
