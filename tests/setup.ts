// tests/setup.ts
import { vi } from 'vitest';

// Mock canvas.toBlob for image compression tests
HTMLCanvasElement.prototype.toBlob = vi.fn((callback, type, quality) => {
  const blob = new Blob(['mock'], { type: type || 'image/jpeg' });
  callback(blob);
});

// Mock crypto.randomUUID for UUID generation
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
globalThis.crypto.randomUUID = vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9));

// Mock navigator.geolocation for coordinate tests
if (!globalThis.navigator) {
  globalThis.navigator = {} as Navigator;
}
globalThis.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: -3.7319,
        longitude: -38.5267,
      },
    });
  }),
} as any;

// Mock URL.createObjectURL and revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

// Mock FileReader for base64 tests
globalThis.FileReader = vi.fn(() => {
  const instance = {
    readAsDataURL: vi.fn(function(this: any, file: Blob) {
      // Simulate async read
      setTimeout(() => {
        this.result = 'data:text/plain;base64,aGVsbG8=';
        if (this.onload) this.onload({ target: this } as any);
      }, 0);
    }),
    onload: null,
    onerror: null,
    result: '',
  };
  return instance;
}) as any;

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});