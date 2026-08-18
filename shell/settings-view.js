/**
 * SettingsView — OS Shell UI (§49, §87, §19)
 *
 * Renders registered settings grouped by scope:
 *   OS sections first, then Application sections.
 * Uses UI primitives (Toggle, Select, Input). All labels localized (§37).
 * Discoverable through OS navigation → Settings (§19).
 */

import { createToggle } from '../platform/ui/toggle.js';
import { createSelect } from '../platform/ui/select.js';
import { createInput } from '../platform/ui/input.js';

export class SettingsView {
  #container;
  #settings;
  #localization;
  #root = null;
  /** @type {Map<string, object>} key → primitive handle */
  #controls = new Map();
  /** @type {Map<string, *>} last value pushed by this view (avoid re-render loop) */
  #lastSetValue = new Map();
  #unsubscribe = null;

  constructor({ container, settings, localization }) {
    this.#container = container;
    this.#settings = settings;
    this.#localization = localization;
  }

  mount() {
    this.#root = document.createElement('div');
    this.#root.className = 'settings-view';

    const title = document.createElement('h2');
    title.className = 'settings-view__title';
    title.textContent = this.#localization.t('settings.title');
    this.#root.appendChild(title);

    // OS sections
    const osSections = this.#settings.getSectionsForScope('os');
    if (osSections.length > 0) {
      const osWrap = this.#buildGroup(osSections);
      this.#root.appendChild(osWrap);
    }

    // Application sections (§49)
    const appSections = this.#settings.getAppSections();
    if (appSections.length > 0) {
      const appHeading = document.createElement('h3');
      appHeading.className = 'settings-view__group-heading';
      appHeading.textContent = this.#localization.t('nav.applications');
      this.#root.appendChild(appHeading);

      const appWrap = this.#buildGroup(appSections);
      this.#root.appendChild(appWrap);
    }

    this.#container.appendChild(this.#root);

    // React to external changes.
    this.#unsubscribe = this.#settings.subscribe((key, value) => {
      this.#onExternalChange(key, value);
    });
  }

  destroy() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
    for (const handle of this.#controls.values()) {
      if (handle.destroy) handle.destroy();
    }
    this.#controls.clear();
    this.#lastSetValue.clear();
    if (this.#root && this.#root.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
      this.#root = null;
    }
  }

  /* ---- private ---- */

  #buildGroup(sections) {
    const wrap = document.createElement('div');
    wrap.className = 'settings-view__group';
    for (const section of sections) {
      wrap.appendChild(this.#buildSection(section));
    }
    return wrap;
  }

  #buildSection(section) {
    const block = document.createElement('section');
    block.className = 'settings-view__section';

    const heading = document.createElement('h3');
    heading.className = 'settings-view__section-title';
    heading.textContent = this.#localization.t(section.titleKey);
    block.appendChild(heading);

    const defs = this.#settings.getDefinitionsForSection(section.id);
    for (const def of defs) {
      const row = this.#buildControl(def);
      if (row) block.appendChild(row);
    }

    return block;
  }

  #buildControl(def) {
    const value = this.#settings.get(def.key);
    const label = this.#localization.t(def.labelKey);

    let primitive = null;

    switch (def.type) {
      case 'toggle':
        primitive = createToggle({
          label,
          checked: Boolean(value),
          onChange: (v) => this.#commit(def.key, v),
        });
        break;

      case 'select':
        primitive = createSelect({
          label,
          options: this.#mapOptions(def.options),
          value,
          onChange: (v) => this.#commit(def.key, v),
        });
        break;

      case 'input':
      case 'number':
        primitive = createInput({
          label,
          type: def.type === 'number' ? 'number' : 'text',
          value: String(value ?? ''),
          onChange: (v) => this.#commit(def.key, v),
        });
        break;

      default:
        return null;
    }

    this.#controls.set(def.key, primitive);

    const row = document.createElement('div');
    row.className = 'settings-view__row';
    row.appendChild(primitive.element);
    return row;
  }

  #mapOptions(options) {
    if (!Array.isArray(options)) return [];
    return options.map((opt) => ({
      value: opt.value,
      label: opt.labelKey
        ? this.#localization.t(opt.labelKey)
        : String(opt.label ?? opt.value),
    }));
  }

  #commit(key, value) {
    this.#lastSetValue.set(key, value);
    this.#settings.set(key, value);
  }

  #onExternalChange(key, value) {
    // Ignore changes triggered by this view itself.
    if (this.#lastSetValue.get(key) === value) return;
    this.#lastSetValue.set(key, value);

    // Rebuild the affected control so it reflects the new value.
    const old = this.#controls.get(key);
    if (old && old.destroy) old.destroy();
    this.#controls.delete(key);

    const def = Array.from(this.#settings.getDefinitionsForSection(
      this.#sectionOf(key),
    )).find((d) => d.key === key);
    if (!def || !this.#root) return;

    const row = this.#buildControl(def);
    if (!row) return;

    // Replace the existing row for this key if present.
    const existing = this.#root.querySelector(`[data-settings-key="${key}"]`);
    if (existing) {
      row.setAttribute('data-settings-key', key);
      existing.replaceWith(row);
    }
  }

  #sectionOf(key) {
    return this.#settings.get(key) !== undefined
      ? Array.from(this.#sectionsAll()).find((s) =>
          this.#settings.getDefinitionsForSection(s.id).some((d) => d.key === key),
        )?.id
      : null;
  }

  #sectionsAll() {
    return this.#settings.getSections();
  }
} 
