/**
 * @file   js/data/article-repository.js
 * @layer  data
 * @domain articles
 * @depends config.js
 *
 * LocalStorage là nguồn dữ liệu thật (persistent store).
 * _SEED_ARTICLES chỉ dùng để khởi tạo lần đầu tiên — sau đó
 * mọi thao tác đọc/ghi đều qua addArticle/updateArticle/deleteArticle,
 * KHÔNG cần sửa file JS này để thêm bài viết mới.
 */

import Config from '../core/config.js';

/**
 * @typedef {Object} Article
 * @property {string}   id
 * @property {string}   title
 * @property {string}   excerpt
 * @property {string}   content
 * @property {string}   category
 * @property {string[]} tags
 * @property {string}   author
 * @property {string}   authorAvatar
 * @property {string}   date          - ISO 8601
 * @property {number}   readTimeMin
 * @property {string}   thumbnail
 * @property {boolean}  featured
 */

// ── Seed Data (chỉ dùng lần đầu khi LocalStorage trống) ───────────

/** @type {Article[]} */
const _SEED_ARTICLES = [
  {
    id: 'css-3d-skybox-architecture',
    title: 'Xây dựng Skybox 3D thuần CSS: Kiến trúc và Kỹ thuật',
    excerpt: 'Khám phá cách tạo hiệu ứng không gian 3D immersive chỉ với CSS transforms và custom properties, không cần WebGL hay thư viện bên thứ ba.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'CSS',
    tags: ['css3d', 'transform', 'performance', 'vanilla'],
    author: 'Nguyễn Kiến Trúc',
    authorAvatar: 'assets/avatars/nguyen-kien-truc.jpg',
    date: '2025-06-15T08:00:00Z',
    readTimeMin: 12,
    thumbnail: 'assets/thumbnails/css-3d-skybox.jpg',
    featured: true,
  },
  {
    id: 'event-driven-vanilla-js',
    title: 'Event-Driven Architecture với Vanilla JS thuần túy',
    excerpt: 'Hướng dẫn xây dựng hệ thống Pub/Sub mạnh mẽ, loosely-coupled hoàn toàn không phụ thuộc framework nào.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'JavaScript',
    tags: ['event-driven', 'pubsub', 'architecture', 'vanilla'],
    author: 'Trần Hệ Thống',
    authorAvatar: 'assets/avatars/tran-he-thong.jpg',
    date: '2025-06-10T09:00:00Z',
    readTimeMin: 8,
    thumbnail: 'assets/thumbnails/event-driven.jpg',
    featured: false,
  },
  {
    id: 'design-tokens-css-variables',
    title: 'Design Tokens với CSS Custom Properties: Single Source of Truth',
    excerpt: 'Tại sao mọi dự án lớn đều cần một hệ thống Design Token và cách triển khai nó chỉ với CSS thuần.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'CSS',
    tags: ['design-system', 'tokens', 'css-variables', 'scalability'],
    author: 'Lê Thiết Kế',
    authorAvatar: 'assets/avatars/le-thiet-ke.jpg',
    date: '2025-06-05T10:00:00Z',
    readTimeMin: 10,
    thumbnail: 'assets/thumbnails/design-tokens.jpg',
    featured: false,
  },
  {
    id: 'solid-principles-frontend',
    title: 'SOLID Principles trong Frontend: Ứng dụng thực tế',
    excerpt: 'Năm nguyên lý SOLID không chỉ dành cho backend. Xem cách áp dụng chúng để viết Frontend code có khả năng maintain lâu dài.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'Architecture',
    tags: ['solid', 'clean-code', 'maintainability', 'principles'],
    author: 'Phạm Nguyên Lý',
    authorAvatar: 'assets/avatars/pham-nguyen-ly.jpg',
    date: '2025-05-28T08:30:00Z',
    readTimeMin: 15,
    thumbnail: 'assets/thumbnails/solid-frontend.jpg',
    featured: false,
  },
  {
    id: 'css-performance-gpu',
    title: 'CSS Performance: GPU Compositing và will-change',
    excerpt: 'Hiểu rõ cơ chế compositing của browser để viết animation 60fps mượt mà trên mọi thiết bị, kể cả mobile tầm trung.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'Performance',
    tags: ['gpu', 'compositing', 'animation', 'will-change'],
    author: 'Nguyễn Kiến Trúc',
    authorAvatar: 'assets/avatars/nguyen-kien-truc.jpg',
    date: '2025-05-20T11:00:00Z',
    readTimeMin: 9,
    thumbnail: 'assets/thumbnails/css-performance.jpg',
    featured: false,
  },
  {
    id: 'component-driven-css',
    title: 'Component-Driven CSS: Scoping và BEM không cần framework',
    excerpt: 'Xây dựng hệ thống CSS component có tính cô lập cao bằng naming convention và cascade layers mà không cần CSS Modules hay Styled Components.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'CSS',
    tags: ['component', 'bem', 'scoping', 'cascade'],
    author: 'Lê Thiết Kế',
    authorAvatar: 'assets/avatars/le-thiet-ke.jpg',
    date: '2025-05-12T09:00:00Z',
    readTimeMin: 11,
    thumbnail: 'assets/thumbnails/component-css.jpg',
    featured: false,
  },
  {
    id: 'state-management-vanilla',
    title: 'State Management không cần Redux: Flux-lite với Vanilla JS',
    excerpt: 'Triển khai pattern quản lý trạng thái ứng dụng mạnh mẽ với chưa đầy 200 dòng JS thuần — đủ dùng cho 90% dự án thực tế.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'JavaScript',
    tags: ['state', 'flux', 'vanilla', 'pattern'],
    author: 'Trần Hệ Thống',
    authorAvatar: 'assets/avatars/tran-he-thong.jpg',
    date: '2025-05-05T10:30:00Z',
    readTimeMin: 13,
    thumbnail: 'assets/thumbnails/state-management.jpg',
    featured: false,
  },
  {
    id: 'touch-events-mobile',
    title: 'Tối ưu Touch Events cho Mobile: Passive Listeners và Inertia',
    excerpt: 'Kỹ thuật xử lý touch events hiệu suất cao: passive event listeners, pointer events API, và mô phỏng inertia scroll tự nhiên.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'Performance',
    tags: ['touch', 'mobile', 'passive', 'inertia'],
    author: 'Phạm Nguyên Lý',
    authorAvatar: 'assets/avatars/pham-nguyen-ly.jpg',
    date: '2025-04-25T08:00:00Z',
    readTimeMin: 7,
    thumbnail: 'assets/thumbnails/touch-events.jpg',
    featured: false,
  },
  {
    id: 'accessibility-aria-keyboard',
    title: 'Accessibility thực chiến: ARIA, Keyboard Navigation và Focus Management',
    excerpt: 'Hướng dẫn toàn diện để xây dựng giao diện accessible theo chuẩn WCAG 2.1 AA mà không làm phức tạp codebase.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'Accessibility',
    tags: ['aria', 'wcag', 'keyboard', 'focus'],
    author: 'Lê Thiết Kế',
    authorAvatar: 'assets/avatars/le-thiet-ke.jpg',
    date: '2025-04-15T09:30:00Z',
    readTimeMin: 14,
    thumbnail: 'assets/thumbnails/accessibility.jpg',
    featured: false,
  },
];

// ── Repository ───────────────────────────────────────────────────

const ArticleRepository = (() => {

  /** In-memory cache của store — tránh JSON.parse lại mỗi lần đọc. */
  let _memoryCache = null;

  // ── Persistent Store (LocalStorage) ───────────────────────────────

  /**
   * Đọc store từ LocalStorage. Nếu trống/hỏng, seed lần đầu từ mock data.
   * @returns {Article[]} Tham chiếu nội bộ — KHÔNG trả trực tiếp ra ngoài.
   */
  function _loadStore() {
    if (_memoryCache) return _memoryCache;

    try {
      const raw = localStorage.getItem(Config.STORAGE.ARTICLES_STORE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          _memoryCache = parsed;
          return _memoryCache;
        }
      }
    } catch (err) {
      console.warn('[ArticleRepository] LocalStorage lỗi/hỏng, sẽ seed lại từ mock data:', err);
    }

    const seeded = _SEED_ARTICLES.map(_cloneArticle);
    _persistStore(seeded);
    return seeded;
  }

  /**
   * Ghi store xuống LocalStorage và cập nhật memory cache.
   * @param {Article[]} articles
   */
  function _persistStore(articles) {
    _memoryCache = articles;
    try {
      localStorage.setItem(Config.STORAGE.ARTICLES_STORE, JSON.stringify(articles));
    } catch (err) {
      console.warn('[ArticleRepository] Không thể ghi LocalStorage (có thể đã đầy dung lượng):', err);
    }
  }

  // ── Read ─────────────────────────────────────────────────────────

  /**
   * Lấy tất cả bài viết.
   * @returns {Article[]}
   */
  function getAll() {
    return _loadStore().map(_cloneArticle);
  }

  /**
   * Lấy bài viết theo id.
   * @param {string} id
   * @returns {Article|null}
   */
  function getById(id) {
    const article = _loadStore().find(a => a.id === id);
    return article ? _cloneArticle(article) : null;
  }

  /**
   * Lấy danh sách bài featured.
   * @returns {Article[]}
   */
  function getFeatured() {
    return getAll().filter(a => a.featured);
  }

  /**
   * Lấy danh sách tất cả categories (không trùng).
   * @returns {string[]}
   */
  function getCategories() {
    return [...new Set(_loadStore().map(a => a.category))].sort();
  }

  /**
   * Lấy danh sách tất cả tags (không trùng).
   * @returns {string[]}
   */
  function getTags() {
    return [...new Set(_loadStore().flatMap(a => a.tags))].sort();
  }

  // ── Filter & Search ──────────────────────────────────────────────

  /**
   * Lọc và tìm kiếm bài viết.
   * @param {{ query?: string, category?: string, tags?: string[], page?: number }} options
   * @returns {{ results: Article[], total: number, page: number, totalPages: number }}
   */
  function query({ query = '', category = null, tags = [], page = 1 } = {}) {
    let results = getAll();

    if (category) {
      results = results.filter(a => a.category === category);
    }

    if (tags.length > 0) {
      results = results.filter(a => tags.every(t => a.tags.includes(t)));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(q)   ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)  ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    results.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.date) - new Date(a.date);
    });

    const total      = results.length;
    const pageSize   = Config.ARTICLES.PAGE_SIZE;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const safePage   = Math.max(1, Math.min(page, totalPages));
    const start      = (safePage - 1) * pageSize;
    const paginated  = results.slice(start, start + pageSize);

    return { results: paginated, total, page: safePage, totalPages };
  }

  /**
   * Lấy bài viết liên quan (cùng category, loại trừ bài hiện tại).
   * @param {string} id
   * @param {number} [limit=3]
   * @returns {Article[]}
   */
  function getRelated(id, limit = 3) {
    const article = getById(id);
    if (!article) return [];

    return getAll()
      .filter(a => a.id !== id && a.category === article.category)
      .slice(0, limit);
  }

  // ── Write (CRUD) ─────────────────────────────────────────────────
  // Thêm/sửa/xóa bài viết KHÔNG cần đụng vào file JS này.
  // Mọi thay đổi được ghi thẳng vào LocalStorage và tồn tại lâu dài.

  /**
   * Thêm bài viết mới. Tự sinh id từ title (slug), tự tính readTimeMin
   * nếu không cung cấp, tự gán ngày hiện tại nếu thiếu.
   * @param {Partial<Article>} data
   * @returns {Article} Bài viết đã được tạo (đầy đủ field).
   */
  function addArticle(data) {
    if (!data || typeof data !== 'object') {
      throw new TypeError('[ArticleRepository] addArticle yêu cầu một object dữ liệu.');
    }
    if (!data.title || !data.title.trim()) {
      throw new Error('[ArticleRepository] Bài viết phải có tiêu đề (title).');
    }

    const store = _loadStore();

    let id = data.id ? String(data.id).trim() : _slugify(data.title);
    if (store.some(a => a.id === id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }

    const article = {
      id,
      title:        data.title.trim(),
      excerpt:      data.excerpt || '',
      content:      data.content || '',
      category:     data.category || 'Khác',
      tags:         Array.isArray(data.tags) ? [...data.tags] : [],
      author:       data.author || 'Ẩn danh',
      authorAvatar: data.authorAvatar || '',
      date:         data.date || new Date().toISOString(),
      readTimeMin:  data.readTimeMin || _estimateReadTime(data.content),
      thumbnail:    data.thumbnail || '',
      featured:     Boolean(data.featured),
    };

    const next = [article, ...store];
    _persistStore(next);

    return _cloneArticle(article);
  }

  /**
   * Cập nhật bài viết theo id. id không thể bị ghi đè qua updates.
   * @param {string} id
   * @param {Partial<Article>} updates
   * @returns {Article|null} Bài viết sau cập nhật, null nếu không tìm thấy.
   */
  function updateArticle(id, updates) {
    const store = _loadStore();
    const index = store.findIndex(a => a.id === id);

    if (index === -1) {
      console.warn(`[ArticleRepository] updateArticle: không tìm thấy id "${id}".`);
      return null;
    }

    const merged = { ..._cloneArticle(store[index]), ...updates, id: store[index].id };
    const next   = [...store];
    next[index]  = merged;
    _persistStore(next);

    return _cloneArticle(merged);
  }

  /**
   * Xóa bài viết theo id.
   * @param {string} id
   * @returns {boolean} true nếu xóa thành công.
   */
  function deleteArticle(id) {
    const store = _loadStore();
    const next  = store.filter(a => a.id !== id);

    if (next.length === store.length) {
      console.warn(`[ArticleRepository] deleteArticle: không tìm thấy id "${id}".`);
      return false;
    }

    _persistStore(next);
    return true;
  }

  /**
   * Khôi phục store về dữ liệu mẫu ban đầu (factory reset).
   * @returns {Article[]}
   */
  function resetToSeed() {
    const seeded = _SEED_ARTICLES.map(_cloneArticle);
    _persistStore(seeded);
    return seeded.map(_cloneArticle);
  }

  /**
   * Xuất toàn bộ store dưới dạng JSON string — dùng để backup/di chuyển dữ liệu.
   * @returns {string}
   */
  function exportAll() {
    return JSON.stringify(_loadStore(), null, 2);
  }

  /**
   * Nhập toàn bộ store từ JSON string — thay thế hoàn toàn dữ liệu hiện tại.
   * @param {string} jsonString
   * @returns {number} Số bài viết đã nhập.
   */
  function importAll(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('[ArticleRepository] importAll: chuỗi JSON không hợp lệ.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('[ArticleRepository] importAll: dữ liệu phải là một mảng bài viết.');
    }
    _persistStore(parsed);
    return parsed.length;
  }

  // ── Private helpers ──────────────────────────────────────────────

  /** @param {Article} article @returns {Article} */
  function _cloneArticle(article) {
    return { ...article, tags: [...article.tags] };
  }

  /**
   * Chuyển tiêu đề thành slug id — hỗ trợ bỏ dấu tiếng Việt.
   * @param {string} title
   * @returns {string}
   */
  function _slugify(title) {
    const slug = title
      .toLowerCase()
      .replace(/đ/g, 'd').replace(/Đ/g, 'd')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);

    return slug || `bai-viet-${Date.now().toString(36)}`;
  }

  /**
   * Ước tính thời gian đọc dựa trên số từ (~200 từ/phút), loại bỏ HTML tags.
   * @param {string} [content]
   * @returns {number}
   */
  function _estimateReadTime(content) {
    if (!content) return 1;
    const text  = content.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({
    getAll,
    getById,
    getFeatured,
    getCategories,
    getTags,
    query,
    getRelated,
    addArticle,
    updateArticle,
    deleteArticle,
    resetToSeed,
    exportAll,
    importAll,
  });

})();

export default ArticleRepository; 
