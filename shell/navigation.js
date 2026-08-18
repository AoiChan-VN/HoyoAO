/**
 * Shell Navigation (§15, §20, §64)
 *
 * Menu items are GENERATED from the RouteRegistry (§15, §64).
 *   - OS section: routes with kind 'os'
 *   - Applications section: routes with kind 'application' (one per app)
 * Icons resolved BY NAME through IconRegistry (§20).
 * Items emit "navigation:selected" with a path; the Shell navigates.
 */

export class ShellNavigation {
  #routeRegistry;
  #eventBus;
  #localization;
  #icons;
  #element = null;

  constructor(routeRegistry, eventBus, localization, icons) {
    this.#routeRegistry = routeRegistry;
    this.#eventBus = eventBus;
    this.#localization = localization;
    this.#icons = icons;
  }

  render() {
    this.#element = document.createElement('nav');
    this.#element.className = 'os-shell__sidebar';
    this.#element.setAttribute('aria-label', this.#localization.t('nav.os'));

    /* OS section — from RouteRegistry */
    const osRoutes = this.#routeRegistry.getOSRoutes();
    const osSection = this.#buildSection(
      this.#localization.t('nav.os'),
      osRoutes,
    );

    /* Applications section — one entry per application */
    const appRoutes = this.#primaryAppRoutes();
    const appSection = this.#buildSection(
      this.#localization.t('nav.applications'),
      appRoutes,
    );

    this.#element.append(osSection, appSection);
    return this.#element;
  }

  /**
   * Highlight the item matching a path (called by Shell after navigation).
   * @param {string} path
   */
  setActivePath(path) {
    if (!this.#element) return;
    const btn = this.#element.querySelector(`[data-path="${path}"]`);
    if (!btn) return;

    this.#element
      .querySelectorAll('.os-shell__nav-item')
      .forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
  }

  /* ---- private ---- */

  /** One primary route per application (the "/apps/{id}" route). */
  #primaryAppRoutes() {
    const appRoutes = this.#routeRegistry.getApplicationRoutes();
    const byApp = new Map();

    for (const route of appRoutes) {
      const appId = route.scope;
      const preferred = `/apps/${appId}`;
      if (!byApp.has(appId)) {
        byApp.set(appId, route);
      } else if (route.path === preferred) {
        byApp.set(appId, route);
      }
    }

    return Array.from(byApp.values());
  }

  #buildSection(title, routes) {
    const section = document.createElement('div');
    section.className = 'os-shell__nav-section';

    const heading = document.createElement('div');
    heading.className = 'os-shell__nav-section-title';
    heading.textContent = title;
    section.appendChild(heading);

    for (const route of routes) {
      section.appendChild(this.#buildItem(route));
    }

    return section;
  }

  #buildItem(route) {
    const btn = document.createElement('button');
    btn.className = 'os-shell__nav-item';
    btn.type = 'button';
    btn.dataset.path = route.path;

    if (route.icon && this.#icons) {
      const iconEl = this.#icons.resolve(route.icon);
      iconEl.classList.add('ui-icon--sm');
      btn.appendChild(iconEl);
    }

    const label = route.titleKey
      ? this.#localization.t(route.titleKey)
      : (route.title || route.path);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'os-shell__nav-item-label';
    labelSpan.textContent = label;
    btn.appendChild(labelSpan);

    btn.setAttribute('aria-label', label);

    btn.addEventListener('click', () => {
      this.#eventBus.emit('navigation:selected', { path: route.path });
    });

    return btn;
  }
}
