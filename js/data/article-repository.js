/**
 * @file   js/data/article-repository.js
 * @layer  data
 * @domain articles
 * @depends config.js
 *
 * Quản lý toàn bộ dữ liệu bài viết.
 * Không chứa logic render hay DOM — chỉ quản lý và cung cấp dữ liệu.
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

// ── Mock Data ────────────────────────────────────────────────────

/** @type {Article[]} */
const _mockArticles = [
  {
    id: 'css-3d-skybox-architecture',
    title: 'Xây dựng Skybox 3D thuần CSS: Kiến trúc và Kỹ thuật',
    excerpt: 'Khám phá cách tạo hiệu ứng không gian 3D immersive chỉ với CSS transforms và custom properties, không cần WebGL hay thư viện bên thứ ba.',
    content: '<p>Nội dung đầy đủ của bài viết...</p>',
    category: 'CSS',
    tags: ['css3d', 'transform', 'performance', 'vanilla'],
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/kien-truc.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/he-thong.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/thiet-ke.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/nguyen-ly.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/kien-truc.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/thiet-ke.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/he-thong.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/nguyen-ly.jpg',
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
    author: 'Aoi-VN',
    authorAvatar: 'assets/avatars/thiet-ke.jpg',
    date: '2025-04-15T09:30:00Z',
    readTimeMin: 14,
    thumbnail: 'assets/thumbnails/accessibility.jpg',
    featured: false,
  },
];

// ── Repository ───────────────────────────────────────────────────

const ArticleRepository = (() => {

  // ── Read ─────────────────────────────────────────────────────────

  /**
   * Lấy tất cả bài viết (có cache LocalStorage).
   * @returns {Article[]}
   */
  function getAll() {
    const cached = _readCache();
    if (cached) return cached;
    return _mockArticles.map(_cloneArticle);
  }

  /**
   * Lấy bài viết theo id.
   * @param {string} id
   * @returns {Article|null}
   */
  function getById(id) {
    const all = getAll();
    const article = all.find(a => a.id === id);
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
    const all = getAll();
    return [...new Set(all.map(a => a.category))].sort();
  }

  /**
   * Lấy danh sách tất cả tags (không trùng).
   * @returns {string[]}
   */
  function getTags() {
    const all = getAll();
    return [...new Set(all.flatMap(a => a.tags))].sort();
  }

  // ── Filter & Search ──────────────────────────────────────────────

  /**
   * Lọc và tìm kiếm bài viết.
   * @param {{ query?: string, category?: string, tags?: string[], page?: number }} options
   * @returns {{ results: Article[], total: number, page: number, totalPages: number }}
   */
  function query({ query = '', category = null, tags = [], page = 1 } = {}) {
    let results = getAll();

    // Filter by category
    if (category) {
      results = results.filter(a => a.category === category);
    }

    // Filter by tags (bài viết phải có TẤT CẢ tags được chỉ định)
    if (tags.length > 0) {
      results = results.filter(a => tags.every(t => a.tags.includes(t)));
    }

    // Search query — tìm trong title, excerpt, tags, author
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(q)   ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)  ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort: featured trước, sau đó mới nhất
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

    return {
      results:    paginated,
      total,
      page:       safePage,
      totalPages,
    };
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

  // ── Cache ────────────────────────────────────────────────────────

  function _readCache() {
    try {
      const ttl  = localStorage.getItem(Config.STORAGE.ARTICLES_CACHE_TTL);
      const data = localStorage.getItem(Config.STORAGE.ARTICLES_CACHE);
      if (!ttl || !data) return null;
      if (Date.now() > Number(ttl)) {
        localStorage.removeItem(Config.STORAGE.ARTICLES_CACHE);
        localStorage.removeItem(Config.STORAGE.ARTICLES_CACHE_TTL);
        return null;
      }
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  function _writeCache(articles) {
    try {
      localStorage.setItem(Config.STORAGE.ARTICLES_CACHE, JSON.stringify(articles));
      localStorage.setItem(Config.STORAGE.ARTICLES_CACHE_TTL, String(Date.now() + Config.STORAGE.CACHE_TTL_MS));
    } catch {
      // Storage đầy hoặc không khả dụng — tiếp tục bình thường
    }
  }

  /**
   * Xóa cache bài viết.
   */
  function clearCache() {
    try {
      localStorage.removeItem(Config.STORAGE.ARTICLES_CACHE);
      localStorage.removeItem(Config.STORAGE.ARTICLES_CACHE_TTL);
    } catch {
      // ignore
    }
  }

  // ── Private ──────────────────────────────────────────────────────

  /** @param {Article} article @returns {Article} */
  function _cloneArticle(article) {
    return { ...article, tags: [...article.tags] };
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
    clearCache,
  });

})();

export default ArticleRepository; 
