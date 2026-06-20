/**
 * @file   js/components/articles/search-filter.js
 * @layer  components/articles
 * @depends event-bus.js, state-manager.js, config.js, article-repository.js
 */

import EventBus,  { EVENTS } from '../../core/event-bus.js';
import StateManager           from '../../core/state-manager.js';
import Config                 from '../../core/config.js';
import ArticleRepository      from '../../data/article-repository.js';

const SearchFilter = (() => {

  // ── DOM refs ─────────────────────────────────────────────────────
  let _searchInput    = null;
  let _clearBtn       = null;
  let _categoryBtns   = [];

  // ── Internal ─────────────────────────────────────────────────────
  let _debounceTimer  = null;

  // ── Named handler refs (để destroy() unsubscribe đúng) ───────────
  let _onFilterCategory     = null;
  let _onFilterReset        = null;
  let _onSearchQueryAppend  = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _searchInput  = document.querySelector('[data-search-input]');
    _clearBtn     = document.querySelector('[data-search-clear]');
    _categoryBtns = [...document.querySelectorAll('[data-category-btn]')];

    _bindEvents();
    _syncFromURL();
  }

  // ── URL sync ─────────────────────────────────────────────────────

  function _syncFromURL() {
    const params   = new URLSearchParams(window.location.search);
    const query    = params.get('q') || '';
    const category = params.get('category') || null;

    if (query && _searchInput) {
      _searchInput.value = query;
      _toggleClearBtn(query.length > 0);
    }

    if (category) {
      _setActiveCategory(category);
    }

    // Chạy query ban đầu
    _runQuery(query, category, 1);
  }

  // ── Query runner ─────────────────────────────────────────────────

  function _runQuery(query, category, page = 1, append = false) {
    StateManager.setBatch({
      'articles.searchQuery':    query,
      'articles.activeCategory': category,
      'articles.loading':        true,
    });

    EventBus.emit(EVENTS.SEARCH_QUERY, { query, category, page, append });

    try {
      const result = ArticleRepository.query({ query, category, page });

      StateManager.setBatch({
        'articles.filtered': result.results,
        'articles.loading':  false,
        'articles.error':    null,
      });

      EventBus.emit(EVENTS.SEARCH_RESULTS, {
        articles: result.results,
        meta:     { total: result.total, page: result.page, totalPages: result.totalPages },
        append,
      });

      EventBus.emit(EVENTS.ARTICLES_LOADED, {
        articles: result.results,
        meta:     { total: result.total, page: result.page, totalPages: result.totalPages },
        append,
      });

      _updateURL(query, category);

    } catch (err) {
      const message = err?.message || 'Lỗi không xác định khi tải bài viết.';
      StateManager.set('articles.error', message);
      EventBus.emit(EVENTS.ARTICLES_ERROR, { message });
      console.error('[SearchFilter]', err);
    }
  }

  // ── Search ───────────────────────────────────────────────────────

  function _onSearchInput(e) {
    const query = e.target.value.trim();
    _toggleClearBtn(query.length > 0);

    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _runQuery(query, StateManager.get('articles.activeCategory'), 1);
    }, Config.ARTICLES.SEARCH_DEBOUNCE_MS);
  }

  function _onSearchClear() {
    if (!_searchInput) return;
    _searchInput.value = '';
    _toggleClearBtn(false);
    _searchInput.focus();
    clearTimeout(_debounceTimer);
    _runQuery('', StateManager.get('articles.activeCategory'), 1);
  }

  function _toggleClearBtn(show) {
    if (!_clearBtn) return;
    _clearBtn.style.display = show ? 'flex' : 'none';
    _clearBtn.setAttribute('aria-hidden', String(!show));
  }

  // ── Category filter ───────────────────────────────────────────────

  function _onCategoryClick(e) {
    const btn      = e.currentTarget;
    const category = btn.getAttribute('data-category-btn') || null;
    const current  = StateManager.get('articles.activeCategory');

    // Toggle: click lại category đang active thì reset
    const next = (category === current) ? null : category;

    _setActiveCategory(next);
    _runQuery(StateManager.get('articles.searchQuery'), next, 1);
  }

  function _setActiveCategory(category) {
    _categoryBtns.forEach(btn => {
      const id = btn.getAttribute('data-category-btn');
      const isActive = id === category;
      btn.classList.toggle('article-domain__category-btn--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  // ── URL management ────────────────────────────────────────────────

  function _updateURL(query, category) {
    const params = new URLSearchParams();
    if (query)    params.set('q', query);
    if (category) params.set('category', category);

    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({ query, category }, '', newURL);
  }

  // ── Bind events ──────────────────────────────────────────────────

  function _bindEvents() {
    if (_searchInput) {
      _searchInput.addEventListener('input', _onSearchInput);
      _searchInput.addEventListener('keydown', _onSearchKeydown);
    }

    if (_clearBtn) {
      _clearBtn.addEventListener('click', _onSearchClear);
    }

    _categoryBtns.forEach(btn => {
      btn.addEventListener('click', _onCategoryClick);
    });

    // EventBus: cho phép module khác trigger filter
    _onFilterCategory = ({ category }) => {
      _setActiveCategory(category);
      _runQuery(StateManager.get('articles.searchQuery'), category, 1);
    };

    _onFilterReset = () => {
      if (_searchInput) _searchInput.value = '';
      _toggleClearBtn(false);
      _setActiveCategory(null);
      _runQuery('', null, 1);
    };

    // Load more — nhận từ article-renderer
    _onSearchQueryAppend = ({ query, category, page, append }) => {
      if (append) _runQuery(query, category, page, true);
    };

    EventBus.on(EVENTS.FILTER_CATEGORY, _onFilterCategory);
    EventBus.on(EVENTS.FILTER_RESET,    _onFilterReset);
    EventBus.on(EVENTS.SEARCH_QUERY,    _onSearchQueryAppend);

    // Popstate — back/forward browser
    window.addEventListener('popstate', _onPopstate);
  }

  function _onSearchKeydown(e) {
    if (e.key === 'Escape') _onSearchClear();
  }

  function _onPopstate(e) {
    const state = e.state || {};
    if (_searchInput) _searchInput.value = state.query || '';
    _toggleClearBtn((state.query || '').length > 0);
    _setActiveCategory(state.category || null);
    _runQuery(state.query || '', state.category || null, 1);
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    clearTimeout(_debounceTimer);
    EventBus.off(EVENTS.FILTER_CATEGORY, _onFilterCategory);
    EventBus.off(EVENTS.FILTER_RESET,    _onFilterReset);
    EventBus.off(EVENTS.SEARCH_QUERY,    _onSearchQueryAppend);
    window.removeEventListener('popstate', _onPopstate);

    if (_searchInput) {
      _searchInput.removeEventListener('input', _onSearchInput);
      _searchInput.removeEventListener('keydown', _onSearchKeydown);
    }
    if (_clearBtn) {
      _clearBtn.removeEventListener('click', _onSearchClear);
    }
    _categoryBtns.forEach(btn => {
      btn.removeEventListener('click', _onCategoryClick);
    });
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default SearchFilter; 
