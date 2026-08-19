/**
 * FileManagerController — orchestrates the File Manager Application (§17).
 *
 * Responsibilities:
 *   - Select the appropriate FileDataProvider by environment (§56, §85).
 *   - Manage UI states: LOADING / EMPTY / ERROR / READY (§76).
 *   - Provide search + category filtering (§17).
 *   - Render toolbar + summary + file list, open detail drawer (§97).
 *   - Full cleanup on unmount (§74).
 *
 * Uses the standard Application Runtime contract — NO special privileges (§89, §90).
 */

import { EmptyFileDataProvider } from './providers/file-data-provider.js';
import { DevelopmentFileProvider } from './providers/development-file-provider.js';
import { createFileSummaryBar } from './components/file-summary-bar.js';
import { createFileToolbar } from './components/file-toolbar.js';
import { createFileList } from './components/file-list.js';
import { openFileDrawer } from './components/file-detail-drawer.js';
import { createLoadingState } from '../../../platform/ui/loading-state.js';
import { createEmptyState } from '../../../platform/ui/empty-state.js';
import { createErrorState } from '../../../platform/ui/error-state.js';
import fileManagerStrings from '../localization/file-manager.en.js';

const STYLE_URL = 'applications/file-manager/styles/file-manager.css';

export class FileManagerController {
  #container;
  #services;
  #provider;
  #isSimulated = false;

  #root = null;
  #stateEl = null;
  #mainEl = null;
  #summaryBar = null;
  #toolbar = null;
  #list = null;
  #openDrawer = null;

  #files = [];
  #filters = { search: '', category: 'all' };
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
      const files = await this.#provider.fetchFiles();
      this.#files = files;

      if (files.length === 0) {
        this.#showEmpty();
      } else {
        this.#showReady();
      }

      this.#unsubscribeProvider = this.#provider.subscribe((updated) => {
        this.#files = updated;
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

    if (this.#summaryBar) this.#summaryBar.destroy();
    if (this.#toolbar) this.#toolbar.destroy();
    if (this.#list) this.#list.destroy();

    this.#summaryBar = null;
    this.#toolbar = null;
    this.#list = null;
    this.#files = [];
    this.#container.innerHTML = '';
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — provider selection (§56, §8, §85)                        */
  /* ------------------------------------------------------------------ */

  #createProvider() {
    const mode = this.#services.config.get('os.mode', 'production');

    if (mode === 'development') {
      this.#isSimulated = true;
      return new DevelopmentFileProvider();
    }

    this.#isSimulated = false;
    return new EmptyFileDataProvider();
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
    if (loc) loc.register('en', fileManagerStrings);
  }

  #buildDOM() {
    const loc = this.#services.localization;

    this.#root = document.createElement('div');
    this.#root.className = 'file-manager';

    // Header
    const header = document.createElement('div');
    header.className = 'file-manager__header';

    const title = document.createElement('h2');
    title.className = 'file-manager__title';
    title.textContent = loc.t('fileManager.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'file-manager__subtitle';
    subtitle.textContent = loc.t('fileManager.subtitle');

    header.append(title, subtitle);

    // State container (loading / empty / error)
    this.#stateEl = document.createElement('div');
    this.#stateEl.className = 'file-manager__state';

    // Main (summary + toolbar + list) — hidden until READY
    this.#mainEl = document.createElement('div');
    this.#mainEl.className = 'file-manager__main';
    this.#mainEl.hidden = true;

    this.#root.append(header, this.#stateEl, this.#mainEl);
    this.#container.appendChild(this.#root);
  }

  #buildMain() {
    const loc = this.#services.localization;

    // Derive categories from real data — never hardcode (§8).
    const categories = this.#deriveCategories();

    this.#summaryBar = createFileSummaryBar({ localization: loc });

    this.#toolbar = createFileToolbar({
      localization: loc,
      categories,
      onFilterChange: (filters) => {
        this.#filters = { ...this.#filters, ...filters };
        this.#renderList();
      },
    });

    this.#list = createFileList({
      localization: loc,
      onSelect: (fileId) => this.#openFile(fileId),
    });

    this.#mainEl.append(
      this.#summaryBar.element,
      this.#toolbar.element,
      this.#list.element,
    );
    this.#renderList();
  }

  #deriveCategories() {
    const set = new Set();
    for (const f of this.#files) {
      if (f.category) set.add(f.category);
    }
    return Array.from(set).sort();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — filtering (§17)                                          */
  /* ------------------------------------------------------------------ */

  #applyFilters() {
    const { search, category } = this.#filters;
    const q = search.trim().toLowerCase();

    return this.#files.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  #renderList() {
    if (!this.#list) return;
    const filtered = this.#applyFilters();

    if (this.#summaryBar) {
      this.#summaryBar.update(this.#files, this.#isSimulated);
    }
    this.#list.update(filtered, this.#files.length);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — state transitions (§76)                                  */
  /* ------------------------------------------------------------------ */

  #showLoading() {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loading = createLoadingState({
      label: this.#services.localization.t('fileManager.loading'),
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
      title: loc.t('fileManager.empty.title'),
      description: loc.t('fileManager.empty.description'),
    });
    this.#stateEl.appendChild(empty.element);
  }

  #showError(err) {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loc = this.#services.localization;
    const errorState = createErrorState({
      title: loc.t('fileManager.error.title'),
      description: err?.message || loc.t('fileManager.error.description'),
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

  #openFile(fileId) {
    const file = this.#files.find((f) => f.id === fileId);
    if (!file) return;

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    this.#openDrawer = openFileDrawer({
      file,
      localization: this.#services.localization,
      onClose: () => {
        this.#openDrawer = null;
      },
    });
  }
} 
