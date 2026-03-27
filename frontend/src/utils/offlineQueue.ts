/**
 * Offline event queue.
 * Events that fail to save due to network errors are queued in localStorage
 * and synced automatically when connectivity is restored.
 */
import type { AnimalEvent } from '../types';
import { api } from '../api';

const QUEUE_KEY = 'pastoral_pending_events';

export interface QueuedEvent {
  queueId:   string;
  data:      Omit<AnimalEvent, 'id' | 'created_at'>;
  queuedAt:  string;
  attempts:  number;
}

export function enqueueEvent(data: Omit<AnimalEvent, 'id' | 'created_at'>): void {
  const queue = getQueue();
  queue.push({
    queueId:  `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    data,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  });
  _save(queue);
}

export function getQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch { return []; }
}

export function pendingCount(): number {
  return getQueue().length;
}

/** Attempt to sync all queued events. Returns the number successfully synced. */
export async function flushQueue(): Promise<number> {
  const queue = getQueue();
  if (!queue.length) return 0;

  let synced = 0;
  const remaining: QueuedEvent[] = [];

  for (const item of queue) {
    try {
      await api.events.create(item.data);
      synced++;
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  _save(remaining);
  return synced;
}

function _save(queue: QueuedEvent[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}
