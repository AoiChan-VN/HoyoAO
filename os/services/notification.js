/**
 * Notification Service (§25)
 *
 * Infrastructure service that OWNS notification state and lifecycle.
 * It does NOT render UI — rendering belongs to the Shell (§87) via
 * a NotificationHost that subscribes to this service.
 *
 * Responsibilities:
 *   - Maintain active notification queue (bounded).
 *   - Auto-dismiss with timers (§74 cleanup).
 *   - Notify subscribers + emit EventBus events.
 *   - Never fabricate notifications (§45).
 */

const VALID_TYPES = ['info', 'success', 'warning', 'error'];

export class NotificationService {
  /** @type {Map<string, object>} id → notification */
  #notifications = new Map();
  /** @type {Map<string, number>} id → timeout handle */
  #timers = new Map();
  #listeners = new Set();
  #eventBus;
  #logger;
  #maxActive;
  #defaultDuration;
  #idCounter = 0;

  constructor(eventBus, logger, options = {}) {
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#maxActive = options.maxActive || 5;
    this.#defaultDuration = options.defaultDuration || 5000;
  }

  /**
   * Push a notification.
   * @param {object} options
   * @param {'info'|'success'|'warning'|'error'} [options.type='info']
   * @param {string} [options.title='']
   * @param {string} [options.message='']
   * @param {number} [options.duration] ms; 0 = sticky
   * @param {boolean} [options.dismissible=true]
   * @param {string} [options.source='unknown']
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
    const id = `notif-${++this.#idCounter}`;

    const notification = {
      id,
      type: safeType,
      title: String(title),
      message: String(message),
      source: String(source),
      timestamp: Date.now(),
      dismissible: Boolean(dismissible),
    };

    // Enforce bounded queue — drop oldest on overflow (§94 memory budget).
    if (this.#notifications.size >= this.#maxActive) {
      const oldestId = this.#notifications.keys().next().value;
      this.dismiss(oldestId);
    }

    this.#notifications.set(id, notification);

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.#timers.set(id, timer);
    }

    this.#notifyListeners();
    this.#eventBus.emit('notification:shown', { id, type: safeType });
    this.#logger.info('notification', `Shown [${safeType}] "${title}"`, { source });

    return id;
  }

  /**
   * Dismiss a notification and clear its timer.
   * @param {string} id
   */
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

  /** @returns {Array<object>} active notifications (ordered oldest → newest) */
  getActive() {
    return Array.from(this.#notifications.values());
  }

  /**
   * Subscribe to queue changes.
   * @param {Function} fn - receives the active list
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** Full cleanup (§74). */
  destroy() {
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
    this.#notifications.clear();
    this.#listeners.clear();
  }

  /* ---- private ---- */

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
