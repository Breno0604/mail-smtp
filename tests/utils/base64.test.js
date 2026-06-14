// tests/utils/base64.test.js
import { describe, it, expect } from 'vitest';
import { toBase64, base64ToBlob } from '../../src/utils/base64';

describe('toBase64', () => {
  it('should convert a File to base64 string', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const result = await toBase64(file);
    expect(result).toBe('aGVsbG8=');
  });
});

describe('base64ToBlob', () => {
  it('should convert base64 string to Blob', () => {
    const blob = base64ToBlob('aGVsbG8=', 'text/plain');
    expect(blob).toBeInstanceOf(Blob);
  });
});