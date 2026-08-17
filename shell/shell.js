/**
 * OS Shell (§87)
 *
 * Renders the common environment:
 *   Header  — logo, OS name, context
 *   Sidebar — OS nav + Application nav (§15)
 *   Content — mount point for Applications
 *   Footer  — status, support, copyright (§78)
 *
 * Contains ZERO application business logic.
 * All UI text is localized via LocalizationService (§37).
 */

import { ShellNavigation } from './navigation.js';
import { ShellFooter } from './footer.js';

export class Shell {
  #container;
  #config;
  #registry;
  #eventBus;
  #logger;
  #brand;
  #theme;
  #localization;
  #contentArea = null;
  #navigation = null;
  #footer = null;

  constructor({ container, config, registry, eventBus, logger, brand, theme, localization }) {
    this.#container = container;
    this.#config = config;
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#brand = brand;
    this.#theme = theme;
    this.#localization = localization;
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
    );
    const sidebar = this.#navigation.render();

    this.#contentArea = document.createElement('main');
    this.#contentArea.className = 'os-shell__content';
    this.#contentArea.id = 'app-mount';

    body.append(sidebar, this.#contentArea);

    /* Footer */
    this.#footer = new ShellFooter(this.#brand, this.#localization);
    const footer = this.#footer.render();

    /* Assemble */
    this.#container.append(header, body, footer);

    this.#logger.info('shell', 'Shell DOM assembled');
  }

  /** The DOM node where Applications mount their UI. */
  getContentArea() {
    return this.#contentArea;
  }

  /* ---- private ---- */

  #buildHeader() {
    const header = document.createElement('header');
    header.className = 'os-shell__header';

    // Logo
    const logoWrap = document.createElement('div');
    logoWrap.className = 'os-shell__logo';

    if (this.#brand.logo?.src) {
      const img = document.createElement('img');
      img.src = this.#brand.logo.src;
      img.alt = this.#brand.logo.alt || this.#brand.name;
      img.className = 'os-shell__logo-img';
      logoWrap.appendChild(img);
    }

    // Title — from config (branding), not hardcoded (§79)
    const title = document.createElement('div');
    title.className = 'os-shell__title';
    title.textContent = this.#config.get('os.name', 'WEB ADMIN OS');

    // Context area (right side)
    const context = document.createElement('div');
    context.className = 'os-shell__context';

    header.append(logoWrap, title, context);
    return header;
  }
}
