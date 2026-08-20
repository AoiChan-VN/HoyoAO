/**
 * Applications View (§87, §30, §84)
 *
 * OS view at /os/applications. FIX B2: uninstall feedback now goes through
 * the NotificationService (real toasts) instead of emitting an empty event.
 */
import { createBadge } from '../platform/ui/badge.js';
import { createToggle } from '../platform/ui/toggle.js';
import { createModal } from '../platform/ui/modal.js';

export class ApplicationsView {
  #container;
  #installer;
  #registry;
  #permissions;
  #lifecycle;
  #localization;
  #icons;
  #eventBus;
  #notifications;

  #root = null;
  #listEl = null;
  #unsubscribers = [];

  constructor({
    container, installer, registry, permissions, lifecycle,
    localization, icons, eventBus, notifications,
  }) {
    this.#container = container;
    this.#installer = installer;
    this.#registry = registry;
    this.#permissions = permissions;
    this.#lifecycle = lifecycle;
    this.#localization = localization;
    this.#icons = icons;
    this.#eventBus = eventBus;
    this.#notifications = notifications;
  }

  mount() {
    this.#root = document.createElement('div');
    this.#root.className = 'applications-view';

    const title = document.createElement('h2');
    title.className = 'applications-view__title';
    title.textContent = this.#localization.t('applications.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'applications-view__subtitle';
    subtitle.textContent = this.#localization.t('applications.subtitle');

    this.#listEl = document.createElement('div');
    this.#listEl.className = 'applications-view__list';

    this.#root.append(title, subtitle, this.#listEl);
    this.#container.appendChild(this.#root);

    this.#render();

    const events = [
      'application:installed',
      'application:uninstalled',
      'application:activation-changed',
      'application:started',
      'application:stopped',
    ];
    for (const evt of events) {
      const handler = () => this.#render();
      this.#eventBus.on(evt, handler);
      this.#unsubscribers.push(() => this.#eventBus.off(evt, handler));
    }
  }

  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];
    if (this.#root && this.#root.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
    }
    this.#root = null;
    this.#listEl = null;
  }

  /* ---- private ---- */

  #render() {
    if (!this.#listEl) return;
    this.#listEl.innerHTML = '';

    const apps = this.#installer.listInstalled();

    if (apps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'applications-view__empty';
      empty.textContent = this.#localization.t('applications.none');
      this.#listEl.appendChild(empty);
      return;
    }

    for (const entry of apps) {
      this.#listEl.appendChild(this.#buildAppCard(entry));
    }
  }

  #buildAppCard(entry) {
    const manifest = entry.manifest;
    const appId = manifest.id;

    const card = document.createElement('div');
    card.className = 'applications-view__card';

    if (this.#icons) {
      const iconEl = this.#icons.resolve(manifest.icon || 'app');
      iconEl.classList.add('ui-icon--lg', 'applications-view__icon');
      card.appendChild(iconEl);
    }

    const info = document.createElement('div');
    info.className = 'applications-view__info';

    const nameRow = document.createElement('div');
    nameRow.className = 'applications-view__name-row';

    const name = document.createElement('span');
    name.className = 'applications-view__name';
    name.textContent = manifest.name;

    const version = document.createElement('span');
    version.className = 'applications-view__version';
    version.textContent = `v${manifest.version}`;

    nameRow.append(name, version);

    const desc = document.createElement('p');
    desc.className = 'applications-view__desc';
    desc.textContent = manifest.description || '';

    info.append(nameRow, desc);

    // Permissions badges (§92 visibility).
    const permsWrap = document.createElement('div');
    permsWrap.className = 'applications-view__perms';
    const granted = this.#permissions
      ? this.#permissions.getPermissions(appId)
      : (manifest.permissions || []);

    if (granted.length === 0) {
      const none = document.createElement('span');
      none.className = 'applications-view__perm-none';
      none.textContent = this.#localization.t('applications.noPermissions');
      permsWrap.appendChild(none);
    } else {
      for (const p of granted) {
        const badge = createBadge({ label: p, variant: 'info' });
        permsWrap.appendChild(badge.element);
      }
    }

    info.appendChild(permsWrap);
    card.appendChild(info);

    // Controls.
    const controls = document.createElement('div');
    controls.className = 'applications-view__controls';

    const stateBadge = createBadge({
      label: this.#localization.t(`applications.state.${entry.activation}`) || entry.activation,
      variant: entry.activation === 'enabled' ? 'success' : 'neutral',
    });
    controls.appendChild(stateBadge.element);

    const toggle = createToggle({
      label: '',
      checked: entry.activation !== 'disabled',
      onChange: (enabled) => {
        const activation = enabled ? 'enabled' : 'disabled';
        if (!enabled && this.#lifecycle && this.#lifecycle.isRunning(appId)) {
          this.#lifecycle.stop(appId);
        }
        this.#installer.setActivation(appId, activation);
      },
    });
    toggle.element.setAttribute('aria-label', this.#localization.t('applications.activation'));
    controls.appendChild(toggle.element);

    const uninstallBtn = document.createElement('button');
    uninstallBtn.type = 'button';
    uninstallBtn.className = 'applications-view__uninstall';
    uninstallBtn.textContent = this.#localization.t('applications.uninstall');
    uninstallBtn.addEventListener('click', () => this.#confirmUninstall(appId, manifest.name));
    controls.appendChild(uninstallBtn);

    card.appendChild(controls);
    return card;
  }

  #confirmUninstall(appId, appName) {
    const message = document.createElement('p');
    message.textContent = this.#localization.t('applications.uninstallConfirm', { app: appName });

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'applications-view__confirm-btn';
    confirmBtn.textContent = this.#localization.t('applications.uninstall');

    // Requires modal footer support (FIX B5).
    const modal = createModal({
      title: this.#localization.t('applications.uninstallTitle'),
      content: message,
      footer: confirmBtn,
      closable: true,
    });

    confirmBtn.addEventListener('click', () => {
      if (this.#lifecycle && this.#lifecycle.isRunning(appId)) {
        this.#lifecycle.stop(appId);
      }
      const result = this.#installer.uninstall(appId);
      modal.close();

      // FIX B2: real user feedback through NotificationService.
      if (this.#notifications) {
        if (result.success) {
          this.#notifications.notify({
            type: 'success',
            title: this.#localization.t('applications.uninstallTitle'),
            message: this.#localization.t('applications.uninstallSuccess', { app: appName }),
            source: 'applications-view',
          });
        } else {
          this.#notifications.notify({
            type: 'error',
            title: this.#localization.t('applications.uninstallTitle'),
            message: this.#localization.t('applications.uninstallFailed', { reason: result.reason }),
            source: 'applications-view',
          });
        }
      }

      this.#render();
    });

    modal.open();
  }
}
