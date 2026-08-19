/**
 * Search Service (§25, §64, §56)
 *
 * OS-level search across registered sources (resources, applications,
 * and future content/file sources). Sources register via contract; the
 * service owns the normalized index (§64 source of truth).
 *
 * Scoring is intentionally simple and explainable (§77):
 *   title match > tag match > body match.
 */

export class SearchService {
  /** @type {Map<string, object>} itemId → normalized item */
  #index = new Map();
  /** @type {Map<string, object>} sourceId → source meta */
  #sources = new Map();
  #logger;
  #eventBus;

  constructor(logger, eventBus) {
    this.#logger = logger;
    this.#eventBus = eventBus;
  }

  /* ---- sources ---- */

  registerSource(sourceId, meta = {}) {
    if (typeof sourceId !== 'string' || sourceId.length === 0) {
      this.#logger.warn('search', 'registerSource: sourceId required');
      return false;
    }
    this.#sources.set(sourceId, { sourceId, ...meta });
    this.#eventBus.emit('search:source-registered', { sourceId });
    return true;
  }

  unregisterSource(sourceId) {
    this.removeBySource(sourceId);
    const existed = this.#sources.delete(sourceId);
    if (existed) this.#eventBus.emit('search:source-unregistered', { sourceId });
    return existed;
  }

  getSources() {
    return Array.from(this.#sources.values()).map((s) => ({ ...s }));
  }

  /* ---- indexing (§57 normalize) ---- */

  /**
   * Item shape: { id, source, type, title, body?, tags?, route?, meta? }
   */
  indexItem(item) {
    if (!item || typeof item.id !== 'string' || typeof item.source !== 'string') {
      this.#logger.warn('search', 'indexItem: item.id and item.source are required');
      return false;
    }
    const normalized = {
      id: item.id,
      source: item.source,
      type: item.type || 'unknown',
      title: String(item.title || ''),
      body: String(item.body || ''),
      tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : [],
      route: item.route || null,
      meta: item.meta || {},
      indexedAt: Date.now(),
      _title: String(item.title || '').toLowerCase(),
      _body: String(item.body || '').toLowerCase(),
      _tags: Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).toLowerCase())
        : [],
    };
    this.#index.set(item.id, normalized);
    return true;
  }

  indexMany(items) {
    if (!Array.isArray(items)) return 0;
    let count = 0;
    for (const it of items) {
      if (this.indexItem(it)) count++;
    }
    if (count > 0) this.#eventBus.emit('search:indexed', { count });
    return count;
  }

  removeItem(id) {
    return this.#index.delete(id);
  }

  removeBySource(sourceId) {
    let removed = 0;
    for (const [id, item] of this.#index) {
      if (item.source === sourceId) {
        this.#index.delete(id);
        removed++;
      }
    }
    return removed;
  }

  clear() {
    this.#index.clear();
  }

  /* ---- query ---- */

  /**
   * @param {string} text
   * @param {{source?:string, type?:string, limit?:number}} options
   * @returns {Array<object>} ranked results
   */
  query(text, options = {}) {
    const q = typeof text === 'string' ? text.trim().toLowerCase() : '';
    if (!q) return [];

    const terms = q.split(/\s+/).filter(Boolean);
    const limit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : 50;
    const sourceFilter = options.source || null;
    const typeFilter = options.type || null;

    const results = [];
    for (const item of this.#index.values()) {
      if (sourceFilter && item.source !== sourceFilter) continue;
      if (typeFilter && item.type !== typeFilter) continue;

      const score = this.#score(item, terms);
      if (score > 0) results.push({ item, score });
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map(({ item, score }) => ({
      id: item.id,
      source: item.source,
      type: item.type,
      title: item.title,
      body: item.body,
      tags: item.tags,
      route: item.route,
      meta: item.meta,
      score,
    }));
  }

  /* ---- observability (§48) ---- */

  getStats() {
    const bySource = {};
    for (const item of this.#index.values()) {
      bySource[item.source] = (bySource[item.source] || 0) + 1;
    }
    return {
      totalItems: this.#index.size,
      sources: Array.from(this.#sources.keys()),
      bySource,
    };
  }

  /* ---- private ---- */

  #score(item, terms) {
    let score = 0;
    for (const term of terms) {
      if (item._title.includes(term)) score += 10;
      if (item._tags.some((t) => t.includes(term))) score += 5;
      if (item._body.includes(term)) score += 1;
    }
    return score;
  }
} 
