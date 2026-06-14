// src/composables/useOfflineQueue.ts
import { ref } from 'vue';
import { db } from '@/db';
import type { PendingSendData } from '@/types';

export function useOfflineQueue() {
  const queue = ref<PendingSendData[]>([]);
  const isProcessing = ref(false);

  async function queueSend(uuid: string, payload: Record<string, unknown>): Promise<void> {
    const pending: PendingSendData = {
      uuid,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    await db.pendingSends.put(pending);
    queue.value.push(pending);
  }

  async function flushQueue(): Promise<void> {
    if (isProcessing.value) return;
    isProcessing.value = true;

    try {
      const pending = await db.pendingSends.toArray();
      
      for (const item of pending) {
        try {
          const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });

          if (response.ok) {
            await db.pendingSends.delete(item.id!);
          } else {
            // Increment attempts
            await db.pendingSends.update(item.id!, { attempts: item.attempts + 1 });
          }
        } catch {
          // Network error - keep in queue
          await db.pendingSends.update(item.id!, { attempts: item.attempts + 1 });
        }
      }
      
      queue.value = await db.pendingSends.toArray();
    } finally {
      isProcessing.value = false;
    }
  }

  async function loadQueue(): Promise<void> {
    queue.value = await db.pendingSends.toArray();
  }

  return {
    queue,
    isProcessing,
    queueSend,
    flushQueue,
    loadQueue,
  };
}