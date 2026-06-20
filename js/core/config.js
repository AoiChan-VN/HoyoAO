/**
 * @file   js/core/config.js
 * @layer  core
 * @domain system-wide
 *
 * Nguồn sự thật duy nhất cho tất cả hằng số JS.
 * Các giá trị 3D phải đồng bộ với §10 trong design-tokens.css.
 */

const Config = Object.freeze({

  // ── App ─────────────────────────────────────────────────────────
  APP: Object.freeze({
    NAME: 'Skybox',
    VERSION: '1.0.0',
    DEBUG: window.location.hostname === 'localhost',
  }),

  // ── Pages ────────────────────────────────────────────────────────
  PAGES: Object.freeze({
    HOME:     'index.html',
    ARTICLES: 'articles.html',
  }),

  // ── Navigation ───────────────────────────────────────────────────
  NAV: Object.freeze({
    SCROLL_THRESHOLD:     80,    // px — khoảng cách scroll trước khi nav đổi style
    HIDE_THRESHOLD:       200,   // px — khoảng cách scroll trước khi nav ẩn
    SCROLL_DELTA_HIDE:    60,    // px — delta scroll xuống để ẩn nav
    SCROLL_DELTA_SHOW:    10,    // px — delta scroll lên để hiện nav
    BACK_TOP_THRESHOLD:   400,   // px — scroll xuống bao nhiêu thì hiện nút back-to-top
  }),

  // ── Skybox 3D ────────────────────────────────────────────────────
  // Phải đồng bộ với §10 design-tokens.css
  SKYBOX: Object.freeze({
    ROTATION_SPEED:    0.3,     // Hệ số nhân delta input → góc xoay
    INERTIA_DAMPING:   0.92,    // Ma sát mỗi frame (0–1): càng gần 1 càng trơn
    INERTIA_THRESHOLD: 0.05,    // Dừng inertia khi tốc độ < ngưỡng này
    MAX_PITCH:         85,      // Giới hạn góc xoay dọc (độ) — tránh gimbal lock
    FACE_COUNT:        6,
    TRANSITION_MS:     500,     // Thời gian transition khi reset/programmatic rotate
    RAF_INTERVAL:      16,      // ~60fps target frame interval (ms)
  }),

  // ── Touch & Mouse input ──────────────────────────────────────────
  INPUT: Object.freeze({
    MIN_DRAG_DISTANCE:  5,       // px — di chuyển tối thiểu để coi là drag (không phải tap)
    TOUCH_MULTIPLIER:   0.4,     // Hệ số nhân cho touch delta
    MOUSE_MULTIPLIER:   0.3,     // Hệ số nhân cho mouse delta
    WHEEL_MULTIPLIER:   0.1,     // Hệ số nhân cho wheel delta (nếu dùng)
  }),

  // ── Articles ─────────────────────────────────────────────────────
  ARTICLES: Object.freeze({
    PAGE_SIZE:           9,      // Số bài viết mỗi trang
    SEARCH_DEBOUNCE_MS:  300,    // Debounce cho ô tìm kiếm
    READING_PROGRESS_THROTTLE_MS: 100,
    EXCERPT_MAX_LENGTH:  160,    // Ký tự tối đa của excerpt
    THUMBNAIL_ASPECT:    '16/9',
  }),

  // ── Storage keys (LocalStorage) ──────────────────────────────────
  STORAGE: Object.freeze({
    ARTICLES_STORE:     'skybox_articles_store',
    SKYBOX_IMAGE_SET:   'skybox_image_set',
  }),

  // ── Performance ──────────────────────────────────────────────────
  PERF: Object.freeze({
    IMAGE_LAZY_THRESHOLD:  '200px',  // rootMargin cho IntersectionObserver
    SKELETON_MIN_SHOW_MS:  400,      // Hiển thị skeleton tối thiểu (tránh flash)
    TRANSITION_STAGGER_MS: 60,       // Stagger giữa các card khi xuất hiện
  }),

  // ── Breakpoints (JS mirror của §9 design-tokens.css) ─────────────
  BREAKPOINTS: Object.freeze({
    XS:  320,
    SM:  480,
    MD:  768,
    LG:  1024,
    XL:  1280,
    XXL: 1536,
  }),

  // ── Mock API endpoint (giả lập — thay bằng URL thực khi deploy) ──
  API: Object.freeze({
    BASE_URL:     '/api',
    ARTICLES:     '/api/articles',
    ARTICLE_BY_ID: (id) => `/api/articles/${id}`,
    SKYBOX_SETS:  '/api/skybox-sets',
  }),

});

export default Config;
