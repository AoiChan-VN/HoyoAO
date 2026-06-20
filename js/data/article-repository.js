/**
 * @file   js/data/article-repository.js
 * @layer  data
 * @domain articles
 * @depends config.js
 *
 * NGUỒN DỮ LIỆU: content/articles.json (qua fetch), KHÔNG hardcode
 * trong file JS này. Sau lần tải đầu tiên, LocalStorage trở thành
 * live store hỗ trợ CRUD đầy đủ — thêm/sửa/xóa bài viết không bao
 * giờ cần sửa code.
 *
 * BẮT BUỘC: gọi `await ArticleRepository.init()` một lần duy nhất
 * trước khi dùng bất kỳ phương thức đọc/ghi nào khác (app.js đã lo
 * việc này ở bước bootstrap, components không cần tự gọi).
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

const ArticleRepository = (() => {

  /** @type {Article[]|null} In-memory store — null cho đến khi init() hoàn tất. */
  let _memoryCache = null;

  /** @type {boolean} */
  let _initialized = false;

  /** @type {Promise<void>|null} Tránh fetch trùng nếu init() bị gọi nhiều lần đồng thời. */
  let _initPromise = null;

  /** @type {string|null} Lỗi tải dữ liệu gần nhất, nếu có. */
  let _initError = null;

  // ── Khởi tạo ─────────────────────────────────────────────────────

  /**
   * Tải dữ liệu bài viết. Ưu tiên LocalStorage (đã có từ trước,
   * có thể đã bị người dùng chỉnh sửa qua CRUD); nếu trống, fetch
   * từ content/articles.json và seed LocalStorage lần đầu.
   *
   * An toàn khi gọi nhiều lần — chỉ thực thi thật sự một lần.
   * @returns {Promise<void>}
   */
  function init() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      // Bước 1: thử đọc từ LocalStorage trước (dữ liệu đã từng tồn tại / đã chỉnh sửa)
      try {
        const raw = localStorage.getItem(Config.STORAGE.ARTICLES_STORE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            _memoryCache = parsed;
            _initialized = true;
            return;
          }
        }
      } catch (err) {
        console.warn('[ArticleRepository] LocalStorage hỏng, sẽ tải lại từ content/articles.json:', err);
      }

      // Bước 2: LocalStorage trống — tải từ JSON, đây là nguồn dữ liệu thật
      try {
        const response = await fetch(Config.CONTENT.ARTICLES_JSON);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} khi tải ${Config.CONTENT.ARTICLES_JSON}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('content/articles.json phải chứa một mảng bài viết.');
        }
        _memoryCache = data;
        _persistStore(data);
      } catch (err) {
        _initError = err.message || String(err);
        console.error('[ArticleRepository] Không thể tải dữ liệu bài viết:', err);
        _memoryCache = []; // Không hardcode fallback — UI sẽ hiện trạng thái rỗng/lỗi rõ ràng
      } finally {
        _initialized = true;
      }
    })();

    return _initPromise;
  }

  /**
   * @returns {boolean} true nếu init() đã hoàn tất (thành công hoặc thất bại).
   */
  function isReady() {
    return _initialized;
  }

  /**
   * @returns {string|null} Thông báo lỗi của lần tải gần nhất, null nếu không có lỗi.
   */
  function getInitError() {
    return _initError;
  }

  // ── Persistent Store (LocalStorage) ───────────────────────────────

  /**
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

  /**
   * Đảm bảo store đã sẵn sàng trước khi đọc/ghi. Cảnh báo rõ ràng
   * nếu một component gọi repository trước khi app.js await init().
   * @returns {Article[]}
   */
  function _requireStore() {
    if (!_initialized) {
      console.warn(
        '[ArticleRepository] Gọi trước khi init() hoàn tất — trả về dữ liệu rỗng. ' +
        'Đảm bảo app.js đã `await ArticleRepository.init()` trước khi dùng repository.'
      );
      return [];
    }
    return _memoryCache || [];
  }

  // ── Read ─────────────────────────────────────────────────────────

  /** @returns {Article[]} */
  function getAll() {
    return _requireStore().map(_cloneArticle);
  }

  /**
   * @param {string} id
   * @returns {Article|null}
   */
  function getById(id) {
    const article = _requireStore().find(a => a.id === id);
    return article ? _cloneArticle(article) : null;
  }

  /** @returns {Article[]} */
  function getFeatured() {
    return getAll().filter(a => a.featured);
  }

  /** @returns {string[]} */
  function getCategories() {
    return [...new Set(_requireStore().map(a => a.category))].sort();
  }

  /** @returns {string[]} */
  function getTags() {
    return [...new Set(_requireStore().flatMap(a => a.tags))].sort();
  }

  // ── Filter & Search ──────────────────────────────────────────────

  /**
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
  // Thêm/sửa/xóa bài viết hoàn toàn qua các hàm này — không bao giờ
  // cần sửa content/articles.json hay file JS này để cập nhật nội dung.

  /**
   * @param {Partial<Article>} data
   * @returns {Article}
   */
  function addArticle(data) {
    if (!data || typeof data !== 'object') {
      throw new TypeError('[ArticleRepository] addArticle yêu cầu một object dữ liệu.');
    }
    if (!data.title || !data.title.trim()) {
      throw new Error('[ArticleRepository] Bài viết phải có tiêu đề (title).');
    }

    const store = _requireStore();

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

    _persistStore([article, ...store]);
    return _cloneArticle(article);
  }

  /**
   * @param {string} id
   * @param {Partial<Article>} updates
   * @returns {Article|null}
   */
  function updateArticle(id, updates) {
    const store = _requireStore();
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
   * @param {string} id
   * @returns {boolean}
   */
  function deleteArticle(id) {
    const store = _requireStore();
    const next  = store.filter(a => a.id !== id);

    if (next.length === store.length) {
      console.warn(`[ArticleRepository] deleteArticle: không tìm thấy id "${id}".`);
      return false;
    }

    _persistStore(next);
    return true;
  }

  /**
   * Tải lại từ content/articles.json, GHI ĐÈ mọi thay đổi CRUD đã có trong LocalStorage.
   * @returns {Promise<Article[]>}
   */
  async function resetToSource() {
    const response = await fetch(Config.CONTENT.ARTICLES_JSON);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('content/articles.json phải chứa một mảng bài viết.');
    _persistStore(data);
    return data.map(_cloneArticle);
  }

  /** @returns {string} */
  function exportAll() {
    return JSON.stringify(_requireStore(), null, 2);
  }

  /**
   * @param {string} jsonString
   * @returns {number}
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
    return { ...article, tags: [...(article.tags || [])] };
  }

  /**
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
    init,
    isReady,
    getInitError,
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
    resetToSource,
    exportAll,
    importAll,
  });

})();

export default ArticleRepository;
