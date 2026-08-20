/**
 * Mock EventBus for unit tests.
 * Tracks emitted events and subscriptions.
 */
export function createMockEventBus() {
  const listeners = new Map();
  const emitted = [];

  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event)?.delete(fn);
    },
    off(event, fn) {
      listeners.get(event)?.delete(fn);
    },
    emit(event, data) {
      emitted.push({ event, data });
      const fns = listeners.get(event);
      if (fns) for (const fn of fns) fn(data);
    },
    getEmitted: () => [...emitted],
    clear: () => { emitted.length = 0; listeners.clear(); },
  };
} 
