/**
 * SettingsView — OS Shell UI (§49, §87, §19)
 *
 * Renders:
 *   - OS settings sections (scope 'os') from SettingsService.
 *   - Applications group (§49):
 *       • Applications management — activation toggles via Installer (§84).
 *       • App-registered settings sections from SettingsService.
 *
 * Discoverable through OS navigation → Settings (§19).
 * No application names are hardcoded — everything driven by registries (§89).
 */

import { createToggle } from '../platform/ui/toggle.js';
import { createSelect } from '../platform/ui/select.js';
import { createInput } from '../platform/ui/input.js';
import { createBadge } from '../platform/ui/badge.js';

const ACTIVATION_EVENTS = [
  'application:activation-changed',
  'application:started',
  'application:stopped',
  'application:installed',
  'application:uninstalled',
];

const STATE_VARIANTS = {
  RUNNING: 'success',
  STARTING: 'info',
  STOPPING: 'warning',
  STOPPED: 'neutral',
  FAILED: 'error',
  DISABLED: 'neutral',
  DISCOVERED: 'neutral',
};

export class SettingsView {
  #container;
  #settings;
  #localization;
  #installer;
  #lifecycle;
  #eventBus;

  #root = null;
  #activationSectionEl = null;
  /** @type {Map<string, object>} setting key → primitive handle */
  #controls = new Map();
  /** @type {Map<string, *>} last value pushed by this view */
  #lastSetValue = new Map();
  #unsubscribers = [];

  constructor({ container, settings, localization, installer, lifecycle, eventBus }) {
    this.#container = container;
    this.#settings = settings;
    this.#localization = localization;
    this.#installer = installer;
    this.#lifecycle = lifecycle;
    this.#eventBus = eventBus;
  }

  mount() {
    this.#root = document.createElement('div');
    this.#root.className = 'settings-view';

    const title = document.createElement('h2');
    title.className = 'settings-view__title';
    title.textContent = this.#localization.t('settings.title');
    this.#root.appendChild(title);

    /* ---- OS sections ---- */
    const osSections = this.#settings.getSectionsForScope('os');
    if (osSections.length > 0) {
      this.#root.appendChild(this.#buildGroup(osSections));
    }

    /* ---- Applications group (§49) ---- */
    const appHeading = document.createElement('h3');
    appHeading.className = 'settings-view__group-heading';
    appHeading.textContent = this.#localization.t('settings.group.applications');
    this.#root.appendChild(appHeading);

    // Applications management (activation toggles).
    this.#activationSectionEl = this.#buildApplicationsManagementSection();
    this.#root.appendChild(this.#activationSectionEl);

    // App-registered settings sections.
    const appSections = this.#settings.getAppSections();
    if (appSections.length > 0) {
      this.#root.appendChild(this.#buildGroup(appSections));
    }

    this.#container.appendChild(this.#root);

    /* ---- subscriptions (§29, §74) ---- */
    const unsubSettings = this.#settings.subscribe((key, value) => {
      this.#onExternalChange(key, value);
    });
    this.#unsubscribers.push(unsubSettings);

    if (this.#eventBus) {
      const refreshActivation = () => this.#refreshActivationSection();
      for (const evt of ACTIVATION_EVENTS) {
        this.#eventBus.on(evt, refreshActivation);
        this.#unsubscribers.push(() => this.#eventBus.off(evt, refreshActivation));
      }
    }
  }

  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];

    for (const handle of this.#controls.values()) {
      if (handle && handle.destroy) handle.destroy();
    }
    this.#controls.clear();
    this.#lastSetValue.clear();

    if (this.#root && this.#root.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
    }
    this.#root = null;
    this.#activationSectionEl = null;
  }

  /* ================================================================== */
  /*  Applications management (activation §84)                           */
  /* ================================================================== */

  #buildApplicationsManagementSection() {
    const section = document.createElement('section');
    section.className = 'settings-view__section';

    const heading = document.createElement('h3');
    heading.className = 'settings-view__section-title';
    heading.textContent = this.#localization.t('settings.section.applications');
    section.appendChild(heading);

    const listWrap = document.createElement('div');
    listWrap.className = 'settings-view__app-list';
    section.appendChild(listWrap);

    this.#renderAppList(listWrap);
    return section;
  }

  #renderAppList(container) {
    container.innerHTML = '';

    const apps = this.#installer.listInstalled();

    if (apps.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'settings-view__empty';
      empty.textContent = this.#localization.t('settings.applications.none');
      container.appendChild(empty);
      return;
    }

    for (const entry of apps) {
      container.appendChild(this.#buildAppRow(entry));
    }
  }

  #buildAppRow(entry) {
    const manifest = entry.manifest;

    const row = document.createElement('div');
    row.className = 'settings-view__app-row';

    // Identity + version
    const info = document.createElement('div');
    info.className = 'settings-view__app-info';

    const name = document.createElement('div');
    name.className = 'settings-view__app-name';
    name.textContent = manifest.name;

    const meta = document.createElement('div');
    meta.className = 'settings-view__app-meta';
    meta.textContent = `v${manifest.version}`;

    info.append(name, meta);

    // State badge
    const stateVariant = STATE_VARIANTS[entry.state] || 'neutral';
    const stateBadge = createBadge({ label: entry.state, variant: stateVariant });

    // Activation toggle (§84)
    const isEnabled = entry.activation !== 'disabled';
    const toggle = createToggle({
      label: '',
      checked: isEnabled,
      onChange: (enabled) => this.#onActivationToggle(manifest.id, enabled),
    });
    // Accessible name without visible duplicate label (§38).
    const toggleEl = toggle.element;
    toggleEl.setAttribute('aria-label', manifest.name);

    const actions = document.createElement('div');
    actions.className = 'settings-view__app-actions';
    actions.append(stateBadge.element, toggleEl);

    row.append(info, actions);
    return row;
  }

  #onActivationToggle(appId, enabled) {
    const activation = enabled ? 'enabled' : 'disabled';

    // If disabling a running app, stop it first (§84 usage control).
    if (!enabled && this.#lifecycle && this.#lifecycle.isRunning(appId)) {
      this.#lifecycle.stop(appId);
    }

    this.#installer.setActivation(appId, activation);
    // "application:activation-changed" triggers #refreshActivationSection.
  }

  #refreshActivationSection() {
    if (!this.#activationSectionEl) return;
    const listWrap = this.#activationSectionEl.querySelector('.settings-view__app-list');
    if (listWrap) this.#renderAppList(listWrap);
  }

  /* ================================================================== */
  /*  Settings sections from SettingsService (OS + app-registered)       */
  /* ================================================================== */

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

    const sectionId = this.#sectionOf(key);
    if (!sectionId || !this.#root) return;

    const def = this.#settings
      .getDefinitionsForSection(sectionId)
      .find((d) => d.key === key);
    if (!def) return;

    const row = this.#buildControl(def);
    if (!row) return;

    const existing = this.#root.querySelector(`[data-settings-key="${key}"]`);
    if (existing) {
      row.setAttribute('data-settings-key', key);
      existing.replaceWith(row);
    }
  }

  #sectionOf(key) {
    for (const section of this.#settings.getSections()) {
      const defs = this.#settings.getDefinitionsForSection(section.id);
      if (defs.some((d) => d.key === key)) return section.id;
    }
    return null;
  }
}
