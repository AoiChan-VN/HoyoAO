/**
 * @file   js/components/articles/article-renderer.js
 * @layer  components/articles
 * @depends event-bus.js, state-manager.js, config.js
 */

import EventBus,  { EVENTS } from '../../core/event-bus.js';
import StateManager           from '../../core/state-manager.js';
import Config                 from '../../core/config.js';

const ArticleRenderer = (() => {

  // ── DOM refs ─────────────────────────────────────────────────────
  let _grid        = null;
  let _skeletonGrid = null;
  let _metaEl      = null;
  let _emptyEl     = null;
  let _loadMoreBtn = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _grid        = document.querySelector('[data-articles-grid]');
    _skeletonGrid = document.querySelector('[data-articles-skeleton]');
    _metaEl      = document.querySelector('[data-articles-meta]');
    _emptyEl     = document.querySelector('[data-articles-empty]');
    _loadMoreBtn = document.querySelector('[data-load-more]');

    if (!_grid) {
      console.error('[ArticleRenderer] Không tìm thấy [data-articles-grid].');
      return;
    }

    _bindEvents();
  }

  // ── Render ───────────────────────────────────────────────────────

  /**
   * Render danh sách bài viết vào grid.
   * @param {Article[]} articles
   * @param {{ total: number, page: number, totalPages: number }} meta
   * @param {boolean} [append=false] — true khi load more
   */
  function renderList(articles, meta, append = false) {
    _hideLoading();
    _updateMeta(meta.total);

    if (articles.length === 0 && !append) {
      _showEmpty();
      return;
    }

    _hideEmpty();

    const fragment = document.createDocumentFragment();
    articles.forEach((article, index) => {
      const item = document.createElement('div');
      item.className = 'article-domain__grid-item';
      if (article.featured && !append) item.classList.add('article-domain__grid-item--featured');
      item.innerHTML = _buildCardHTML(article);

      // Stagger reveal
      const card = item.querySelector('.article-card');
      if (card) {
        card.style.transitionDelay = `${index * Config.PERF.TRANSITION_STAGGER_MS}ms`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => card.setAttribute('data-visible', ''));
        });
      }

      fragment.appendChild(item);
    });

    if (append) {
      _grid.appendChild(fragment);
    } else {
      _grid.innerHTML = '';
      _grid.appendChild(fragment);
    }

    // Load more button
    if (_loadMoreBtn) {
      const hasMore = meta.page < meta.totalPages;
      _loadMoreBtn.style.display = hasMore ? 'flex' : 'none';
      _loadMoreBtn.dataset.page  = String(meta.page + 1);
    }
  }

  /**
   * Render bài viết đơn (reader view).
   * @param {Article} article
   * @param {HTMLElement} container
   */
  function renderArticle(article, container) {
    if (!container) {
      console.error('[ArticleRenderer] container không tồn tại.');
      return;
    }
    container.innerHTML = _buildArticleHTML(article);
    _initReadingProgress();
    _initTOC(container);
  }

  // ── Card HTML ────────────────────────────────────────────────────

  function _buildCardHTML(article) {
    const date    = _formatDate(article.date);
    const initials = _getInitials(article.author);
    const excerpt = _truncate(article.excerpt, Config.ARTICLES.EXCERPT_MAX_LENGTH);

    return `
      <a class="article-card u-fade"
         href="articles.html?id=${_escape(article.id)}"
         aria-label="${_escape(article.title)}">

        <div class="article-card__thumbnail">
          ${article.thumbnail
            ? `<img src="${_escape(article.thumbnail)}"
                    alt="${_escape(article.title)}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.remove()">`
            : ''}
          <span class="article-card__badge">${_escape(article.category)}</span>
        </div>

        <div class="article-card__body">
          <div class="article-card__meta">
            <time class="article-card__date" datetime="${_escape(article.date)}">${date}</time>
            <span class="article-card__meta-dot" aria-hidden="true"></span>
            <span class="article-card__read-time">${article.readTimeMin} phút đọc</span>
          </div>

          <h2 class="article-card__title">${_escape(article.title)}</h2>
          <p class="article-card__excerpt">${_escape(excerpt)}</p>

          <div class="article-card__footer">
            <div class="article-card__author">
              <div class="article-card__avatar" aria-hidden="true">
                ${article.authorAvatar
                  ? `<img src="${_escape(article.authorAvatar)}" alt="${_escape(article.author)}" onerror="this.outerHTML='${initials}'">`
                  : initials}
              </div>
              <span class="article-card__author-name">${_escape(article.author)}</span>
            </div>
            <span class="article-card__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </a>
    `;
  }

  // ── Article HTML ─────────────────────────────────────────────────

  function _buildArticleHTML(article) {
    const date    = _formatDate(article.date);
    const initials = _getInitials(article.author);

    return `
      <div class="article-reader__progress" data-reading-progress role="progressbar"
           aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
           aria-label="Tiến trình đọc"></div>

      <a class="article-reader__back" href="articles.html" data-back-link>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Tất cả bài viết
      </a>

      <header class="article-reader__header">
        <a class="article-reader__category"
           href="articles.html?category=${_escape(article.category)}">
          ${_escape(article.category)}
        </a>

        <h1 class="article-reader__title">${_escape(article.title)}</h1>
        <p class="article-reader__lead">${_escape(article.excerpt)}</p>

        <div class="article-reader__byline">
          <div class="article-reader__author">
            <div class="article-reader__avatar">
              ${article.authorAvatar
                ? `<img src="${_escape(article.authorAvatar)}" alt="${_escape(article.author)}" onerror="this.outerHTML='${initials}'">`
                : initials}
            </div>
            <div class="article-reader__author-info">
              <span class="article-reader__author-name">${_escape(article.author)}</span>
              <span class="article-reader__author-meta">
                <time datetime="${_escape(article.date)}">${date}</time>
              </span>
            </div>
          </div>
          <div class="article-reader__stats">
            <span class="article-reader__stat">${article.readTimeMin} phút đọc</span>
          </div>
        </div>
      </header>

      ${article.thumbnail
        ? `<figure class="article-reader__hero">
             <img src="${_escape(article.thumbnail)}" alt="${_escape(article.title)}"
                  loading="eager" decoding="async" onerror="this.closest('figure').remove()">
           </figure>`
        : ''}

      <div class="article-reader__prose" data-prose>
        ${article.content}
      </div>

      <div class="article-reader__tags" role="list" aria-label="Tags">
        ${article.tags.map(tag => `
          <a class="article-reader__tag"
             href="articles.html?tag=${_escape(tag)}"
             role="listitem">#${_escape(tag)}</a>
        `).join('')}
      </div>
    `;
  }

  // ── Reading progress ─────────────────────────────────────────────

  function _initReadingProgress() {
    const progressEl = document.querySelector('[data-reading-progress]');
    const proseEl    = document.querySelector('[data-prose]');
    if (!progressEl || !proseEl) return;

    let ticking = false;

    const update = () => {
      const rect     = proseEl.getBoundingClientRect();
      const total    = rect.height - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = total > 0 ? Math.min(1, scrolled / total) : 0;

      progressEl.style.transform = `scaleX(${progress})`;
      progressEl.setAttribute('aria-valuenow', String(Math.round(progress * 100)));

      StateManager.set('articles.readingProgress', Math.round(progress * 100));
      EventBus.emit(EVENTS.ARTICLE_PROGRESS, { progress: Math.round(progress * 100) });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  // ── TOC ──────────────────────────────────────────────────────────

  function _initTOC(container) {
    const tocList   = document.querySelector('[data-toc-list]');
    const proseEl   = container.querySelector('[data-prose]');
    if (!tocList || !proseEl) return;

    const headings = [...proseEl.querySelectorAll('h2, h3')];
    if (headings.length === 0) return;

    const fragment = document.createDocumentFragment();

    headings.forEach((heading, i) => {
      if (!heading.id) heading.id = `heading-${i}`;
      const li   = document.createElement('li');
      const link = document.createElement('a');

      link.href      = `#${heading.id}`;
      link.className = `article-reader__toc-link${heading.tagName === 'H3' ? ' article-reader__toc-link--h3' : ''}`;
      link.textContent = heading.textContent;
      link.dataset.tocTarget = heading.id;

      li.appendChild(link);
      fragment.appendChild(li);
    });

    tocList.appendChild(fragment);

    // Highlight active heading via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id   = entry.target.id;
        const link = tocList.querySelector(`[data-toc-target="${id}"]`);
        if (link) link.classList.toggle('article-reader__toc-link--active', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
  }

  // ── UI helpers ───────────────────────────────────────────────────

  function showLoading() {
    if (_skeletonGrid) _skeletonGrid.style.display = 'grid';
    if (_grid) _grid.style.display = 'none';
  }

  function _hideLoading() {
    if (_skeletonGrid) _skeletonGrid.style.display = 'none';
    if (_grid) _grid.style.display = 'grid';
  }

  /**
   * @param {{ title?: string, text?: string, showRetry?: boolean }} [options]
   */
  function _showEmpty(options = {}) {
    if (!_emptyEl) return;

    const titleEl = _emptyEl.querySelector('[data-empty-title]');
    const textEl  = _emptyEl.querySelector('[data-empty-text]');
    const retryBtn = _emptyEl.querySelector('[data-empty-retry]');

    if (titleEl) titleEl.textContent = options.title || 'Không tìm thấy bài viết';
    if (textEl)  textEl.textContent  = options.text  || 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc danh mục.';
    if (retryBtn) {
      if (options.showRetry) retryBtn.setAttribute('data-visible', '');
      else retryBtn.removeAttribute('data-visible');
    }

    _emptyEl.setAttribute('data-visible', '');
    if (_grid) _grid.style.display = 'none';
  }

  function _hideEmpty() {
    if (_emptyEl) _emptyEl.removeAttribute('data-visible');
    if (_grid) _grid.style.display = 'grid';
  }

  function _updateMeta(total) {
    if (!_metaEl) return;
    const countEl = _metaEl.querySelector('[data-count]');
    if (countEl) countEl.textContent = String(total);
  }

  // ── String helpers ───────────────────────────────────────────────

  function _escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function _truncate(str, max) {
    if (!str || str.length <= max) return str;
    return str.slice(0, max).trimEnd() + '…';
  }

  function _getInitials(name) {
    return (name || '')
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function _formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  // ── Event bindings ───────────────────────────────────────────────

  function _bindEvents() {
    EventBus.on(EVENTS.ARTICLES_LOADED, ({ articles, meta, append }) => {
      renderList(articles, meta, append);
    });

    EventBus.on(EVENTS.ARTICLES_ERROR, ({ message }) => {
      _hideLoading();
      _showEmpty();
      console.error('[ArticleRenderer]', message);
    });

    EventBus.on(EVENTS.ARTICLES_LOAD_FAILED, ({ message }) => {
      _hideLoading();
      _showEmpty({
        title: 'Không thể tải dữ liệu bài viết',
        text: 'Đã xảy ra lỗi khi tải content/articles.json. Vui lòng kiểm tra kết nối mạng và thử lại.',
        showRetry: true,
      });
      console.error('[ArticleRenderer] Tải dữ liệu thất bại:', message);
    });

    const retryBtn = _emptyEl?.querySelector('[data-empty-retry]');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => window.location.reload());
    }

    if (_loadMoreBtn) {
      _loadMoreBtn.addEventListener('click', () => {
        const page = Number(_loadMoreBtn.dataset.page) || 2;
        EventBus.emit(EVENTS.SEARCH_QUERY, {
          query:    StateManager.get('articles.searchQuery'),
          category: StateManager.get('articles.activeCategory'),
          page,
          append:   true,
        });
      });
    }
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, renderList, renderArticle, showLoading });

})();

export default ArticleRenderer;
