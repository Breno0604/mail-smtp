// tests/composables/useOfflineQueue.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOfflineQueue } from '../../src/composables/useOfflineQueue';
import { db } from '../../src/db';

describe('useOfflineQueue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.pendingSends.clear();
    vi.restoreAllMocks();
  });

  it('queueSend adds item to IndexedDB', async () => {
    const { queue, queueSend, loadQueue } = useOfflineQueue();
    
    await queueSend('uuid-123', { test: 'data' });
    await loadQueue();
    
    expect(queue.value).toHaveLength(1);
    expect(queue.value[0].uuid).toBe('uuid-123');
    expect(queue.value[0].payload).toEqual({ test: 'data' });
  });

  it('loadQueue loads pending items from IndexedDB', async () => {
    const { queue, loadQueue } = useOfflineQueue();
    
    await db.pendingSends.put({
      uuid: 'uuid-1',
      payload: { data: 'test1' },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    
    await loadQueue();
    expect(queue.value).toHaveLength(1);
  });

  it('flushQueue processes pending items', async () => {
    const { queue, queueSend, flushQueue, loadQueue } = useOfflineQueue();
    
    await queueSend('uuid-123', { test: 'data' });
    
    // Mock fetch to succeed
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    
    await flushQueue();
    await loadQueue();
    
    expect(queue.value).toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith('/api/send', expect.any(Object));
  });
});