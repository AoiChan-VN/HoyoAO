/**
 * OS Kernel — Boot Orchestrator
 *
 * Boot order (§7, §42):
 *   Config → Branding → Core Services → Theme/Localization
 *   → Notification → Runtime (Registry → Diagnostics → Lifecycle → Router)
 *   → Discovery → Shell (+NotificationHost) → Default App → Dev Telemetry
 */

import { ConfigService } from './config.js';
import { EventBus } from './events.js';
import { Logger } from './logger.js';
import { ServiceRegistry } from '../runtime/services.js';
import { ApplicationRegistry } from '../runtime/registry.js';
import { ApplicationLifecycle } from '../runtime/lifecycle.js';
import { Router } from '../runtime/router.js';
import { Shell } from '../shell/shell.js';
import { StorageService } from './services/storage.js';
import { Indexer } from './services/indexer.js';
import { DataService } from './services/data.js';
import { ThemeService } from './services/theme.js';
import { LocalizationService } from './services/localization.js';
import { NotificationService } from './services/notification.js';
import { DiagnosticsService } from './services/diagnostics.js';
import { DevelopmentTelemetryService } from './services/dev-telemetry.js';

export class Kernel {
  /** @type {'UNINITIALIZED'|'BOOTING'|'RUNNING'|'FAILED'} */
  #bootState = 'UNINITIALIZED';

  #config;
  #eventBus;
  #logger;
  #services;
  #registry;
  #lifecycle;
  #router;
  #shell;
  #brand;

  constructor() {
    this.#eventBus = new EventBus();
    this.#logger = new Logger(this.#eventBus);
    this.#config = new ConfigService(this.#logger);
    this.#services = new ServiceRegistry(this.#logger);
  }

  async boot() {
    try {
      this.#bootState = 'BOOTING';
      this.#logger.info('boot', 'WEB ADMIN OS — boot sequence initiated');

      /* Phase 1 — Configuration */
      await this.#config.load('os.config.json');
      this.#logger.setLevel(this.#config.get('os.logLevel', 'info'));
      this.#logger.info('boot', 'Configuration loaded');

      /* Phase 2 — Branding */
      await this.#loadBranding();

      /* Phase 3 — Core Data & Storage Services */
      this.#initCoreServices();

      /* Phase 4 — Theme & Localization */
      await this.#initThemeAndLocalization();

      /* Phase 5 — Notification Service */
      this.#initNotificationService();

      /* Phase 6 — Runtime: Registry → Diagnostics → Lifecycle → Router */
      this.#registry = new ApplicationRegistry(this.#logger);
      this.#initDiagnosticsService();

      this.#lifecycle = new ApplicationLifecycle(
        this.#registry,
        this.#logger,
        this.#eventBus,
        this.#services,
      );
      this.#router = new Router(this.#logger, this.#eventBus);
      this.#logger.info('boot', 'Runtime initialised');

      /* Phase 7 — Application discovery */
      await this.#discoverApplications();

      /* Phase 8 — Mount Shell (with NotificationHost) */
      const root = document.getElementById('os-root');
      if (!root) throw new Error('Fatal: #os-root element not found');

      this.#shell = new Shell({
        container: root,
        config: this.#config,
        registry: this.#registry,
        eventBus: this.#eventBus,
        logger: this.#logger,
        brand: this.#brand,
        theme: this.#services.get('theme'),
        localization: this.#services.get('localization'),
        notifications: this.#services.get('notifications'),
      });
      await this.#shell.mount();
      this.#logger.info('boot', 'Shell mounted');

      /* Phase 9 — Start default Application */
      await this.#startDefaultApplication();

      /* Phase 10 — Development telemetry (SIMULATED, dev-mode only) */
      this.#startDevTelemetryIfEnabled();

      /* Phase 11 — Done */
      this.#bootState = 'RUNNING';
      this.#logger.info('boot', 'WEB ADMIN OS — boot sequence completed');
      this.#eventBus.emit('os:booted', { timestamp: Date.now() });

    } catch (error) {
      this.#bootState = 'FAILED';
      this.#logger.fatal('boot', 'OS boot failed', {
        error: error.message,
        stack: error.stack,
      });
      this.#renderFatalError(error);
    }
  }

  getBootState() {
    return this.#bootState;
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Core Services                                            */
  /* ------------------------------------------------------------------ */

  #initCoreServices() {
    const storage = new StorageService(this.#logger);
    const indexer = new Indexer(storage, this.#eventBus, this.#logger);
    const data = new DataService(indexer, this.#eventBus, this.#logger);

    this.#services.register('storage', storage);
    this.#services.register('indexer', indexer);
    this.#services.register('data', data);
    this.#services.register('events', this.#eventBus);
    this.#services.register('config', this.#config);
    this.#services.register('logger', this.#logger);

    this.#logger.info('boot', 'Core data & storage services initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Theme & Localization                                     */
  /* ------------------------------------------------------------------ */

  async #initThemeAndLocalization() {
    const theme = new ThemeService(this.#config, this.#eventBus, this.#logger);
    await theme.init();
    this.#services.register('theme', theme);

    const localization = new LocalizationService(this.#config, this.#eventBus, this.#logger);
    await localization.init();
    this.#services.register('localization', localization);

    this.#logger.info('boot', 'Theme & Localization services initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Notification Service                                     */
  /* ------------------------------------------------------------------ */

  #initNotificationService() {
    const notifications = new NotificationService(this.#eventBus, this.#logger);
    this.#services.register('notifications', notifications);
    this.#logger.info('boot', 'Notification service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Diagnostics Service (§48)                                */
  /* ------------------------------------------------------------------ */

  #initDiagnosticsService() {
    const diagnostics = new DiagnosticsService({
      registry: this.#registry,
      services: this.#services,
      eventBus: this.#eventBus,
      logger: this.#logger,
      storage: this.#services.get('storage'),
      config: this.#config,
    });
    this.#services.register('diagnostics', diagnostics);
    this.#logger.info('boot', 'Diagnostics service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Development Telemetry (§45)                              */
  /* ------------------------------------------------------------------ */

  #startDevTelemetryIfEnabled() {
    const mode = this.#config.get('os.mode', 'production');
    if (mode !== 'development') {
      this.#logger.info('boot', 'Development telemetry skipped (not development mode)');
      return;
    }

    const telemetry = new DevelopmentTelemetryService(
      this.#services.get('data'),
      this.#logger,
      { intervalMs: this.#config.get('devTelemetry.intervalMs', 2000) },
    );
    telemetry.start();
    this.#services.register('devTelemetry', telemetry);
    this.#logger.warn('boot', 'Development telemetry ACTIVE — data is SIMULATED (§45)');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Branding                                                 */
  /* ------------------------------------------------------------------ */

  async #loadBranding() {
    try {
      const res = await fetch('platform/brand.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#brand = await res.json();
      this.#logger.info('boot', 'Branding loaded');
    } catch (err) {
      this.#logger.warn('boot', 'Branding unavailable — using defaults', {
        error: err.message,
      });
      this.#brand = {
        name: 'WEB ADMIN OS',
        owner: 'HoyoAO',
        copyright: '© 2026 HoyoAO. All Rights Reserved',
        logo: { src: '', alt: 'WEB ADMIN OS' },
        links: { support: '#', community: '#', status: '#' },
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Application discovery                                    */
  /* ------------------------------------------------------------------ */

  async #discoverApplications() {
    const paths = this.#config.get('applications.manifests', []);
    let count = 0;

    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (!res.ok) {
          this.#logger.warn('boot', `Manifest not found: ${path}`);
          continue;
        }
        const manifest = await res.json();
        this.#registry.register(manifest);
        count++;
      } catch (err) {
        this.#logger.warn('boot', `Manifest load error: ${path}`, {
          error: err.message,
        });
      }
    }

    this.#logger.info('boot', `Discovery complete — ${count} app(s) registered`);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Start default Application                                */
  /* ------------------------------------------------------------------ */

  async #startDefaultApplication() {
    const appId = this.#config.get('boot.defaultApplication', '');
    if (!appId || !this.#registry.has(appId)) {
      this.#logger.info('boot', 'No default application to start');
      return;
    }

    try {
      await this.#lifecycle.start(appId, this.#shell.getContentArea());
      this.#logger.info('boot', `Default application "${appId}" started`);
    } catch (err) {
      this.#logger.warn('boot', `Default app "${appId}" failed to start`, {
        error: err.message,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Fatal error rendering                                    */
  /* ------------------------------------------------------------------ */

  #renderFatalError(error) {
    const root = document.getElementById('os-root');
    if (!root) return;

    root.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'os-fatal-error';

    const h = document.createElement('h1');
    h.textContent = 'OS Boot Failure';

    const msg = document.createElement('p');
    msg.textContent = error.message;

    const pre = document.createElement('pre');
    pre.textContent = error.stack || '';

    box.append(h, msg, pre);
    root.appendChild(box);
  }
}

/* -------------------------------------------------------------------- */
/*  AUTO-BOOT                                                            */
/* -------------------------------------------------------------------- */

const kernel = new Kernel();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => kernel.boot());
} else {
  kernel.boot();
}
