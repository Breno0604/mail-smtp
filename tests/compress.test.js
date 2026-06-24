import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressAttachments } from '../scripts/compress.js';
import { SKIP_SIZE } from '../scripts/utils.js';

vi.mock('../scripts/utils.js', async () => {
  const actual = await vi.importActual('../scripts/utils.js');
  return {
    ...actual,
    toBase64: vi.fn(file => Promise.resolve(`base64_${file.name}`)),
    loadImage: vi.fn(() =>
      Promise.reject(new Error('mock loadImage - should not be called for skipped files'))
    ),
  };
});

describe('compressAttachments', () => {
  function createFile(name, size, type) {
    const buf = new ArrayBuffer(size);
    return new File([buf], name, { type });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array for empty input', async () => {
    const result = await compressAttachments([]);
    expect(result).toEqual([]);
  });

  it('should skip compression for non-image file > SKIP_SIZE', async () => {
    const file = createFile('doc.pdf', 800 * 1024, 'application/pdf');
    const result = await compressAttachments([file]);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('doc.pdf');
    expect(result[0].encoding).toBe('base64');
    expect(result[0].content).toBe('base64_doc.pdf');
  });

  it('should skip compression for small image file <= SKIP_SIZE', async () => {
    const file = createFile('small.jpg', 100 * 1024, 'image/jpeg');
    const result = await compressAttachments([file]);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('small.jpg');
    expect(result[0].encoding).toBe('base64');
    expect(result[0].content).toBe('base64_small.jpg');
  });

  it('should skip compression for small non-image file', async () => {
    const file = createFile('readme.txt', 50 * 1024, 'text/plain');
    const result = await compressAttachments([file]);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('readme.txt');
    expect(result[0].encoding).toBe('base64');
    expect(result[0].content).toBe('base64_readme.txt');
  });

  it('should process multiple files, skipping non-image and large images', async () => {
    const pdf = createFile('doc.pdf', 800 * 1024, 'application/pdf');
    const smallImg = createFile('icon.png', 10 * 1024, 'image/png');
    const result = await compressAttachments([pdf, smallImg]);
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('doc.pdf');
    expect(result[1].filename).toBe('icon.png');
  });

  it('should use toBase64 for skipped files', async () => {
    const { toBase64 } = await import('../scripts/utils.js');
    const file = createFile('note.txt', 10 * 1024, 'text/plain');
    await compressAttachments([file]);
    expect(toBase64).toHaveBeenCalledOnce();
    expect(toBase64).toHaveBeenCalledWith(file);
  });

  it('should handle file with zero size', async () => {
    const file = createFile('empty.txt', 0, 'text/plain');
    const result = await compressAttachments([file]);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('base64_empty.txt');
  });
});
