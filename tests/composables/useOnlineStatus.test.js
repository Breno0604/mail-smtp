// tests/composables/useOnlineStatus.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOnlineStatus } from '../../src/composables/useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('returns initial online status', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { isOnline } = useOnlineStatus();
    expect(isOnline.value).toBe(true);
  });

  it('detects online event', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { isOnline } = useOnlineStatus();
    expect(isOnline.value).toBe(false);

    // Simulate online event
    window.dispatchEvent(new Event('online'));
    expect(isOnline.value).toBe(true);
  });

  it('detects offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { isOnline } = useOnlineStatus();
    expect(isOnline.value).toBe(true);

    // Simulate offline event
    window.dispatchEvent(new Event('offline'));
    expect(isOnline.value).toBe(false);
  });
});