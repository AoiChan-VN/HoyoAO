/**
 * Shell Navigation (§15, §20)
 *
 * Menu items generated from registry/config (§15).
 * Icons resolved BY NAME through IconRegistry (§20).
 * Exposes setActive() so the Shell can sync highlight with actual state.
 */

export class ShellNavigation {
  #registry;
  #eventBus;
  #localization;
  #icons;
  #element = null;

  constructor(registry, eventBus, localization, icons) {
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#localization = localization;
    this.#icons = icons;
  }

  render() {
    this.#element = document.createElement('nav');
    this.#element.className = 'os-shell__sidebar';
    this.#element.setAttribute('aria-label', this.#localization.t('nav.os'));

    /* OS section */
    const osSection = this.#buildSection(
      this.#localization.t('nav.os'),
      [
        { id: 'os-settings', labelKey: 'os.settings', icon: 'settings' },
        { id: 'os-diagnostics', labelKey: 'os.diagnostics', icon: 'diagnostics' },
      ],
    );

    /* Applications section — generated from registry (§15) */
    const apps = this.#registry.getAll();
    const appItems = apps.map((entry) => ({
      id: entry.manifest.id,
      label: entry.manifest.name,
      icon: entry.manifest.icon || 'app',
    }));
    const appSection = this.#buildSection(
      this.#localization.t('nav.applications'),
      appItems,
    );

    this.#element.append(osSection, appSection);
    return this.#element;
  }

  /**
   * Programmatically set the active item (used by Shell to sync state).
   * @param {string} targetId
   */
  setActive(targetId) {
    if (!this.#element) return;
    const btn = this.#element.querySelector(`[data-target="${targetId}"]`);
    if (btn) this.#setActive(btn);
  }

  /* ---- private ---- */

  #buildSection(title, items) {
    const section = document.createElement('div');
    section.className = 'os-shell__nav-section';

    const heading = document.createElement('div');
    heading.className = 'os-shell__nav-section-title';
    heading.textContent = title;
    section.appendChild(heading);

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'os-shell__nav-item';
      btn.type = 'button';
      btn.dataset.target = item.id;

      if (item.icon && this.#icons) {
        const iconEl = this.#icons.resolve(item.icon);
        iconEl.classList.add('ui-icon--sm');
        btn.appendChild(iconEl);
      }

      const label = item.labelKey
        ? this.#localization.t(item.labelKey)
        : item.label;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'os-shell__nav-item-label';
      labelSpan.textContent = label;
      btn.appendChild(labelSpan);

      btn.setAttribute('aria-label', label);

      btn.addEventListener('click', () => {
        this.#eventBus.emit('navigation:selected', { target: item.id });
      });

      section.appendChild(btn);
    }

    return section;
  }

  #setActive(activeBtn) {
    this.#element
      .querySelectorAll('.os-shell__nav-item')
      .forEach((el) => el.classList.remove('active'));
    activeBtn.classList.add('active');
  }
}
