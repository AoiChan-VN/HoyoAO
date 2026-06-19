/**
 * @file   js/app.js
 * @layer  bootstrap
 * @pattern Dependency Injection / Composition Root
 */

import EventBus, { EVENTS } from './core/event-bus.js';
import StateManager           from './core/state-manager.js';
import Config                  from './core/config.js';

import NavigationHandler       from './shared/navigation-handler.js';

import SkyboxViewer            from './components/home/skybox-viewer.js';
import OverlayUI               from './components/home/overlay-ui.js';

import ArticleRenderer         from './components/articles/article-renderer.js';
import SearchFilter            from './components/articles/search-filter.js';

import TouchInput              from './controllers/touch-input.js';
import MouseInput              from './controllers/mouse-input.js';

const App = (() => {

  /** @type {string|null} */
  let _currentDomain = null;

  /** @type {Array<{ destroy: Function }>} */
  const _activeModules = [];

  // ── Domain detection ─────────────────────────────────────────────

  /**
   * Phát hiện domain hiện tại dựa trên data-attribute của <body>.
   * Mỗi entry point (index.html / articles.html) tự khai báo domain riêng.
   * @returns {'home'|'articles'|null}
   */
  function _detectDomain() {
    const domain = document.body?.dataset?.domain;
    if (domain === 'home' || domain === 'articles') return domain;

    // Fallback: suy luận từ phần tử đặc trưng nếu thiếu data-attribute
    if (document.querySelector('[data-skybox-cube]'))   return 'home';
    if (document.querySelector('[data-articles-grid]')) return 'articles';

    return null;
  }

  // ── Domain bootstrap ─────────────────────────────────────────────

  /**
   * Khởi tạo toàn bộ module thuộc Home domain (3D Skybox).
   */
  function _bootstrapHomeDomain() {
    const scene = document.querySelector('[data-skybox-scene]');
    if (!scene) {
      throw new Error('[App] Home domain thiếu [data-skybox-scene].');
    }

    SkyboxViewer.init();
    OverlayUI.init();
    TouchInput.init(scene);
    MouseInput.init(scene);

    _activeModules.push(SkyboxViewer, OverlayUI, TouchInput, MouseInput);
  }

  /**
   * Khởi tạo toàn bộ module thuộc Articles domain (Content Platform).
   */
  function _bootstrapArticlesDomain() {
    const grid    = document.querySelector('[data-articles-grid]');
    const reader  = document.querySelector('[data-article-reader]');

    if (!grid && !reader) {
      throw new Error('[App] Articles domain thiếu [data-articles-grid] hoặc [data-article-reader].');
    }

    if (grid) {
      ArticleRenderer.init();
      SearchFilter.init();
      _activeModules.push(ArticleRenderer, SearchFilter);
    }

    if (reader) {
      _bootstrapArticleReader(reader);
    }
  }

  /**
   * Khởi tạo trang đọc bài viết đơn — load bài viết theo ?id= trên URL.
   * @param {HTMLElement} container
   */
  async function _bootstrapArticleReader(container) {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) {
      EventBus.emit(EVENTS.ARTICLES_ERROR, { message: 'Thiếu tham số ?id= trên URL.' });
      return;
    }

    try {
      const { default: ArticleRepository } = await import('./data/article-repository.js');
      const article = ArticleRepository.getById(id);

      if (!article) {
        EventBus.emit(EVENTS.ARTICLES_ERROR, { message: `Không tìm thấy bài viết với id "${id}".` });
        return;
      }

      StateManager.set('articles.currentArticle', article);
      ArticleRenderer.init();
      ArticleRenderer.renderArticle(article, container);

      EventBus.emit(EVENTS.ARTICLE_OPEN, { article });
      document.title = `${article.title} — ${Config.APP.NAME}`;

    } catch (err) {
      console.error('[App] Lỗi khi tải bài viết:', err);
      EventBus.emit(EVENTS.ARTICLES_ERROR, { message: 'Không thể tải nội dung bài viết.' });
    }
  }

  // ── Shared bootstrap ─────────────────────────────────────────────

  function _bootstrapShared() {
    NavigationHandler.init();
    _activeModules.push(NavigationHandler);
  }

  // ── Global error handling ────────────────────────────────────────

  function _bindGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('[App] Uncaught error:', e.error || e.message);
      StateManager.set('app.error', e.message);
      EventBus.emit(EVENTS.APP_ERROR, { message: e.message, source: 'window' });
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('[App] Unhandled promise rejection:', e.reason);
      StateManager.set('app.error', String(e.reason));
      EventBus.emit(EVENTS.APP_ERROR, { message: String(e.reason), source: 'promise' });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    EventBus.emit(EVENTS.APP_INIT);
    _bindGlobalErrorHandling();

    _currentDomain = _detectDomain();

    if (!_currentDomain) {
      console.error('[App] Không xác định được domain hiện tại. Kiểm tra <body data-domain="...">.');
      StateManager.set('app.error', 'Không xác định được domain trang.');
      return;
    }

    StateManager.set('app.currentPage', _currentDomain);

    try {
      _bootstrapShared();

      if (_currentDomain === 'home') {
        _bootstrapHomeDomain();
      } else if (_currentDomain === 'articles') {
        _bootstrapArticlesDomain();
      }

      StateManager.set('app.initialized', true);
      EventBus.emit(EVENTS.APP_READY, { domain: _currentDomain });

      if (Config.APP.DEBUG) {
        console.info(`[App] Khởi tạo thành công — domain: "${_currentDomain}"`);
      }

    } catch (err) {
      console.error('[App] Lỗi khi bootstrap domain:', err);
      StateManager.set('app.error', err.message);
      EventBus.emit(EVENTS.APP_ERROR, { message: err.message, source: 'bootstrap' });
    }
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    _activeModules.forEach(module => {
      try {
        module.destroy?.();
      } catch (err) {
        console.warn('[App] Lỗi khi destroy module:', err);
      }
    });
    _activeModules.length = 0;
    EventBus.clearAll();
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

// ── Entry point ──────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export default App; 
