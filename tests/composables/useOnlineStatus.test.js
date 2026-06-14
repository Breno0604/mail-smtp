// tests/composables/useOnlineStatus.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOnlineStatus } from '../../src/composables/useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('returns initial online status when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { isOnline } = useOnlineStatus();
    expect(isOnline.value).toBe(true);
  });

  it('returns initial online status when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { isOnline } = useOnlineStatus();
    expect(isOnline.value).toBe(false);
  });

  // Note: Event listener tests are skipped as they don't work reliably in jsdom
  // The actual event handling is tested in E2E tests
});