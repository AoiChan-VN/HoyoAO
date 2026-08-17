/**
 * Shell Navigation (§15)
 *
 * Generates menu items from the Application Registry.
 * Clearly separates OS navigation from Application navigation.
 * Does NOT duplicate menu definitions (§15).
 * All UI text is localized via LocalizationService (§37).
 */

export class ShellNavigation {
  #registry;
  #eventBus;
  #localization;
  #element = null;

  constructor(registry, eventBus, localization) {
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#localization = localization;
  }

  render() {
    this.#element = document.createElement('nav');
    this.#element.className = 'os-shell__sidebar';
    this.#element.setAttribute('aria-label', this.#localization.t('nav.os'));

    /* OS section */
    const osSection = this.#buildSection(
      this.#localization.t('nav.os'),
      [
        { id: 'os-settings', labelKey: 'os.settings' },
        { id: 'os-diagnostics', labelKey: 'os.diagnostics' },
      ],
    );

    /* Applications section — generated from registry (§15) */
    const apps = this.#registry.getAll();
    const appItems = apps.map((entry) => ({
      id: entry.manifest.id,
      label: entry.manifest.name,
    }));
    const appSection = this.#buildSection(
      this.#localization.t('nav.applications'),
      appItems,
    );

    this.#element.append(osSection, appSection);
    return this.#element;
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

      // Localized label: use labelKey if available, else direct label (§37)
      const label = item.labelKey
        ? this.#localization.t(item.labelKey)
        : item.label;
      btn.textContent = label;
      btn.setAttribute('aria-label', label);

      btn.addEventListener('click', () => {
        this.#setActive(btn);
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
