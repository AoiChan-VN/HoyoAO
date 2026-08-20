/**
 * OS Shell (§87, §88)
 *
 * Common environment: navigation, global notifications (toasts + center),
 * application switching, system status, settings + applications access.
 * Contains NO application business logic.
 */

import { ShellNavigation } from './navigation.js';
import { ShellFooter } from './footer.js';
import { NotificationHost } from './notification-host.js';
import { SettingsView } from './settings-view.js';
import { ApplicationsView } from './applications-view.js';
import { createNotificationCenter } from './notification-center.js';
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
  #permissions;

  #contentArea = null;
  #navigationUI = null;
  #footer = null;
  #globalSearch = null;
  #notificationHost = null;
  #notificationCenter = null;
  #notificationBadge = null;
  #settingsView = null;
  #applicationsView = null;
  #networkIndicator = null;

  #currentAppId = null;
  #currentOSView = null;
  #abortController;
  #networkHandlers = [];
  #notificationHandlers = [];

  constructor({
    container, config, registry, routeRegistry, eventBus, logger, brand,
    theme, localization, notifications, icons, assets, settings, navigation,
    network, installer, lifecycle, permissions,
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
    this.#permissions = permissions;
    this.#abortController = new AbortController();
  }

  async mount() {
    this.#container.innerHTML = '';
    this.#container.classList.add('os-shell');

    const header = this.#buildHeader();

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

    this.#footer = new ShellFooter(this.#brand, this.#localization, this.#assets);
    const footer = this.#footer.render();

    this.#container.append(header, body, footer);

    // Toast notifications (§87).
    this.#notificationHost = new NotificationHost({
      container: this.#container,
      notifications: this.#notifications,
      eventBus: this.#eventBus,
      localization: this.#localization,
    });
    this.#notificationHost.mount();

    // Notification Center drawer.
    this.#notificationCenter = createNotificationCenter({
      notifications: this.#notifications,
      localization: this.#localization,
      icons: this.#icons,
      eventBus: this.#eventBus,
    });

    this.#subscribeNavigation();
    this.#subscribeNetwork();
    this.#subscribeNotificationBadge();

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

    for (const { event, handler } of this.#notificationHandlers) {
      this.#eventBus.off(event, handler);
    }
    this.#notificationHandlers = [];

    if (this.#networkIndicator) {
      this.#networkIndicator.destroy();
      this.#networkIndicator = null;
    }
    if (this.#globalSearch) {
      this.#globalSearch.destroy();
      this.#globalSearch = null;
    }
    if (this.#notificationCenter) {
      this.#notificationCenter.destroy();
      this.#notificationCenter = null;
    }
    if (this.#settingsView) {
      this.#settingsView.destroy();
      this.#settingsView = null;
    }
    if (this.#applicationsView) {
      this.#applicationsView.destroy();
      this.#applicationsView = null;
    }
    if (this.#notificationHost) {
      this.#notificationHost.destroy();
      this.#notificationHost = null;
    }
  }

  /* ---- private ---- */

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

        const context = document.createElement('div');
    context.className = 'os-shell__context';

    // Global Search button + dialog (M3).
    this.#globalSearch = new GlobalSearch({
      searchService: this.#services ? this.#services.get('search') : null,
      eventBus: this.#eventBus,
      localization: this.#localization,
      icons: this.#icons,
    });
    context.appendChild(this.#globalSearch.buildButton());
    this.#globalSearch.buildDialog();

    // Notification bell button + unread badge.
    const notifBtn = document.createElement('button');
    notifBtn.type = 'button';
    notifBtn.className = 'os-shell__notification-btn';
    notifBtn.setAttribute('aria-label', this.#localization.t('notifications.title'));

    if (this.#icons) {
      const bellIcon = this.#icons.resolve('bell');
      bellIcon.classList.add('ui-icon--sm');
      notifBtn.appendChild(bellIcon);
    }

    this.#notificationBadge = document.createElement('span');
    this.#notificationBadge.className = 'os-shell__notification-badge';
    this.#notificationBadge.hidden = true;
    notifBtn.appendChild(this.#notificationBadge);

    notifBtn.addEventListener('click', () => {
      if (this.#notificationCenter) this.#notificationCenter.toggle();
    });

    context.appendChild(notifBtn);

    // Network indicator.
    this.#networkIndicator = createNetworkIndicator({
      network: this.#network,
      localization: this.#localization,
    });
    context.appendChild(this.#networkIndicator.element);

    header.append(logoWrap, title, context);
    return header;
  }

  #subscribeNotificationBadge() {
    const update = () => {
      if (!this.#notificationBadge) return;
      const count = this.#notifications.getUnreadCount();
      if (count > 0) {
        this.#notificationBadge.hidden = false;
        this.#notificationBadge.textContent = count > 99 ? '99+' : String(count);
      } else {
        this.#notificationBadge.hidden = true;
      }
    };

    const events = ['notification:received', 'notification:read', 'notification:removed', 'notification:cleared'];
    for (const evt of events) {
      const handler = () => update();
      this.#eventBus.on(evt, handler);
      this.#notificationHandlers.push({ event: evt, handler });
    }
    update();
  }

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
    if (this.#currentOSView !== viewId) {
      if (this.#settingsView) {
        this.#settingsView.destroy();
        this.#settingsView = null;
      }
      if (this.#applicationsView) {
        this.#applicationsView.destroy();
        this.#applicationsView = null;
      }
      if (this.#currentAppId && this.#lifecycle.isRunning(this.#currentAppId)) {
        this.#lifecycle.stop(this.#currentAppId);
      }
      this.#currentAppId = null;
      this.#contentArea.innerHTML = '';
    }

    this.#currentOSView = viewId;

    if (viewId === 'settings') {
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

    if (viewId === 'applications') {
      this.#applicationsView = new ApplicationsView({
        container: this.#contentArea,
        installer: this.#installer,
        registry: this.#registry,
        permissions: this.#permissions,
        lifecycle: this.#lifecycle,
        localization: this.#localization,
        icons: this.#icons,
        eventBus: this.#eventBus,
        notifications: this.#notifications, // ← FIX B2
      });
      this.#applicationsView.mount();
      this.#navigationUI.setActivePath('/os/applications');
      return;
    }

    this.#logger.info('shell', `OS view "${viewId}" not available yet`);
  }
  
  /**
   * Switch to an Application (§88).
   *
   * Tears down the current OS view or Application, clears the content area,
   * and starts the requested Application. If the Application fails to start,
   * an ErrorState is rendered in the content area (§33 failure isolation,
   * §76 error state) so the user sees an explanation instead of a blank page.
   */
  async #switchApplication(appId) {
    if (this.#currentAppId === appId) return;

    // Tear down OS views.
    if (this.#settingsView) {
      this.#settingsView.destroy();
      this.#settingsView = null;
    }
    if (this.#applicationsView) {
      this.#applicationsView.destroy();
      this.#applicationsView = null;
    }
    this.#currentOSView = null;

    if (this.#currentAppId && this.#lifecycle.isRunning(this.#currentAppId)) {
      this.#lifecycle.stop(this.#currentAppId);
    }
    this.#currentAppId = null;
    this.#contentArea.innerHTML = '';

    try {
      await this.#lifecycle.start(appId, this.#contentArea);
      this.#currentAppId = appId;
      this.#navigationUI.setActivePath(`/apps/${appId}`);
    } catch (err) {
      // M4: render an explicit ErrorState instead of leaving a blank page.
      this.#logger.error('shell', `Failed to start "${appId}"`, { error: err.message });
      this.#renderAppError(appId, err);
    }
  }

  /**
   * Render an ErrorState in the content area when an Application fails to
   * start. The Shell remains alive, other Applications remain available,
   * and the user can navigate away (§33 failure isolation).
   * @param {string} appId
   * @param {Error} err
   */
  #renderAppError(appId, err) {
    this.#contentArea.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'ui-error-state';

    const icon = document.createElement('div');
    icon.className = 'ui-error-state__icon';
    if (this.#icons) {
      const errorIcon = this.#icons.resolve('error');
      errorIcon.classList.add('ui-icon--xl');
      icon.appendChild(errorIcon);
    }

    const title = document.createElement('h2');
    title.className = 'ui-error-state__title';
    const appName = this.#registry.get(appId)?.manifest?.name || appId;
    title.textContent = this.#localization.t('notification.appError.title', { app: appName });

    const desc = document.createElement('p');
    desc.className = 'ui-error-state__description';
    desc.textContent = err?.message || this.#localization.t('state.error');

    // Action: retry.
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'ui-error-state__action';
    retryBtn.textContent = this.#localization.t('applications.retry') || 'Retry';
    retryBtn.addEventListener('click', () => this.#switchApplication(appId));

    // Action: back to Dashboard.
    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'ui-error-state__action ui-error-state__action--secondary';
    homeBtn.textContent = this.#localization.t('applications.backToDashboard') || 'Back to Dashboard';
    homeBtn.addEventListener('click', () => {
      this.#eventBus.emit('navigation:selected', { path: '/apps/dashboard' });
    });

    const actions = document.createElement('div');
    actions.className = 'ui-error-state__actions';
    actions.append(retryBtn, homeBtn);

    wrap.append(icon, title, desc, actions);
    this.#contentArea.appendChild(wrap);
  }
