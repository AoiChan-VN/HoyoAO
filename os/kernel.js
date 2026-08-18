/**
 * OS Kernel — Boot Orchestrator
 *
 * Boot order (§7, §42):
 *   Config → Branding → Core Services → Theme/Localization
 *   → Notification → Icons → Assets → Settings
 *   → Runtime (Registry → Diagnostics → Lifecycle → Router)
 *   → Discovery → Shell → Default App → Dev Telemetry
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
import { IconRegistry } from './services/icon-registry.js';
import { AssetRegistry } from './services/asset-registry.js';
import { SettingsService } from './services/settings.js';
import { DevelopmentTelemetryService } from './services/dev-telemetry.js';
import { DEFAULT_ICONS } from '../platform/icons/default-icons.js';
import { OS_SETTINGS_SECTIONS, createOSSettingsDefaults } from './settings/os-settings.js';

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

      /* Phase 6 — Icon & Asset Registries */
      this.#initIconRegistry();
      await this.#initAssetRegistry();

      /* Phase 7 — Settings Framework (§49) */
      await this.#initSettings();

      /* Phase 8 — Runtime */
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

      /* Phase 9 — Application discovery */
      await this.#discoverApplications();

      /* Phase 10 — Mount Shell */
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
        icons: this.#services.get('icons'),
        assets: this.#services.get('assets'),
        settings: this.#services.get('settings'),
        lifecycle: this.#lifecycle,
      });
      await this.#shell.mount();
      this.#logger.info('boot', 'Shell mounted');

      /* Phase 11 — Start default Application */
      await this.#startDefaultApplication();

      /* Phase 12 — Development telemetry (SIMULATED, dev-mode only) */
      this.#startDevTelemetryIfEnabled();

      /* Phase 13 — Done */
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
  /*  PRIVATE — Notification                                             */
  /* ------------------------------------------------------------------ */

  #initNotificationService() {
    const notifications = new NotificationService(this.#eventBus, this.#logger);
    this.#services.register('notifications', notifications);
    this.#logger.info('boot', 'Notification service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Icon Registry                                            */
  /* ------------------------------------------------------------------ */

  #initIconRegistry() {
    const icons = new IconRegistry(this.#logger);
    icons.registerMany(DEFAULT_ICONS);
    this.#services.register('icons', icons);
    this.#logger.info('boot', 'Icon registry initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Asset Registry                                           */
  /* ------------------------------------------------------------------ */

  async #initAssetRegistry() {
    const assets = new AssetRegistry(this.#logger);

    try {
      const res = await fetch('platform/assets/asset-manifest.json');
      if (res.ok) {
        const manifest = await res.json();
        assets.registerMany(manifest);
      } else {
        this.#logger.warn('boot', `Asset manifest not found (HTTP ${res.status})`);
      }
    } catch (err) {
      this.#logger.warn('boot', 'Failed to load asset manifest', {
        error: err.message,
      });
    }

    this.#services.register('assets', assets);
    this.#logger.info('boot', 'Asset registry initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Settings Framework (§49)                                 */
  /* ------------------------------------------------------------------ */

  async #initSettings() {
    const settings = new SettingsService(
      this.#services.get('storage'),
      this.#eventBus,
      this.#logger,
    );

    // Effects context available to apply() callbacks.
    settings.setApplyContext({
      theme: this.#services.get('theme'),
      localization: this.#services.get('localization'),
      notifications: this.#services.get('notifications'),
    });

    // Register OS settings (§49).
    for (const section of OS_SETTINGS_SECTIONS) {
      settings.registerSection(section);
    }
    settings.registerMany(createOSSettingsDefaults(this.#config));

    // Ensure selectable themes are loaded before applying persisted choice.
    const theme = this.#services.get('theme');
    await theme.loadTheme('dark');
    await theme.loadTheme('light');

    // Load user preferences and apply them (overrides config defaults).
    await settings.loadPersisted();
    await settings.applyAll();

    this.#services.register('settings', settings);
    this.#logger.info('boot', 'Settings framework initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Diagnostics (§48)                                        */
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
        logoAsset: 'brand.logo',
        faviconAsset: 'brand.favicon',
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
