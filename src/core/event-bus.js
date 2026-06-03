class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit(event, data = null) {
    if (!this.listeners.has(event)) return;
    const callbacks = [...this.listeners.get(event)];
    const len = callbacks.length;
    for (let i = 0; i < len; i++) {
      callbacks[i](data);
    }
  }

  clear() {
    this.listeners.clear();
  }
}

const globalEventBus = new EventBus();
export default globalEventBus;
