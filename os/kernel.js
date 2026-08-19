/**
 * OS Kernel — Boot Orchestrator
 *
 * Adds the Schema Service (source of truth for data schemas §64) and the
 * Offline Sync Service (queue-and-sync for offline-first operation §24).
 */

import { ConfigService } from './config.js';
import { EventBus } from './events.js';
import { Logger } from './logger.js';
import { ServiceRegistry } from '../runtime/services.js';
import { ApplicationRegistry } from '../runtime/registry.js';
import { ApplicationLifecycle } from '../runtime/lifecycle.js';
import { RouteRegistry } from '../runtime/route-registry.js';
import { ManifestValidator } from '../runtime/manifest-validator.js';
import { ApplicationInstaller } from '../runtime/application-installer.js';
import { ResourceRegistry } from '../runtime/resource-registry.js';
import { ExtensionRegistry } from '../runtime/extension-registry.js';
import { MigrationManager } from '../runtime/migration-manager.js';
import { Shell } from '../shell/shell.js';
import { StorageService } from './services/storage.js';
import { Indexer } from './services/indexer.js';
import { DataService } from './services/data.js';
import { CacheService } from './services/cache.js';
import { ThemeService } from './services/theme.js';
import { LocalizationService } from './services/localization.js';
import { NotificationService } from './services/notification.js';
import { DiagnosticsService } from './services/diagnostics.js';
import { IconRegistry } from './services/icon-registry.js';
import { AssetRegistry } from './services/asset-registry.js';
import { SettingsService } from './services/settings.js';
import { NavigationService } from './services/navigation.js';
import { NetworkService } from './services/network.js';
import { PermissionService } from './services/permission.js';
import { ResourceService } from './services/resource.js';
import { ExtensionService } from './services/extension.js';
import { SchemaService } from './services/schema.js';
import { OfflineSyncService } from './services/offline-sync.js';
import { DevelopmentTelemetryService } from './services/dev-telemetry.js';
import { DEFAULT_ICONS } from '../platform/icons/default-icons.js';
import { OS_SETTINGS_SECTIONS, createOSSettingsDefaults } from './settings/os-settings.js';
import { OS_ROUTES } from './routes/os-routes.js';
import { documentTemplatesPack } from './extensions/document-templates-pack.js';
import { OS_STORAGE_VERSION, OS_STORAGE_MIGRATIONS } from './services/storage/os-migrations.js';
import { CORE_SCHEMAS } from './schemas/core-schemas.js';

export class Kernel {
  /** @type {'UNINITIALIZED'|'BOOTING'|'RUNNING'|'FAILED'} */
  #bootState = 'UNINITIALIZED';

  #config;
  #eventBus;
  #logger;
  #services;
  #registry;
  #installer;
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

      /* Phase 3b — OS storage migrations (§59) */
      await this.#runOSMigrations();

      /* Phase 3c — Schema Service (§64, §83) */
      this.#initSchemaService();

      /* Phase 4 — Cache Service */
      this.#initCacheService();

      /* Phase 5 — Resource System (§35) + core resources */
      this.#initResourceService();
      this.#registerCoreResources();

      /* Phase 6 — Permission Service (§91, §92) */
      this.#initPermissionService();

      /* Phase 7 — Theme & Localization */
      await this.#initThemeAndLocalization();

      /* Phase 8 — Notification Service */
      this.#initNotificationService();

      /* Phase 9 — Network Service */
      this.#initNetworkService();

      /* Phase 9b — Offline Sync Service (§24) */
      await this.#initOfflineSyncService();

      /* Phase 10 — Icon & Asset Registries */
      this.#initIconRegistry();
      await this.#initAssetRegistry();

      /* Phase 11 — Settings Framework */
      await this.#initSettings();

      /* Phase 12 — Runtime */
      this.#registry = new ApplicationRegistry(this.#logger);
      this.#initInstaller();
      this.#initDiagnosticsService();
      this.#lifecycle = new ApplicationLifecycle(
        this.#registry,
        this.#logger,
        this.#eventBus,
        this.#services,
      );
      this.#logger.info('boot', 'Runtime initialised');

      /* Phase 13 — Routing */
      this.#initRouting();

      /* Phase 14 — Extension System foundation (§61, §62) */
      this.#initExtensionService();
      await this.#activateCoreExtensions();

      /* Phase 15 — Discovery via Installer */
      await this.#discoverApplications();
      this.#registerApplicationRoutes();

      /* Phase 16 — Mount Shell */
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
        installer: this.#installer,
        lifecycle: this.#lifecycle,
      });
      await this.#shell.mount();
      this.#logger.info('boot', 'Shell mounted');

      /* Phase 17 — Initial navigation */
      this.#navigateInitial();

      /* Phase 18 — Development telemetry (SIMULATED, dev-mode only) */
      this.#startDevTelemetryIfEnabled();

      /* Phase 19 — Done */
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
    const storage = new StorageService(this.#logger, {
      databaseName: this.#config.get('storage.databaseName', 'web-admin-os'),
      localPrefix: this.#config.get('storage.localPrefix', 'webos:'),
      storeName: this.#config.get('storage.storeName', 'kv'),
    });
    const indexer = new Indexer(storage, this.#eventBus, this.#logger);
    const data = new DataService(indexer, this.#eventBus, this.#logger);

    this.#services.register('storage', storage);
    this.#services.register('indexer', indexer);
    this.#services.register('data', data);
    this.#services.register('events', this.#eventBus);
    this.#services.register('config', this.#config);
    this.#services.register('logger', this.#logger);

    const migrations = new MigrationManager(storage, this.#logger);
    this.#services.register('migrations', migrations);

    this.#logger.info('boot', 'Core data & storage services initialised');
  }

  async #runOSMigrations() {
    const storage = this.#services.get('storage');
    const migrations = this.#services.get('migrations');

    const adapter = storage.hasAdapter('indexeddb')
      ? 'indexeddb'
      : storage.hasAdapter('local')
        ? 'local'
        : 'memory';

    const result = await migrations.migrate(
      'os:storage',
      OS_STORAGE_VERSION,
      OS_STORAGE_MIGRATIONS,
      adapter,
    );

    if (result.applied.length > 0) {
      this.#logger.info('boot', `OS storage migrated v${result.from} → v${result.to} (${adapter})`, {
        applied: result.applied,
      });
    } else {
      this.#logger.info('boot', `OS storage already at v${result.to} (${adapter})`);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Schema Service (§64, §83)                                */
  /* ------------------------------------------------------------------ */

  #initSchemaService() {
    const schemas = new SchemaService(this.#logger, this.#eventBus);
    schemas.registerMany(CORE_SCHEMAS);
    this.#services.register('schemas', schemas);
    this.#logger.info('boot', `Schema service initialised (${CORE_SCHEMAS.length} core schemas)`);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Cache                                                    */
  /* ------------------------------------------------------------------ */

  #initCacheService() {
    const cache = new CacheService(this.#eventBus, this.#logger, {
      maxEntries: this.#config.get('cache.maxEntries', 200),
    });
    this.#services.register('cache', cache);
    this.#logger.info('boot', 'Cache service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Resource System (§35, §84)                               */
  /* ------------------------------------------------------------------ */

  #initResourceService() {
    const resourceRegistry = new ResourceRegistry(this.#logger);
    const resourceService = new ResourceService({
      registry: resourceRegistry,
      eventBus: this.#eventBus,
      logger: this.#logger,
      cache: this.#services.get('cache'),
    });

    this.#services.register('resourceRegistry', resourceRegistry);
    this.#services.register('resources', resourceService);
    this.#logger.info('boot', 'Resource service initialised');
  }

  #registerCoreResources() {
    const resources = this.#services.get('resources');

    const coreResources = [
      {
        id: 'res-theme-dark',
        name: 'Dark Theme',
        type: 'theme',
        version: '1.0.0',
        url: 'platform/themes/dark.json',
        mimeType: 'application/json',
        owner: 'os',
        tags: ['theme', 'dark'],
      },
      {
        id: 'res-theme-light',
        name: 'Light Theme',
        type: 'theme',
        version: '1.0.0',
        url: 'platform/themes/light.json',
        mimeType: 'application/json',
        owner: 'os',
        tags: ['theme', 'light'],
      },
      {
        id: 'res-locale-en',
        name: 'English Locale',
        type: 'data',
        version: '1.0.0',
        url: 'platform/locales/en.json',
        mimeType: 'application/json',
        owner: 'os',
        tags: ['locale', 'en'],
      },
      {
        id: 'res-locale-vi',
        name: 'Vietnamese Locale',
        type: 'data',
        version: '1.0.0',
        url: 'platform/locales/vi.json',
        mimeType: 'application/json',
        owner: 'os',
        tags: ['locale', 'vi'],
      },
    ];

    for (const res of coreResources) {
      resources.registerResource(res);
    }

    this.#logger.info('boot', `Registered ${coreResources.length} core OS resources`);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Permission Service (§91, §92)                            */
  /* ------------------------------------------------------------------ */

  #initPermissionService() {
    const permissions = new PermissionService(this.#eventBus, this.#logger);
    this.#services.register('permissions', permissions);
    this.#logger.info('boot', 'Permission service initialised');
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
  /*  PRIVATE — Network                                                  */
  /* ------------------------------------------------------------------ */

  #initNetworkService() {
    const network = new NetworkService(this.#eventBus, this.#logger);
    network.init();
    this.#services.register('network', network);
    this.#logger.info('boot', 'Network service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Offline Sync Service (§24)                               */
  /* ------------------------------------------------------------------ */

  async #initOfflineSyncService() {
    const sync = new OfflineSyncService({
      storage: this.#services.get('storage'),
      network: this.#services.get('network'),
      eventBus: this.#eventBus,
      logger: this.#logger,
      options: { maxAttempts: this.#config.get('sync.maxAttempts', 5) },
    });
    await sync.init();
    this.#services.register('sync', sync);
    this.#logger.info('boot', 'Offline sync service initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Icon Registry                                            */
  /* ------------------------------------------------------------------ */

  #initIconRegistry() {
    const iconsCache = this.#services.get('cache').getPartition('icons');
    const icons = new IconRegistry(this.#logger, iconsCache);
    icons.registerMany(DEFAULT_ICONS);
    this.#services.register('icons', icons);
    this.#logger.info('boot', 'Icon registry initialised (cache-backed)');
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
      this.#logger.warn('boot', 'Failed to load asset manifest', { error: err.message });
    }

    this.#services.register('assets', assets);
    this.#logger.info('boot', 'Asset registry initialised');
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Settings                                                 */
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
  /*  PRIVATE — Installer (§40, §84)                                     */
  /* ------------------------------------------------------------------ */

  #initInstaller() {
    const validator = new ManifestValidator(this.#logger);
    const installer = new ApplicationInstaller({
      registry: this.#registry,
      validator,
      config: this.#config,
      eventBus: this.#eventBus,
      logger: this.#logger,
      permissions: this.#services.get('permissions'),
    });

    this.#installer = installer;
    this.#services.register('installer', installer);
    this.#logger.info('boot', 'Application installer initialised');
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
  /*  PRIVATE — Routing                                                  */
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

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Extension System foundation (§61, §62)                   */
  /* ------------------------------------------------------------------ */

  #initExtensionService() {
    const extensionRegistry = new ExtensionRegistry(this.#logger);
    const extensionService = new ExtensionService({
      registry: extensionRegistry,
      eventBus: this.#eventBus,
      logger: this.#logger,
      services: this.#services,
      permissions: this.#services.get('permissions'),
    });

    this.#services.register('extensionRegistry', extensionRegistry);
    this.#services.register('extensions', extensionService);
    this.#logger.info('boot', 'Extension service initialised');
  }

  async #activateCoreExtensions() {
    const extensions = this.#services.get('extensions');

    const coreExtensions = [documentTemplatesPack];

    for (const ext of coreExtensions) {
      const reg = extensions.registerExtension(ext);
      if (!reg.success) {
        this.#logger.warn('boot', `Extension registration skipped: ${reg.reason}`);
        continue;
      }
      const act = await extensions.activateExtension(ext.id);
      if (!act.success) {
        this.#logger.warn('boot', `Extension activation failed for "${ext.id}": ${act.reason}`);
      }
    }

    this.#logger.info('boot', `Core extensions processed (${coreExtensions.length})`);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Discovery via Installer (§40, §75)                       */
  /* ------------------------------------------------------------------ */

  async #discoverApplications() {
    const paths = this.#config.get('applications.manifests', []);
    let installed = 0;
    let failed = 0;

    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (!res.ok) {
          this.#logger.warn('boot', `Manifest not found: ${path}`);
          failed++;
          continue;
        }

        const manifest = await res.json();
        const result = await this.#installer.install(manifest);

        if (result.success) {
          installed++;
        } else {
          failed++;
          this.#logger.warn('boot', `Install skipped for "${manifest?.id}" (${result.reason})`);
        }
      } catch (err) {
        failed++;
        this.#logger.warn('boot', `Manifest load error: ${path}`, { error: err.message });
      }
    }

    this.#logger.info('boot', `Discovery complete — ${installed} installed, ${failed} skipped/failed`);
  }

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
      this.#logger.warn('boot', 'Branding unavailable — using defaults', { error: err.message });
      this.#brand = {
        name: 'HoyoAO-OS',
        owner: 'AoiChan-VN',
        copyright: '© 2026 HoyoAO. All Rights Reserved',
        logoAsset: 'brand.logo',
        faviconAsset: 'brand.favicon',
        links: { support: '#', community: '#', status: '#' },
      };
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
