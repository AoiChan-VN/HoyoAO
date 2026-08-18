/**
 * OS Shell (§87, §88)
 *
 * Common environment + rendering side of navigation.
 * Provides the Settings OS view with access to Settings, Installer,
 * Lifecycle, and EventBus so it can manage application activation (§84).
 */

import { ShellNavigation } from './navigation.js';
import { ShellFooter } from './footer.js';
import { NotificationHost } from './notification-host.js';
import { SettingsView } from './settings-view.js';
import { createNetworkIndicator } from './network-indicator.js';

export class Shell {
  #container;
  #config;
  #registry;
  #routeRegistry;
  #eventBus;
  #logger;
  #brand;
  #theme;
  #localization;
  #notifications;
  #icons;
  #assets;
  #settings;
  #navigation;
  #network;
  #installer;
  #lifecycle;

  #contentArea = null;
  #navigationUI = null;
  #footer = null;
  #notificationHost = null;
  #settingsView = null;
  #networkIndicator = null;

  #currentAppId = null;
  #currentOSView = null;
  #abortController;
  #networkHandlers = [];

  constructor({
    container, config, registry, routeRegistry, eventBus, logger, brand,
    theme, localization, notifications, icons, assets, settings, navigation,
    network, installer, lifecycle,
  }) {
    this.#container = container;
    this.#config = config;
    this.#registry = registry;
    this.#routeRegistry = routeRegistry;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#brand = brand;
    this.#theme = theme;
    this.#localization = localization;
    this.#notifications = notifications;
    this.#icons = icons;
    this.#assets = assets;
    this.#settings = settings;
    this.#navigation = navigation;
    this.#network = network;
    this.#installer = installer;
    this.#lifecycle = lifecycle;
    this.#abortController = new AbortController();
  }

  async mount() {
    this.#container.innerHTML = '';
    this.#container.classList.add('os-shell');

    /* Header */
    const header = this.#buildHeader();

    /* Body = Sidebar + Content */
    const body = document.createElement('div');
    body.className = 'os-shell__body';

    this.#navigationUI = new ShellNavigation(
      this.#routeRegistry,
      this.#eventBus,
      this.#localization,
      this.#icons,
    );
    const sidebar = this.#navigationUI.render();

    this.#contentArea = document.createElement('main');
    this.#contentArea.className = 'os-shell__content';
    this.#contentArea.id = 'app-mount';

    body.append(sidebar, this.#contentArea);

    /* Footer */
    this.#footer = new ShellFooter(this.#brand, this.#localization, this.#assets);
    const footer = this.#footer.render();

    /* Assemble */
    this.#container.append(header, body, footer);

    /* Global notifications (§87) */
    this.#notificationHost = new NotificationHost({
      container: this.#container,
      notifications: this.#notifications,
      eventBus: this.#eventBus,
      localization: this.#localization,
    });
    this.#notificationHost.mount();

    /* Navigation wiring (§30, §88) */
    this.#subscribeNavigation();

    /* Network status announcements (§24, §87) */
    this.#subscribeNetwork();

    this.#logger.info('shell', 'Shell DOM assembled');
  }

  getContentArea() {
    return this.#contentArea;
  }

  destroy() {
    this.#abortController.abort();

    for (const { event, handler } of this.#networkHandlers) {
      this.#eventBus.off(event, handler);
    }
    this.#networkHandlers = [];

    if (this.#networkIndicator) {
      this.#networkIndicator.destroy();
      this.#networkIndicator = null;
    }
    if (this.#settingsView) {
      this.#settingsView.destroy();
      this.#settingsView = null;
    }
    if (this.#notificationHost) {
      this.#notificationHost.destroy();
      this.#notificationHost = null;
    }
  }

  /* ---- private ---- */

  #subscribeNavigation() {
    this.#eventBus.on('navigation:selected', (payload) => {
      if (payload?.path) {
        this.#navigation.navigate(payload.path);
      }
    });

    this.#eventBus.on('navigation:changed', (payload) => {
      this.#onNavigationChanged(payload?.route);
    });
  }

  #onNavigationChanged(route) {
    if (!route) return;

    if (route.kind === 'os') {
      this.#showOSView(route.viewId);
      return;
    }

    if (route.kind === 'application') {
      this.#switchApplication(route.scope);
      return;
    }
  }

  #subscribeNetwork() {
    const onOffline = () => {
      this.#notifications.notify({
        type: 'warning',
        title: this.#localization.t('network.offline'),
        message: this.#localization.t('network.offlineNotification'),
        source: 'network',
      });
    };

    const onOnline = () => {
      this.#notifications.notify({
        type: 'success',
        title: this.#localization.t('network.online'),
        message: this.#localization.t('network.onlineNotification'),
        source: 'network',
        duration: 3000,
      });
    };

    this.#eventBus.on('network:offline', onOffline);
    this.#eventBus.on('network:online', onOnline);

    this.#networkHandlers.push(
      { event: 'network:offline', handler: onOffline },
      { event: 'network:online', handler: onOnline },
    );
  }

  #showOSView(viewId) {
    if (viewId === 'settings') {
      if (this.#currentOSView === 'settings') return;
      this.#clearCurrentView();
      this.#currentOSView = 'settings';
      this.#currentAppId = null;

      this.#settingsView = new SettingsView({
        container: this.#contentArea,
        settings: this.#settings,
        localization: this.#localization,
        installer: this.#installer,
        lifecycle: this.#lifecycle,
        eventBus: this.#eventBus,
      });
      this.#settingsView.mount();

      this.#navigationUI.setActivePath('/os/settings');
      return;
    }

    this.#logger.info('shell', `OS view "${viewId}" not available yet`);
  }

  async #switchApplication(appId) {
    if (this.#currentAppId === appId) return;

    this.#clearCurrentView();

    try {
      await this.#lifecycle.start(appId, this.#contentArea);
      this.#currentAppId = appId;
      this.#navigationUI.setActivePath(`/apps/${appId}`);
    } catch (err) {
      this.#logger.error('shell', `Failed to start "${appId}"`, {
        error: err.message,
      });
    }
  }

  #clearCurrentView() {
    if (this.#currentAppId && this.#lifecycle.isRunning(this.#currentAppId)) {
      this.#lifecycle.stop(this.#currentAppId);
    }
    this.#currentAppId = null;

    if (this.#settingsView) {
      this.#settingsView.destroy();
      this.#settingsView = null;
    }
    this.#currentOSView = null;

    this.#contentArea.innerHTML = '';
  }

  #buildHeader() {
    const header = document.createElement('header');
    header.className = 'os-shell__header';

    const logoWrap = document.createElement('div');
    logoWrap.className = 'os-shell__logo';

    const logoUrl = this.#brand.logoAsset
      ? this.#assets.resolve(this.#brand.logoAsset)
      : null;

    if (logoUrl) {
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = this.#brand.name || 'OS';
      img.className = 'os-shell__logo-img';
      logoWrap.appendChild(img);
    }

    const title = document.createElement('div');
    title.className = 'os-shell__title';
    title.textContent = this.#config.get('os.name', 'WEB ADMIN OS');

    const context = document.createElement('div');
    context.className = 'os-shell__context';

    this.#networkIndicator = createNetworkIndicator({
      network: this.#network,
      localization: this.#localization,
    });
    context.appendChild(this.#networkIndicator.element);

    header.append(logoWrap, title, context);
    return header;
  }
}
