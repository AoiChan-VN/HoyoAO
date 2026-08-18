/**
 * DiagnosticsController — orchestrates the Diagnostics Application.
 *
 * Responsibilities:
 *   - Consume OS DiagnosticsService (§48) — read-only.
 *   - Refresh on runtime events (event-driven, NOT polling §94).
 *   - Render five panels: System, Applications, Services, Events, Errors.
 *   - Ticker for uptime display only (§94 — minimal interval).
 *   - Full cleanup on unmount (§74).
 *
 * This Application does NOT modify OS state. It observes only.
 */

import { createSystemPanel } from './components/system-panel.js';
import { createApplicationsPanel } from './components/applications-panel.js';
import { createServicesPanel } from './components/services-panel.js';
import { createEventsPanel } from './components/events-panel.js';
import { createErrorsPanel } from './components/errors-panel.js';
import diagnosticsStrings from '../localization/diagnostics.en.js';

const STYLE_URL = 'applications/diagnostics/styles/diagnostics.css';

const REFRESH_EVENTS = [
  'application:started',
  'application:stopped',
  'application:error',
  'os:booted',
];

export class DiagnosticsController {
  #container;
  #services;
  #diagnostics;
  #localization;

  #root = null;
  #panels = [];
  #systemPanel = null;

  #unsubscribers = [];
  #uptimeInterval = null;

  constructor(container, services) {
    this.#container = container;
    this.#services = services;
    this.#diagnostics = services.diagnostics;
    this.#localization = services.localization;

    if (!this.#diagnostics) {
      // §92 least privilege: without system.status we cannot observe.
      throw new Error('Diagnostics application requires the "diagnostics" service (permission: system.status)');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC                                                             */
  /* ------------------------------------------------------------------ */

  start() {
    this.#loadStyles();
    this.#registerLocalization();
    this.#buildDOM();
    this.#renderSnapshot(this.#diagnostics.getSnapshot());
    this.#subscribe();
    this.#startUptimeTicker();
  }

  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];

    if (this.#uptimeInterval) {
      clearInterval(this.#uptimeInterval);
      this.#uptimeInterval = null;
    }

    for (const panel of this.#panels) {
      if (panel.destroy) panel.destroy();
    }
    this.#panels = [];
    this.#systemPanel = null;

    this.#container.innerHTML = '';
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — setup                                                    */
  /* ------------------------------------------------------------------ */

  #loadStyles() {
    // Application owns its own styles (§4).
    if (document.querySelector(`link[href="${STYLE_URL}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_URL;
    document.head.appendChild(link);
  }

  #registerLocalization() {
    if (this.#localization) {
      this.#localization.register('en', diagnosticsStrings);
    }
  }

  #buildDOM() {
    const loc = this.#localization;

    this.#root = document.createElement('div');
    this.#root.className = 'diagnostics';

    // Header
    const header = document.createElement('div');
    header.className = 'diagnostics__header';

    const title = document.createElement('h2');
    title.className = 'diagnostics__title';
    title.textContent = loc.t('diagnostics.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'diagnostics__subtitle';
    subtitle.textContent = loc.t('diagnostics.subtitle');

    header.append(title, subtitle);

    // Panels grid
    const grid = document.createElement('div');
    grid.className = 'diagnostics__grid';

    this.#systemPanel = createSystemPanel({ localization: loc });
    const applicationsPanel = createApplicationsPanel({ localization: loc });
    const servicesPanel = createServicesPanel({ localization: loc });
    const eventsPanel = createEventsPanel({ localization: loc });
    const errorsPanel = createErrorsPanel({ localization: loc });

    this.#panels = [
      this.#systemPanel,
      applicationsPanel,
      servicesPanel,
      eventsPanel,
      errorsPanel,
    ];

    for (const panel of this.#panels) {
      grid.appendChild(panel.element);
    }

    this.#root.append(header, grid);
    this.#container.appendChild(this.#root);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — rendering                                                */
  /* ------------------------------------------------------------------ */

  #renderSnapshot(snapshot) {
    for (const panel of this.#panels) {
      panel.update(snapshot);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — subscriptions (§94 event-driven, not polling)            */
  /* ------------------------------------------------------------------ */

  #subscribe() {
    // Live error stream from DiagnosticsService.
    const unsubDiagnostics = this.#diagnostics.subscribe((snapshot) => {
      this.#renderSnapshot(snapshot);
    });
    this.#unsubscribers.push(unsubDiagnostics);

    // Refresh on runtime lifecycle events.
    const events = this.#services.events;
    if (!events) return;

    const refresh = () => {
      this.#renderSnapshot(this.#diagnostics.getSnapshot());
    };

    for (const eventName of REFRESH_EVENTS) {
      events.on(eventName, refresh);
      this.#unsubscribers.push(() => events.off(eventName, refresh));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — uptime ticker (§94 minimal, cleaned up §74)              */
  /* ------------------------------------------------------------------ */

  #startUptimeTicker() {
    this.#uptimeInterval = setInterval(() => {
      if (this.#systemPanel) this.#systemPanel.updateUptime();
    }, 1000);
  }
} 
