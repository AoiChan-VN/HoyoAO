import { DEFAULTS } from "./constants.js";

export function createEventBus(options = {}) {
  const maxListeners =
    Number.isInteger(options.maxListeners) && options.maxListeners > 0
      ? options.maxListeners
      : DEFAULTS.MAX_EVENT_LISTENERS;

  const listeners = new Map();
  const warnedEvents = new Set();
  let destroyed = false;

  function normalizeEvent(event) {
    if (typeof event !== "string" || event.trim().length === 0) {
      throw new TypeError("[HoyoAO] Event name must be a non-empty string.");
    }

    return event.trim();
  }

  function on(event, handler, { signal } = {}) {
    if (destroyed) {
      return () => {};
    }

    const key = normalizeEvent(event);

    if (typeof handler !== "function") {
      throw new TypeError("[HoyoAO] Event handler must be a function.");
    }

    if (signal?.aborted) {
      return () => {};
    }

    let set = listeners.get(key);

    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }

    if (!warnedEvents.has(key) && set.size >= maxListeners) {
      warnedEvents.add(key);
      console.warn(
        `[HoyoAO] Event bus has ${set.size} listeners for "${key}". ` +
          `This may indicate a listener leak.`,
      );
    }

    set.add(handler);

    const dispose = () => {
      off(key, handler);
    };

    if (signal) {
      signal.addEventListener("abort", dispose, { once: true });
    }

    return dispose;
  }

  function once(event, handler, options = {}) {
    if (destroyed) {
      return () => {};
    }

    if (typeof handler !== "function") {
      throw new TypeError("[HoyoAO] Event handler must be a function.");
    }

    const wrapper = function (...args) {
      off(event, wrapper);
      return handler.apply(this, args);
    };

    wrapper.__hoyoaoOriginal = handler;

    return on(event, wrapper, options);
  }

  function off(event, handler) {
    if (destroyed) {
      return;
    }

    if (event === undefined || event === null) {
      listeners.clear();
      warnedEvents.clear();
      return;
    }

    const key = normalizeEvent(event);
    const set = listeners.get(key);

    if (!set) {
      return;
    }

    if (handler === undefined || handler === null) {
      listeners.delete(key);
      warnedEvents.delete(key);
      return;
    }

    if (typeof handler !== "function") {
      throw new TypeError("[HoyoAO] Event handler must be a function.");
    }

    for (const fn of Array.from(set)) {
      if (fn === handler || fn.__hoyoaoOriginal === handler) {
        set.delete(fn);
      }
    }

    if (set.size === 0) {
      listeners.delete(key);
      warnedEvents.delete(key);
    }
  }

  function emit(event, payload) {
    if (destroyed) {
      return false;
    }

    const key = normalizeEvent(event);
    const set = listeners.get(key);

    if (!set || set.size === 0) {
      return false;
    }

    for (const handler of Array.from(set)) {
      try {
        handler(payload, key);
      } catch (error) {
        if (typeof options.onError === "function") {
          options.onError(error, {
            event: key,
            payload,
            handler,
          });
        } else {
          console.error(`[HoyoAO] Event handler failed for "${key}".`, error);
        }
      }
    }

    return true;
  }

  function clear(event) {
    if (destroyed) {
      return;
    }

    if (event === undefined || event === null) {
      listeners.clear();
      warnedEvents.clear();
      return;
    }

    const key = normalizeEvent(event);
    listeners.delete(key);
    warnedEvents.delete(key);
  }

  function listenerCount(event) {
    if (destroyed) {
      return 0;
    }

    if (event === undefined || event === null) {
      let total = 0;

      for (const set of listeners.values()) {
        total += set.size;
      }

      return total;
    }

    const key = normalizeEvent(event);

    return listeners.get(key)?.size ?? 0;
  }

  function events() {
    if (destroyed) {
      return [];
    }

    return Array.from(listeners.keys());
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    listeners.clear();
    warnedEvents.clear();
  }

  return Object.freeze({
    on,
    once,
    off,
    emit,
    clear,
    listenerCount,
    events,
    destroy,
  });
} 
