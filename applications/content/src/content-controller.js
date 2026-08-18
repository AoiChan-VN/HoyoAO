/**
 * ContentController — orchestrates the Content Application (§17).
 *
 * Responsibilities:
 *   - Select the appropriate ContentDataProvider by environment (§56).
 *   - Manage UI states: LOADING / EMPTY / ERROR / READY (§76).
 *   - Provide search + category + type filtering (§17).
 *   - Render toolbar + content grid, open detail drawer (§97).
 *   - Full cleanup on unmount (§74).
 *
 * Uses the standard Application Runtime contract — NO special privileges (§89, §90).
 */

import { EmptyContentDataProvider } from './providers/content-data-provider.js';
import { DevelopmentContentProvider } from './providers/development-content-provider.js';
import { createContentToolbar } from './components/content-toolbar.js';
import { createContentList } from './components/content-list.js';
import { openContentDrawer } from './components/content-detail-drawer.js';
import { createLoadingState } from '../../../platform/ui/loading-state.js';
import { createEmptyState } from '../../../platform/ui/empty-state.js';
import { createErrorState } from '../../../platform/ui/error-state.js';
import { createBadge } from '../../../platform/ui/badge.js';
import contentStrings from '../localization/content.en.js';

const STYLE_URL = 'applications/content/styles/content.css';

export class ContentController {
  #container;
  #services;
  #provider;
  #isSimulated = false;

  #root = null;
  #stateEl = null;
  #mainEl = null;
  #sourceBadgeEl = null;
  #toolbar = null;
  #list = null;
  #openDrawer = null;

  #items = [];
  #filters = { search: '', category: 'all', type: 'all' };
  #unsubscribeProvider = null;

  constructor(container, services) {
    this.#container = container;
    this.#services = services;
    this.#provider = this.#createProvider();
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC                                                             */
  /* ------------------------------------------------------------------ */

  async start() {
    this.#loadStyles();
    this.#registerLocalization();
    this.#buildDOM();
    this.#showLoading();

    try {
      const items = await this.#provider.fetchItems();
      this.#items = items;

      if (items.length === 0) {
        this.#showEmpty();
      } else {
        this.#showReady();
      }

      this.#unsubscribeProvider = this.#provider.subscribe((updated) => {
        this.#items = updated;
        if (this.#mainEl && !this.#mainEl.hidden) {
          this.#renderList();
        }
      });
    } catch (err) {
      this.#showError(err);
    }
  }

  destroy() {
    if (this.#unsubscribeProvider) {
      this.#unsubscribeProvider();
      this.#unsubscribeProvider = null;
    }

    if (this.#provider && typeof this.#provider.destroy === 'function') {
      this.#provider.destroy();
    }

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    if (this.#toolbar) this.#toolbar.destroy();
    if (this.#list) this.#list.destroy();

    this.#toolbar = null;
    this.#list = null;
    this.#items = [];
    this.#container.innerHTML = '';
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — provider selection (§56, §8)                             */
  /* ------------------------------------------------------------------ */

  #createProvider() {
    const mode = this.#services.config.get('os.mode', 'production');

    if (mode === 'development') {
      this.#isSimulated = true;
      return new DevelopmentContentProvider();
    }

    this.#isSimulated = false;
    return new EmptyContentDataProvider();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — setup                                                    */
  /* ------------------------------------------------------------------ */

  #loadStyles() {
    if (document.querySelector(`link[href="${STYLE_URL}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_URL;
    document.head.appendChild(link);
  }

  #registerLocalization() {
    const loc = this.#services.localization;
    if (loc) loc.register('en', contentStrings);
  }

  #buildDOM() {
    const loc = this.#services.localization;

    this.#root = document.createElement('div');
    this.#root.className = 'content-app';

    // Header
    const header = document.createElement('div');
    header.className = 'content-app__header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'content-app__title';
    title.textContent = loc.t('content.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'content-app__subtitle';
    subtitle.textContent = loc.t('content.subtitle');
    titleWrap.append(title, subtitle);

    this.#sourceBadgeEl = document.createElement('div');
    this.#sourceBadgeEl.className = 'content-app__source-badge';
    this.#renderSourceBadge();

    header.append(titleWrap, this.#sourceBadgeEl);

    // State container (loading / empty / error)
    this.#stateEl = document.createElement('div');
    this.#stateEl.className = 'content-app__state';

    // Main (toolbar + list) — hidden until READY
    this.#mainEl = document.createElement('div');
    this.#mainEl.className = 'content-app__main';
    this.#mainEl.hidden = true;

    this.#root.append(header, this.#stateEl, this.#mainEl);
    this.#container.appendChild(this.#root);
  }

  #renderSourceBadge() {
    const loc = this.#services.localization;
    this.#sourceBadgeEl.innerHTML = '';
    const badge = createBadge({
      label: this.#isSimulated
        ? loc.t('content.source.simulated')
        : loc.t('content.source.real'),
      variant: this.#isSimulated ? 'warning' : 'success',
    });
    this.#sourceBadgeEl.appendChild(badge.element);
  }

  #buildMain() {
    const loc = this.#services.localization;

    // Derive categories from real data — never hardcode (§8).
    const categories = this.#deriveCategories();

    this.#toolbar = createContentToolbar({
      localization: loc,
      categories,
      onFilterChange: (filters) => {
        this.#filters = { ...this.#filters, ...filters };
        this.#renderList();
      },
    });

    this.#list = createContentList({
      localization: loc,
      onSelect: (itemId) => this.#openItem(itemId),
    });

    this.#mainEl.append(this.#toolbar.element, this.#list.element);
    this.#renderList();
  }

  #deriveCategories() {
    const set = new Set();
    for (const it of this.#items) {
      if (it.category) set.add(it.category);
    }
    return Array.from(set).sort();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — filtering (§17)                                          */
  /* ------------------------------------------------------------------ */

  #applyFilters() {
    const { search, category, type } = this.#filters;
    const q = search.trim().toLowerCase();

    return this.#items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (type !== 'all' && it.type !== type) return false;

      if (q) {
        const haystack = [
          it.title,
          it.excerpt,
          it.author,
          ...(it.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }

  #renderList() {
    if (!this.#list) return;
    const filtered = this.#applyFilters();
    this.#list.update(filtered, this.#items.length);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — state transitions (§76)                                  */
  /* ------------------------------------------------------------------ */

  #showLoading() {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loading = createLoadingState({
      label: this.#services.localization.t('content.loading'),
      variant: 'spinner',
    });
    this.#stateEl.appendChild(loading.element);
  }

  #showEmpty() {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loc = this.#services.localization;
    const empty = createEmptyState({
      title: loc.t('content.empty.title'),
      description: loc.t('content.empty.description'),
    });
    this.#stateEl.appendChild(empty.element);
  }

  #showError(err) {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loc = this.#services.localization;
    const errorState = createErrorState({
      title: loc.t('content.error.title'),
      description: err?.message || loc.t('content.error.description'),
    });
    this.#stateEl.appendChild(errorState.element);
  }

  #showReady() {
    this.#stateEl.hidden = true;
    this.#mainEl.hidden = false;

    if (!this.#toolbar) {
      this.#buildMain();
    } else {
      this.#renderList();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — detail inspection (§16, §97)                             */
  /* ------------------------------------------------------------------ */

  #openItem(itemId) {
    const item = this.#items.find((it) => it.id === itemId);
    if (!item) return;

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    this.#openDrawer = openContentDrawer({
      item,
      localization: this.#services.localization,
      onClose: () => {
        this.#openDrawer = null;
      },
    });
  }
} 
