import { describe, it, expect, beforeEach } from 'vitest';
import { formatDate, base64ToBlob, MAX_SIZE, SKIP_SIZE } from '../scripts/utils.js';

describe('utils', () => {
  describe('constants', () => {
    it('MAX_SIZE should be 650 * 1024', () => {
      expect(MAX_SIZE).toBe(650 * 1024);
    });

    it('SKIP_SIZE should be 670 * 1024', () => {
      expect(SKIP_SIZE).toBe(670 * 1024);
    });

    it('SKIP_SIZE should be greater than MAX_SIZE', () => {
      expect(SKIP_SIZE).toBeGreaterThan(MAX_SIZE);
    });
  });

  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const result = formatDate('2024-03-15T14:30:00');
      // Date parsing may be timezone-dependent; just check structure
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should format midnight correctly', () => {
      const result = formatDate('2024-01-01T00:00:00');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} 00:00$/);
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('should pad single-digit months and days', () => {
      const result = formatDate('2024-03-05T06:07:00');
      expect(result).toMatch(/^05\/03\/2024 06:07$/);
    });

    it('should handle date-only strings', () => {
      const result = formatDate('2024-12-25');
      // Timezone-dependent, just check structure and that date is present
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      // Verify the date parts parse correctly
      expect(result).toContain('/12/2024');
    });
  });

  describe('base64ToBlob', () => {
    it('should convert valid base64 string to Blob', () => {
      const base64 = btoa('hello world');
      const blob = base64ToBlob(base64, 'text/plain');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should create a Blob with correct content', async () => {
      const content = 'test content';
      const base64 = btoa(content);
      const blob = base64ToBlob(base64, 'text/plain');
      const text = await blob.text();
      expect(text).toBe(content);
    });

    it('should handle empty base64 string', () => {
      const base64 = btoa('');
      const blob = base64ToBlob(base64, 'application/octet-stream');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(0);
    });

    it('should handle different MIME types', () => {
      const base64 = btoa('{}');
      const blob = base64ToBlob(base64, 'application/json');
      expect(blob.type).toBe('application/json');
    });

    it('should handle binary data', () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 254]);
      let binary = '';
      bytes.forEach(b => { binary += String.fromCharCode(b); });
      const base64 = btoa(binary);
      const blob = base64ToBlob(base64, 'application/octet-stream');
      expect(blob.size).toBe(5);
    });
  });
});
