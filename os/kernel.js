/**
 * OS Kernel — Boot Orchestrator
 *
 * Boot order (§7, §42):
 *   Config → Branding → Core Services → Theme/Localization
 *   → Notification → Network → Icons → Assets → Settings
 *   → Runtime (Registry → Diagnostics → Lifecycle)
 *   → RouteRegistry + OS routes → NavigationService
 *   → Discovery (+ register app routes)
 *   → Shell → Initial navigation → Dev Telemetry
 */

import { ConfigService } from './config.js';
import { EventBus } from './events.js';
import { Logger } from './logger.js';
import { ServiceRegistry } from '../runtime/services.js';
import { ApplicationRegistry } from '../runtime/registry.js';
import { ApplicationLifecycle } from '../runtime/lifecycle.js';
import { RouteRegistry } from '../runtime/route-registry.js';
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
import { NavigationService } from './services/navigation.js';
import { NetworkService } from './services/network.js';
import { DevelopmentTelemetryService } from './services/dev-telemetry.js';
import { DEFAULT_ICONS } from '../platform/icons/default-icons.js';
import { OS_SETTINGS_SECTIONS, createOSSettingsDefaults } from './settings/os-settings.js';
import { OS_ROUTES } from './routes/os-routes.js';

export class Kernel {
  /** @type {'UNINITIALIZED'|'BOOTING'|'RUNNING'|'FAILED'} */
  #bootState = 'UNINITIALIZED';

  #config;
  #eventBus;
  #logger;
  #services;
  #registry;
  #routeRegistry;
  #lifecycle;
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

      /* Phase 6 — Network Service (§24) */
      this.#initNetworkService();

      /* Phase 7 — Icon & Asset Registries */
      this.#initIconRegistry();
      await this.#initAssetRegistry();

      /* Phase 8 — Settings Framework (§49) */
      await this.#initSettings();

      /* Phase 9 — Runtime: App Registry, Diagnostics, Lifecycle */
      this.#registry = new ApplicationRegistry(this.#logger);
      this.#initDiagnosticsService();
      this.#lifecycle = new ApplicationLifecycle(
        this.#registry,
        this.#logger,
        this.#eventBus,
        this.#services,
      );
      this.#logger.info('boot', 'Runtime initialised');

      /* Phase 10 — Routing (§30) */
      this.#initRouting();

      /* Phase 11 — Application discovery + register app routes */
      await this.#discoverApplications();
      this.#registerApplicationRoutes();

      /* Phase 12 — Mount Shell */
      const root = document.getElementById('os-root');
      if (!root) throw new Error('Fatal: #os-root element not found');

      this.#shell = new Shell({
        container: root,
        config: this.#config,
        registry: this.#registry,
        routeRegistry: this.#routeRegistry,
        eventBus: this.#eventBus,
        logger: this.#logger,
        brand: this.#brand,
        theme: this.#services.get('theme'),
        localization: this.#services.get('localization'),
        notifications: this.#services.get('notifications'),
        icons: this.#services.get('icons'),
        assets: this.#services.get('assets'),
        settings: this.#services.get('settings'),
        navigation: this.#services.get('navigation'),
        network: this.#services.get('network'),
        lifecycle: this.#lifecycle,
      });
      await this.#shell.mount();
      this.#logger.info('boot', 'Shell mounted');

      /* Phase 13 — Initial navigation (deep-link or default app) */
      this.#navigateInitial();

      /* Phase 14 — Development telemetry (SIMULATED, dev-mode only) */
      this.#startDevTelemetryIfEnabled();

      /* Phase 15 — Done */
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
  /*  PRIVATE — Network Service (§24)                                    */
  /* ------------------------------------------------------------------ */

  #initNetworkService() {
    const network = new NetworkService(this.#eventBus, this.#logger);
    network.init();
    this.#services.register('network', network);
    this.#logger.info('boot', 'Network service initialised');
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

    settings.setApplyContext({
      theme: this.#services.get('theme'),
      localization: this.#services.get('localization'),
      notifications: this.#services.get('notifications'),
    });

    for (const section of OS_SETTINGS_SECTIONS) {
      settings.registerSection(section);
    }
    settings.registerMany(createOSSettingsDefaults(this.#config));

    const theme = this.#services.get('theme');
    await theme.loadTheme('dark');
    await theme.loadTheme('light');

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
  /*  PRIVATE — Routing (§30, §64)                                       */
  /* ------------------------------------------------------------------ */

  #initRouting() {
    this.#routeRegistry = new RouteRegistry(this.#logger);
    this.#routeRegistry.registerMany(OS_ROUTES);

    const navigation = new NavigationService({
      routeRegistry: this.#routeRegistry,
      eventBus: this.#eventBus,
      logger: this.#logger,
    });
    navigation.init();

    this.#services.register('routes', this.#routeRegistry);
    this.#services.register('navigation', navigation);

    this.#logger.info('boot', 'Routing initialised');
  }

  /** Register application routes from manifests (§30, §31). */
  #registerApplicationRoutes() {
    for (const entry of this.#registry.getAll()) {
      const manifest = entry.manifest;
      const appId = manifest.id;
      const routes = Array.isArray(manifest.routes) ? manifest.routes : [];

      for (const r of routes) {
        this.#routeRegistry.register({
          path: r.path,
          scope: appId,
          kind: 'application',
          title: r.name,
          titleKey: r.nameKey,
          icon: manifest.icon || 'app',
          appId,
        });
      }
    }

    this.#logger.info(
      'boot',
      `Registered application routes (total routes: ${this.#routeRegistry.getAll().length})`,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Initial navigation                                       */
  /* ------------------------------------------------------------------ */

  #navigateInitial() {
    const navigation = this.#services.get('navigation');
    const defaultApp = this.#config.get('boot.defaultApplication', '');
    const defaultPath = defaultApp ? `/apps/${defaultApp}` : '/os/settings';

    const initialPath = navigation.getInitialPath(defaultPath);
    const ok = navigation.navigate(initialPath);

    if (!ok) {
      this.#logger.warn('boot', `Initial navigation to "${initialPath}" failed`);
    }
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
