/**
 * DashboardController — orchestrates the Dashboard Application.
 *
 * Registers Dashboard-specific settings with the OS Settings framework (§49)
 * and wires one setting (show data-source badge) to actual behavior.
 */

import { DataStreamStore } from './data-stream-store.js';
import { createMainVisualization } from './components/main-visualization.js';
import { createStatsPanel } from './components/stats-panel.js';
import { createCategoryCard } from './components/category-card.js';
import { openCategoryDrawer } from './components/detail-drawer.js';
import { createEmptyState } from '../../../platform/ui/empty-state.js';
import { createLoadingState } from '../../../platform/ui/loading-state.js';
import { createBadge } from '../../../platform/ui/badge.js';
import dashboardStrings from '../localization/dashboard.en.js';

const STYLE_URL = 'applications/dashboard/styles/dashboard.css';
const EMPTY_TIMEOUT_MS = 3000;

export class DashboardController {
  #container;
  #services;
  #store;

  #root = null;
  #sourceBadgeEl = null;
  #stateEl = null;
  #mainEl = null;
  #categoriesSection = null;
  #categoriesEl = null;

  #viz = null;
  #stats = null;
  #categoryCards = new Map();
  #openDrawer = null;

  #abortController;
  #unsubscribers = [];
  #currentState = 'loading';
  #emptyTimeout = null;

  constructor(container, services) {
    this.#container = container;
    this.#services = services;
    this.#store = new DataStreamStore({ maxPackets: 500 });
    this.#abortController = new AbortController();
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC                                                             */
  /* ------------------------------------------------------------------ */

  start() {
    this.#loadStyles();
    this.#registerLocalization();
    this.#registerSettings();
    this.#buildDOM();
    this.#subscribeToData();
    this.#subscribeToSettings();
    this.#showLoading();

    this.#emptyTimeout = setTimeout(() => {
      if (this.#store.getTotal() === 0) {
        this.#showEmpty();
      }
    }, EMPTY_TIMEOUT_MS);
  }

  destroy() {
    if (this.#emptyTimeout) {
      clearTimeout(this.#emptyTimeout);
      this.#emptyTimeout = null;
    }

    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];

    this.#abortController.abort();

    if (this.#viz) {
      this.#viz.destroy();
      this.#viz = null;
    }
    if (this.#stats) {
      this.#stats.destroy();
      this.#stats = null;
    }
    for (const card of this.#categoryCards.values()) card.destroy();
    this.#categoryCards.clear();

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    this.#store.clear();
    this.#container.innerHTML = '';
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
    if (loc) loc.register('en', dashboardStrings);
  }

  /** Register Dashboard settings with the OS framework (§49). */
  #registerSettings() {
    const settings = this.#services.settings;
    if (!settings) return;

    settings.registerSection({
      id: 'dashboard',
      titleKey: 'settings.dashboard.title',
      scope: 'dashboard',
      order: 10,
    });

    settings.register({
      key: 'dashboard.showSourceBadge',
      section: 'dashboard',
      type: 'toggle',
      labelKey: 'settings.dashboard.showSourceBadge',
      defaultValue: true,
    });
  }

  #subscribeToSettings() {
    const settings = this.#services.settings;
    if (!settings) return;

    const unsub = settings.subscribe((key) => {
      if (key === 'dashboard.showSourceBadge') {
        this.#updateSourceBadge();
      }
    });
    this.#unsubscribers.push(unsub);
  }

  #buildDOM() {
    const loc = this.#services.localization;

    this.#root = document.createElement('div');
    this.#root.className = 'dashboard';

    const contextBar = document.createElement('div');
    contextBar.className = 'dashboard__context-bar';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'dashboard__title';
    title.textContent = loc.t('dashboard.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'dashboard__subtitle';
    subtitle.textContent = loc.t('dashboard.subtitle');
    titleWrap.append(title, subtitle);

    this.#sourceBadgeEl = document.createElement('div');
    this.#sourceBadgeEl.className = 'dashboard__source-badge';

    contextBar.append(titleWrap, this.#sourceBadgeEl);

    this.#stateEl = document.createElement('div');
    this.#stateEl.className = 'dashboard__state';

    this.#mainEl = document.createElement('div');
    this.#mainEl.className = 'dashboard__main';
    this.#mainEl.hidden = true;

    this.#categoriesSection = document.createElement('section');
    this.#categoriesSection.className = 'dashboard__categories-section';
    this.#categoriesSection.hidden = true;

    const categoriesTitle = document.createElement('h3');
    categoriesTitle.className = 'dashboard__categories-title';
    categoriesTitle.textContent = loc.t('dashboard.categories.title');
    this.#categoriesEl = document.createElement('div');
    this.#categoriesEl.className = 'dashboard__categories';
    this.#categoriesSection.append(categoriesTitle, this.#categoriesEl);

    this.#root.append(
      contextBar,
      this.#stateEl,
      this.#mainEl,
      this.#categoriesSection,
    );
    this.#container.appendChild(this.#root);
  }

  #buildMain() {
    const reducedMotion = this.#services.theme
      ? this.#services.theme.prefersReducedMotion()
      : false;

    this.#viz = createMainVisualization({
      store: this.#store,
      reducedMotion,
    });
    this.#stats = createStatsPanel({
      store: this.#store,
      localization: this.#services.localization,
    });

    const vizWrap = document.createElement('div');
    vizWrap.className = 'dashboard__viz-wrap';
    vizWrap.appendChild(this.#viz.element);

    this.#mainEl.append(vizWrap, this.#stats.element);

    this.#viz.start();
    this.#stats.start();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — data subscription                                        */
  /* ------------------------------------------------------------------ */

  #subscribeToData() {
    const events = this.#services.events;
    if (!events) return;

    const handler = (event) => this.#onDataIndexed(event);
    events.on('data:indexed', handler);
    this.#unsubscribers.push(() => events.off('data:indexed', handler));
  }

  #onDataIndexed(event) {
    this.#store.add({ id: event.id, metadata: event.metadata });

    if (this.#emptyTimeout) {
      clearTimeout(this.#emptyTimeout);
      this.#emptyTimeout = null;
    }

    if (this.#currentState !== 'ready') {
      this.#showReady();
    }

    this.#updateCategories();
    this.#updateSourceBadge();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — state transitions (§76)                                  */
  /* ------------------------------------------------------------------ */

  #showLoading() {
    this.#currentState = 'loading';
    this.#mainEl.hidden = true;
    this.#categoriesSection.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loading = createLoadingState({
      label: this.#services.localization.t('dashboard.loading'),
      variant: 'spinner',
    });
    this.#stateEl.appendChild(loading.element);
  }

  #showEmpty() {
    this.#currentState = 'empty';
    this.#mainEl.hidden = true;
    this.#categoriesSection.hidden = true;
    this.#stateEl.hidden = false;
    this.#stateEl.innerHTML = '';

    const loc = this.#services.localization;
    const empty = createEmptyState({
      title: loc.t('dashboard.empty.title'),
      description: loc.t('dashboard.empty.description'),
    });
    this.#stateEl.appendChild(empty.element);
  }

  #showReady() {
    this.#currentState = 'ready';
    this.#stateEl.hidden = true;
    this.#mainEl.hidden = false;
    this.#categoriesSection.hidden = false;

    if (!this.#viz) {
      this.#buildMain();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — categories & drawer (§16)                                */
  /* ------------------------------------------------------------------ */

  #updateCategories() {
    const groups = this.#store.getByCategory();

    for (const [domain, card] of this.#categoryCards) {
      if (!groups[domain]) {
        card.destroy();
        card.element.remove();
        this.#categoryCards.delete(domain);
      }
    }

    for (const [domain, packets] of Object.entries(groups)) {
      const lastActivity = Math.max(
        ...packets.map((p) => p.metadata.timestamp),
      );

      if (this.#categoryCards.has(domain)) {
        this.#categoryCards.get(domain).update(packets.length, lastActivity);
      } else {
        const card = createCategoryCard({
          domain,
          count: packets.length,
          lastActivity,
          onClick: (d) => this.#openCategory(d),
        });
        this.#categoryCards.set(domain, card);
        this.#categoriesEl.appendChild(card.element);
      }
    }
  }

  #openCategory(domain) {
    const summaries = this.#store.getByCategory()[domain] || [];
    const indexer = this.#services.indexer;

    const fullPackets = summaries
      .map((s) => (indexer ? indexer.getPacket(s.id) : null))
      .filter(Boolean);

    if (this.#openDrawer) {
      this.#openDrawer.destroy();
      this.#openDrawer = null;
    }

    this.#openDrawer = openCategoryDrawer({
      domain,
      packets: fullPackets,
      localization: this.#services.localization,
      onClose: () => {
        this.#openDrawer = null;
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — source badge (§45) — controlled by a Dashboard setting   */
  /* ------------------------------------------------------------------ */

  #updateSourceBadge() {
    const settings = this.#services.settings;
    const show = settings
      ? Boolean(settings.get('dashboard.showSourceBadge'))
      : true;

    this.#sourceBadgeEl.innerHTML = '';
    if (!show) return;

    const loc = this.#services.localization;
    const isSimulated = this.#store.hasSimulatedData();
    const badge = createBadge({
      label: isSimulated
        ? loc.t('dashboard.source.simulated')
        : loc.t('dashboard.source.real'),
      variant: isSimulated ? 'warning' : 'success',
    });
    this.#sourceBadgeEl.appendChild(badge.element);
  }
}
