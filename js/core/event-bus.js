/**
 * @file   js/core/event-bus.js
 * @layer  core
 * @pattern Mediator / Publish-Subscribe
 *
 * Kênh giao tiếp duy nhất giữa tất cả modules.
 * Không module nào được giữ tham chiếu trực tiếp đến module khác.
 */

const EventBus = (() => {

  /** @type {Map<string, Set<Function>>} */
  const _listeners = new Map();

  /** @type {Map<string, Set<Function>>} */
  const _onceListeners = new Map();

  /** @type {Array<{event: string, payload: *, timestamp: number}>} */
  const _history = [];

  const MAX_HISTORY = 50;

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Đảm bảo event name là string hợp lệ.
   * @param {string} event
   */
  function _assertEvent(event) {
    if (typeof event !== 'string' || event.trim() === '') {
      throw new TypeError(`[EventBus] Event name phải là string không rỗng. Nhận: "${event}"`);
    }
  }

  /**
   * Đảm bảo callback là function.
   * @param {Function} callback
   */
  function _assertCallback(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`[EventBus] Callback phải là function. Nhận: ${typeof callback}`);
    }
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Đăng ký lắng nghe một event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Hàm unsubscribe — gọi để hủy đăng ký
   */
  function on(event, callback) {
    _assertEvent(event);
    _assertCallback(callback);

    if (!_listeners.has(event)) {
      _listeners.set(event, new Set());
    }
    _listeners.get(event).add(callback);

    return () => off(event, callback);
  }

  /**
   * Đăng ký lắng nghe một event — chỉ kích hoạt MỘT LẦN rồi tự hủy.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Hàm unsubscribe
   */
  function once(event, callback) {
    _assertEvent(event);
    _assertCallback(callback);

    if (!_onceListeners.has(event)) {
      _onceListeners.set(event, new Set());
    }
    _onceListeners.get(event).add(callback);

    return () => {
      const set = _onceListeners.get(event);
      if (set) set.delete(callback);
    };
  }

  /**
   * Hủy đăng ký một callback khỏi event.
   * @param {string} event
   * @param {Function} callback
   */
  function off(event, callback) {
    _assertEvent(event);
    _assertCallback(callback);

    const set = _listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) _listeners.delete(event);
    }
  }

  /**
   * Phát một event với payload tùy ý.
   * Tất cả subscribers nhận được payload ngay lập tức (synchronous).
   * @param {string} event
   * @param {*} [payload]
   */
  function emit(event, payload) {
    _assertEvent(event);

    // Ghi lịch sử để debug
    _history.push({ event, payload, timestamp: Date.now() });
    if (_history.length > MAX_HISTORY) _history.shift();

    // Gọi persistent listeners
    const listeners = _listeners.get(event);
    if (listeners && listeners.size > 0) {
      listeners.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Lỗi trong listener của "${event}":`, err);
        }
      });
    }

    // Gọi once listeners rồi xóa ngay
    const onceSet = _onceListeners.get(event);
    if (onceSet && onceSet.size > 0) {
      onceSet.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Lỗi trong once-listener của "${event}":`, err);
        }
      });
      _onceListeners.delete(event);
    }
  }

  /**
   * Phát event bất đồng bộ — không block luồng hiện tại.
   * Dùng cho các sự kiện không cần xử lý ngay (analytics, logging).
   * @param {string} event
   * @param {*} [payload]
   */
  function emitAsync(event, payload) {
    Promise.resolve().then(() => emit(event, payload));
  }

  /**
   * Hủy toàn bộ listener của một event cụ thể.
   * @param {string} event
   */
  function clear(event) {
    _assertEvent(event);
    _listeners.delete(event);
    _onceListeners.delete(event);
  }

  /**
   * Hủy toàn bộ listener của mọi event.
   * Dùng khi teardown toàn bộ ứng dụng.
   */
  function clearAll() {
    _listeners.clear();
    _onceListeners.clear();
  }

  /**
   * Trả về danh sách tất cả event đang có listener.
   * @returns {string[]}
   */
  function getRegisteredEvents() {
    const events = new Set([
      ..._listeners.keys(),
      ..._onceListeners.keys(),
    ]);
    return [...events];
  }

  /**
   * Trả về lịch sử emit gần nhất (tối đa MAX_HISTORY entries).
   * @returns {Array<{event: string, payload: *, timestamp: number}>}
   */
  function getHistory() {
    return [..._history];
  }

  /**
   * Số lượng listener đang active cho một event.
   * @param {string} event
   * @returns {number}
   */
  function listenerCount(event) {
    _assertEvent(event);
    const persistent = _listeners.get(event)?.size ?? 0;
    const once = _onceListeners.get(event)?.size ?? 0;
    return persistent + once;
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({
    on,
    once,
    off,
    emit,
    emitAsync,
    clear,
    clearAll,
    getRegisteredEvents,
    getHistory,
    listenerCount,
  });

})();

export default EventBus;


/* ── Event Name Registry ────────────────────────────────────────────
 * Tập trung tất cả event names tại đây để tránh typo và
 * dễ tìm kiếm cross-file. Import từ file này khi cần.
 * ─────────────────────────────────────────────────────────────────── */
export const EVENTS = Object.freeze({

  // App lifecycle
  APP_INIT:           'app:init',
  APP_READY:          'app:ready',
  APP_ERROR:          'app:error',

  // Navigation
  NAV_SCROLL_UPDATE:  'nav:scroll:update',
  NAV_MENU_OPEN:      'nav:menu:open',
  NAV_MENU_CLOSE:     'nav:menu:close',
  NAV_PAGE_CHANGE:    'nav:page:change',

  // Skybox — Home domain
  SKYBOX_INIT:        'skybox:init',
  SKYBOX_READY:       'skybox:ready',
  SKYBOX_ROTATE:      'skybox:rotate',
  SKYBOX_DRAG_START:  'skybox:drag:start',
  SKYBOX_DRAG_END:    'skybox:drag:end',
  SKYBOX_IMAGE_LOAD:  'skybox:image:load',
  SKYBOX_IMAGE_ERROR: 'skybox:image:error',
  SKYBOX_RESET:       'skybox:reset',

  // Input — Home domain
  INPUT_DRAG_DELTA:   'input:drag:delta',
  INPUT_DRAG_START:   'input:drag:start',
  INPUT_DRAG_END:     'input:drag:end',

  // Articles domain
  ARTICLES_INIT:      'articles:init',
  ARTICLES_LOADED:    'articles:loaded',
  ARTICLES_ERROR:     'articles:error',
  ARTICLE_OPEN:       'article:open',
  ARTICLE_CLOSE:      'article:close',
  ARTICLE_PROGRESS:   'article:progress',

  // Search & filter
  SEARCH_QUERY:       'search:query',
  SEARCH_RESULTS:     'search:results',
  FILTER_CATEGORY:    'filter:category',
  FILTER_RESET:       'filter:reset',

  // State
  STATE_CHANGE:       'state:change',

}); 
