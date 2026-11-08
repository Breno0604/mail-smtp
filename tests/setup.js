/* global Element */
// Test setup - mocks browser APIs. O DOM real é montado por tests/helpers/dom-fixture.js.

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  };
}

// Mock URL.createObjectURL and URL.revokeObjectURL
if (!globalThis.URL?.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:test';
  globalThis.URL.revokeObjectURL = () => {};
}

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = function () {
  return {
    drawImage: () => {},
    toBlob: cb => cb(new Blob(['test'], { type: 'image/jpeg' })),
  };
};

HTMLCanvasElement.prototype.toBlob = function (cb) {
  cb(new Blob(['test'], { type: 'image/jpeg' }));
};

// Mock scrollIntoView (not implemented in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock Image
class MockImage {
  constructor() {
    this.naturalWidth = 100;
    this.naturalHeight = 100;
    setTimeout(() => this.onload?.(), 0);
  }
}
globalThis.Image = MockImage;

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
