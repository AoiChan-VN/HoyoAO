/**
 * @file   js/core/state-manager.js
 * @layer  core
 * @pattern Flux-lite / Observable State
 * @depends event-bus.js
 */

import EventBus, { EVENTS } from './event-bus.js';

const StateManager = (() => {

  /** @type {AppState} */
  const _state = {

    // App
    app: {
      initialized: false,
      currentPage: null,       // 'home' | 'articles'
      error: null,
    },

    // Navigation
    nav: {
      menuOpen: false,
      scrollY: 0,
      scrollDirection: null,   // 'up' | 'down'
      hidden: false,
    },

    // Skybox — Home domain
    skybox: {
      rotationX: 0,
      rotationY: 0,
      isDragging: false,
      inertiaX: 0,
      inertiaY: 0,
      imagesLoaded: 0,
      imagesTotal: 6,
      ready: false,
      currentImageSet: null,
    },

    // Articles domain
    articles: {
      list: [],
      filtered: [],
      activeCategory: null,
      searchQuery: '',
      currentArticle: null,
      readingProgress: 0,
      loading: false,
      error: null,
    },

  };

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Deep-clone một object để đảm bảo immutability khi đọc state.
   * @param {*} value
   * @returns {*}
   */
  function _clone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(_clone);
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, _clone(v)])
    );
  }

  /**
   * Resolve một path dạng 'skybox.rotationX' thành [object, key].
   * @param {string} path
   * @returns {[object, string]}
   */
  function _resolvePath(path) {
    const parts = path.split('.');
    const key = parts.pop();
    let target = _state;

    for (const part of parts) {
      if (target[part] === undefined || typeof target[part] !== 'object') {
        throw new Error(`[StateManager] Path không hợp lệ: "${path}"`);
      }
      target = target[part];
    }

    return [target, key];
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Đọc toàn bộ state — trả về bản sao (không thể mutate trực tiếp).
   * @returns {AppState}
   */
  function getState() {
    return _clone(_state);
  }

  /**
   * Đọc một slice theo path dạng 'skybox.rotationX'.
   * @param {string} path
   * @returns {*}
   */
  function get(path) {
    if (typeof path !== 'string' || !path.trim()) {
      throw new TypeError(`[StateManager] Path phải là string không rỗng.`);
    }
    const [target, key] = _resolvePath(path);
    return _clone(target[key]);
  }

  /**
   * Cập nhật một slice state.
   * Tự động emit EVENTS.STATE_CHANGE với { path, prev, next }.
   *
   * @param {string} path   - Dot-notation path: 'skybox.rotationX'
   * @param {*}      value  - Giá trị mới (primitive hoặc partial object)
   */
  function set(path, value) {
    if (typeof path !== 'string' || !path.trim()) {
      throw new TypeError(`[StateManager] Path phải là string không rỗng.`);
    }

    const [target, key] = _resolvePath(path);

    if (!(key in target)) {
      throw new Error(`[StateManager] Key "${key}" không tồn tại trong state. Dùng đúng path.`);
    }

    const prev = _clone(target[key]);

    // Nếu value là object và target[key] cũng là object — merge thay vì replace
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      Object.assign(target[key], value);
    } else {
      target[key] = value;
    }

    const next = _clone(target[key]);

    EventBus.emit(EVENTS.STATE_CHANGE, { path, prev, next });
  }

  /**
   * Batch update nhiều paths cùng lúc — chỉ emit STATE_CHANGE một lần.
   * @param {Object} updates - { 'skybox.rotationX': 0, 'nav.scrollY': 100 }
   */
  function setBatch(updates) {
    if (typeof updates !== 'object' || updates === null) {
      throw new TypeError(`[StateManager] setBatch nhận object { path: value }.`);
    }

    const changes = [];

    for (const [path, value] of Object.entries(updates)) {
      const [target, key] = _resolvePath(path);

      if (!(key in target)) {
        console.warn(`[StateManager] setBatch: Key "${key}" không tồn tại, bỏ qua.`);
        continue;
      }

      const prev = _clone(target[key]);

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        Object.assign(target[key], value);
      } else {
        target[key] = value;
      }

      changes.push({ path, prev, next: _clone(target[key]) });
    }

    if (changes.length > 0) {
      EventBus.emit(EVENTS.STATE_CHANGE, { batch: true, changes });
    }
  }

  /**
   * Reset một slice về giá trị ban đầu.
   * Yêu cầu truyền vào initialValue rõ ràng.
   * @param {string} path
   * @param {*} initialValue
   */
  function reset(path, initialValue) {
    set(path, initialValue);
  }

  /**
   * Subscribe vào thay đổi của một path cụ thể.
   * Callback chỉ được gọi khi path đó thay đổi.
   *
   * @param {string}   watchPath
   * @param {Function} callback  - ({ prev, next }) => void
   * @returns {Function} unsubscribe
   */
  function watch(watchPath, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`[StateManager] watch callback phải là function.`);
    }

    return EventBus.on(EVENTS.STATE_CHANGE, (payload) => {
      if (payload.batch) {
        const match = payload.changes.find(c => c.path === watchPath);
        if (match) callback({ prev: match.prev, next: match.next });
      } else if (payload.path === watchPath) {
        callback({ prev: payload.prev, next: payload.next });
      }
    });
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({
    getState,
    get,
    set,
    setBatch,
    reset,
    watch,
  });

})();

export default StateManager;
