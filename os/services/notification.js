/**
 * Notification Service (§25, §87)
 *
 * Manages transient toasts AND a persistent notification history (§34).
 * History is stored in the "os:notifications" partition and survives reload.
 *
 * Backward compatible (§60): notify/dismiss/getActive/subscribe unchanged.
 * History APIs are additive.
 */

const VALID_TYPES = ['info', 'success', 'warning', 'error'];

export class NotificationService {
  /** @type {Map<string, object>} active toasts */
  #notifications = new Map();
  /** @type {Map<string, number>} toast timers */
  #timers = new Map();
  /** @type {Array<object>} persistent history (newest first) */
  #history = [];
  #listeners = new Set();
  #eventBus;
  #logger;
  #partition;
  #maxActive;
  #defaultDuration;
  #maxHistory;
  #idCounter = 0;

  constructor(eventBus, logger, options = {}) {
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#maxActive = options.maxActive || 5;
    this.#defaultDuration = options.defaultDuration || 5000;
    this.#maxHistory = options.maxHistory || 100;
    this.#partition = options.storage
      ? options.storage.getPartition('os:notifications', ['indexeddb', 'local', 'memory'])
      : null;
  }

  /** Load persisted history at boot. */
  async init() {
    if (!this.#partition) return;
    try {
      const stored = await this.#partition.get('history');
      if (Array.isArray(stored)) this.#history = stored;
      this.#logger.info('notification', `Loaded ${this.#history.length} notification(s) from history`);
    } catch (err) {
      this.#logger.warn('notification', 'Failed to load notification history', { error: err.message });
      this.#history = [];
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Notify (toast + history)                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Show a toast AND record it in history.
   * @returns {string} notification id
   */
  notify(options = {}) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = this.#defaultDuration,
      dismissible = true,
      source = 'unknown',
    } = options;

    const safeType = VALID_TYPES.includes(type) ? type : 'info';
    const id = `notif-${Date.now()}-${++this.#idCounter}`;

    const notification = {
      id,
      type: safeType,
      title: String(title),
      message: String(message),
      source: String(source),
      timestamp: Date.now(),
      dismissible: Boolean(dismissible),
      read: false,
    };

    // Enforce active-toast budget.
    if (this.#notifications.size >= this.#maxActive) {
      const oldestId = this.#notifications.keys().next().value;
      this.dismiss(oldestId);
    }

    const toast = { ...notification };
    delete toast.read;
    this.#notifications.set(id, toast);

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.#timers.set(id, timer);
    }

    // Record to history (newest first) and persist (§34).
    this.#history.unshift(notification);
    if (this.#history.length > this.#maxHistory) {
      this.#history.length = this.#maxHistory;
    }
    this.#persistHistory();

    this.#notifyListeners();
    this.#eventBus.emit('notification:shown', { id, type: safeType });
    this.#eventBus.emit('notification:received', { id, type: safeType });
    this.#logger.info('notification', `Notification [${safeType}] "${title}"`);

    return id;
  }

  /* ------------------------------------------------------------------ */
  /*  Active toast management (unchanged contract §60)                   */
  /* ------------------------------------------------------------------ */

  dismiss(id) {
    if (!this.#notifications.has(id)) return;

    const timer = this.#timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }

    this.#notifications.delete(id);
    this.#notifyListeners();
    this.#eventBus.emit('notification:dismissed', { id });
  }

  dismissAll() {
    const ids = Array.from(this.#notifications.keys());
    for (const id of ids) this.dismiss(id);
  }

  getActive() {
    return Array.from(this.#notifications.values());
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /* ------------------------------------------------------------------ */
  /*  History management (additive)                                      */
  /* ------------------------------------------------------------------ */

  /** @returns {Array<object>} history copy (newest first) */
  getHistory() {
    return this.#history.map((n) => ({ ...n }));
  }

  getUnreadCount() {
    return this.#history.filter((n) => !n.read).length;
  }

  markAsRead(id) {
    const n = this.#history.find((x) => x.id === id);
    if (!n || n.read) return false;
    n.read = true;
    this.#persistHistory();
    this.#eventBus.emit('notification:read', { id });
    return true;
  }

  markAllAsRead() {
    let changed = false;
    for (const n of this.#history) {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) {
      this.#persistHistory();
      this.#eventBus.emit('notification:read', { id: null, all: true });
    }
    return changed;
  }

  removeFromHistory(id) {
    const idx = this.#history.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.#history.splice(idx, 1);
    this.#persistHistory();
    this.#eventBus.emit('notification:removed', { id });
    return true;
  }

  clearHistory() {
    if (this.#history.length === 0) return false;
    this.#history = [];
    this.#persistHistory();
    this.#eventBus.emit('notification:cleared', {});
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Cleanup (§74)                                                      */
  /* ------------------------------------------------------------------ */

  destroy() {
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
    this.#notifications.clear();
    this.#listeners.clear();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  async #persistHistory() {
    if (!this.#partition) return;
    try {
      await this.#partition.set('history', this.#history);
    } catch (err) {
      // Persistence failure must not break notification flow (§75).
      this.#logger.error('notification', 'Failed to persist history', { error: err.message });
    }
  }

  #notifyListeners() {
    const list = this.getActive();
    for (const fn of this.#listeners) {
      try {
        fn(list);
      } catch (err) {
        this.#logger.error('notification', 'Subscriber error', { error: err.message });
      }
    }
  }
}
