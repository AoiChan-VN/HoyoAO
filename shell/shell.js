/**
 * OS Shell (§87)
 *
 * Common environment. Visual identity (logo) is resolved through the
 * AssetRegistry BY NAME — never hardcoded (§20, §35).
 */

import { ShellNavigation } from './navigation.js';
import { ShellFooter } from './footer.js';
import { NotificationHost } from './notification-host.js';

export class Shell {
  #container;
  #config;
  #registry;
  #eventBus;
  #logger;
  #brand;
  #theme;
  #localization;
  #notifications;
  #icons;
  #assets;

  #contentArea = null;
  #navigation = null;
  #footer = null;
  #notificationHost = null;

  constructor({
    container, config, registry, eventBus, logger, brand,
    theme, localization, notifications, icons, assets,
  }) {
    this.#container = container;
    this.#config = config;
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#brand = brand;
    this.#theme = theme;
    this.#localization = localization;
    this.#notifications = notifications;
    this.#icons = icons;
    this.#assets = assets;
  }

  async mount() {
    this.#container.innerHTML = '';
    this.#container.classList.add('os-shell');

    /* Header */
    const header = this.#buildHeader();

    /* Body = Sidebar + Content */
    const body = document.createElement('div');
    body.className = 'os-shell__body';

    this.#navigation = new ShellNavigation(
      this.#registry,
      this.#eventBus,
      this.#localization,
      this.#icons,
    );
    const sidebar = this.#navigation.render();

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

    this.#logger.info('shell', 'Shell DOM assembled');
  }

  getContentArea() {
    return this.#contentArea;
  }

  /* ---- private ---- */

  #buildHeader() {
    const header = document.createElement('header');
    header.className = 'os-shell__header';

    // Logo resolved through AssetRegistry by name (§20, §35).
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

    header.append(logoWrap, title, context);
    return header;
  }
}
