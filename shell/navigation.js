/**
 * Shell Navigation (§15, §64)
 *
 * Menu items are generated from the RouteRegistry (single source of truth).
 * Each item carries data-path = route.path so the Shell can highlight the
 * active route via setActivePath(path). FIX B1: previously items used a
 * target id that did not match the route path, breaking the highlight.
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

    // OS section (§30 OS routes), sorted by order.
    const osRoutes = [...this.#routeRegistry.getOSRoutes()]
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const osSection = this.#buildSection(this.#localization.t('nav.os'), osRoutes);

    // Applications section — one item per app (§89, no per-app conditionals).
    const appItems = this.#buildAppItems();
    const appSection = this.#buildSection(this.#localization.t('nav.applications'), appItems);

    this.#element.append(osSection, appSection);
    return this.#element;
  }

  /**
   * Highlight the nav item whose route path matches.
   * FIX B1: matches on data-path (route path), not an id.
   * @param {string} path
   */
  setActivePath(path) {
    if (!this.#element || typeof path !== 'string') return;
    const selector = `[data-path="${CSS.escape(path)}"]`;
    const btn = this.#element.querySelector(selector);
    if (!btn) return;

    this.#element
      .querySelectorAll('.os-shell__nav-item')
      .forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
  }

  /* ---- private ---- */

  // One nav item per application: prefer the primary route /apps/{appId}.
  #buildAppItems() {
    const appRoutes = this.#routeRegistry.getApplicationRoutes();
    const byApp = new Map();

    for (const route of appRoutes) {
      const appId = route.appId || route.scope;
      if (!appId) continue;
      if (!byApp.has(appId)) {
        byApp.set(appId, route);
      } else if (route.path === `/apps/${appId}`) {
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
    // FIX B1: key the item by its route path.
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
