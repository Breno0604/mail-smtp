// tests/utils/format.test.js
import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/format';

describe('formatDate', () => {
  it('should reverse YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(formatDate('2026-06-14')).toBe('14-06-2026');
  });
  it('should return original for non-date format', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
  it('should handle empty string', () => {
    expect(formatDate('')).toBe('');
  });
});