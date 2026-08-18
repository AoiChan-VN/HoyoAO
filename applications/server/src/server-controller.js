/**
 * ServerController — orchestrates the Server Application.
 *
 * Responsibilities:
 *   - Select the appropriate ServerDataProvider by environment (§56).
 *   - Manage UI states: LOADING / EMPTY / ERROR / READY (§76).
 *   - Render SummaryBar, ServerList, and open DetailDrawer (§16, §97).
 *   - React to provider updates via subscription (event-driven §94).
 *   - Full cleanup on unmount (§74).
 *
 * Uses the standard Application Runtime contract — NO special privileges (§89, §90).
 */

import { EmptyServerProvider } from './providers/server-data-provider.js';
import { DevelopmentServerProvider } from './providers/development-server-provider.js';
import { createServerSummaryBar } from './components/server-summary-bar.js';
import { createServerList } from './components/server-list.js';
import { openServerDrawer } from './components/server-detail-drawer.js';
import { createLoadingState } from '../../../platform/ui/loading-state.js';
import { createEmptyState } from '../../../platform/ui/empty-state.js';
import { createErrorState } from '../../../platform/ui/error-state.js';
import serverStrings from '../localization/server.en.js';

const STYLE_URL = 'applications/server/styles/server.css';

export class ServerController {
  #container;
  #services;
  #provider;
  #isSimulated = false;

  #root = null;
  #stateEl = null;
  #mainEl = null;
  #summaryBar = null;
  #serverList = null;
  #openDrawer = null;

  #servers = [];
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
      const servers = await this.#provider.fetchServers();
      this.#servers = servers;

      if (servers.length === 0) {
        this.#showEmpty();
      } else {
        this.#showReady();
      }

      // Live updates from the provider (event-driven §94).
      this.#unsubscribeProvider = this.#provider.subscribe((updated) => {
        this.#servers = updated;
        if (this.#mainEl && !this.#mainEl.hidden) {
          this.#renderServers();
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
    if (this.#serverList) this.#serverList.destroy();

    this.#summaryBar = null;
    this.#serverList = null;
    this.#servers = [];
    this.#container.innerHTML = '';
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — provider selection (§56, §8)                             */
  /* ------------------------------------------------------------------ */

  #createProvider() {
    const mode = this.#services.config.get('os.mode', 'production');

    if (mode === 'development') {
      this.#isSimulated = true;
      return new DevelopmentServerProvider({ intervalMs: 4000 });
    }

    // No real backend configured yet — honest empty source (§98, §45).
    this.#isSimulated = false;
    return new EmptyServerProvider();
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
    if (loc) loc.register('en', serverStrings);
  }

  #buildDOM() {
    const loc = this.#services.localization;

    this.#root = document.createElement('div');
    this.#root.className = 'server';

    // Header
    const header = document.createElement('div');
    header.className = 'server__header';

    const title = document.createElement('h2');
    title.className = 'server__title';
    title.textContent = loc.t('server.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'server__subtitle';
    subtitle.textContent = loc.t('server.subtitle');

    header.append(title, subtitle);

    // State container (loading / empty / error)
    this.#stateEl = document.createElement('div');
    this.#stateEl.className = 'server__state';

    // Main (summary + list) — hidden until READY
    this.#mainEl = document.createElement('div');
    this.#mainEl.className = 'server__main';
    this.#mainEl.hidden = true;

    this.#root.append(header, this.#stateEl, this.#mainEl);
    this.#container.appendChild(this.#root);
  }

  #buildMain() {
    const loc = this.#services.localization;

    this.#summaryBar = createServerSummaryBar({ localization: loc });
    this.#serverList = createServerList({
      localization: loc,
      icons: this.#services.icons,
      onSelect: (serverId) => this.#openServer(serverId),
    });

    this.#mainEl.append(this.#summaryBar.element, this.#serverList.element);
    this.#renderServers();
  }

  #renderServers() {
    if (this.#summaryBar) {
      this.#summaryBar.update(this.#servers, this.#isSimulated);
    }
    if (this.#serverList) {
      this.#serverList.update(this.#servers);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — state transitions (§76)                                  */
  /* ------------------------------------------------------------------ */

  #showLoading() {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loading = createLoadingState({
      label: this.#services.localization.t('server.loading'),
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
      title: loc.t('server.empty.title'),
      description: loc.t('server.empty.description'),
    });
    this.#stateEl.appendChild(empty.element);
  }

  #showError(err) {
    this.#mainEl.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loc = this.#services.localization;
    const errorState = createErrorState({
      title: loc.t('server.error.title'),
      description: err?.message || loc.t('server.error.description'),
    });
    this.#stateEl.appendChild(errorState.element);
  }

  #showReady() {
    this.#stateEl.hidden = true;
    this.#mainEl.hidden = false;

    if (!this.#summaryBar) {
      this.#buildMain();
    } else {
      this.#renderServers();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — detail inspection (§16, §97)                             */
  /* ------------------------------------------------------------------ */

  #openServer(serverId) {
    const server = this.#servers.find((s) => s.id === serverId);
    if (!server) return;

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    this.#openDrawer = openServerDrawer({
      server,
      localization: this.#services.localization,
      onClose: () => {
        this.#openDrawer = null;
      },
    });
  }
} 
