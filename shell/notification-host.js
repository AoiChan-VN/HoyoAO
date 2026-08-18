/**
 * NotificationHost — OS Shell UI (§87)
 *
 * Renders global notification toasts from the NotificationService.
 * Also bridges "application:error" events into error notifications,
 * fulfilling the Shell's global-error-presentation responsibility (§87).
 *
 * This is UI only; all state lives in NotificationService (§11, §51).
 */
export class NotificationHost {
  #container;
  #notifications;
  #eventBus;
  #localization;
  #root = null;
  #unsubscribe = null;
  #abortController;

  constructor({ container, notifications, eventBus, localization }) {
    this.#container = container;
    this.#notifications = notifications;
    this.#eventBus = eventBus;
    this.#localization = localization;
    this.#abortController = new AbortController();
  }

  mount() {
    this.#root = document.createElement('div');
    this.#root.className = 'notification-host';
    this.#root.setAttribute('role', 'region');
    this.#root.setAttribute('aria-label', 'Notifications');
    this.#container.appendChild(this.#root);

    // Render from service state.
    this.#unsubscribe = this.#notifications.subscribe((list) => this.#render(list));
    this.#render(this.#notifications.getActive());

    // Bridge: application errors → error toast (§87, §46 user-facing errors).
    const onAppError = (payload) => {
      this.#notifications.notify({
        type: 'error',
        title: this.#localization.t('notification.appError.title', {
          app: payload?.appId || 'unknown',
        }),
        message: payload?.error || '',
        source: 'lifecycle',
      });
    };
    this.#eventBus.on('application:error', onAppError);
    this.#abortController.signal.addEventListener('abort', () => {
      this.#eventBus.off('application:error', onAppError);
    });
  }

  destroy() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
    this.#abortController.abort();
    if (this.#root && this.#root.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
      this.#root = null;
    }
  }

  /* ---- private ---- */

  #render(list) {
    this.#root.innerHTML = '';
    for (const n of list) {
      this.#root.appendChild(this.#buildToast(n));
    }
  }

  #buildToast(n) {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-toast--${n.type}`;
    toast.setAttribute('role', n.type === 'error' ? 'alert' : 'status');

    const body = document.createElement('div');
    body.className = 'notification-toast__body';

    if (n.title) {
      const title = document.createElement('div');
      title.className = 'notification-toast__title';
      title.textContent = n.title;
      body.appendChild(title);
    }
    if (n.message) {
      const msg = document.createElement('div');
      msg.className = 'notification-toast__message';
      msg.textContent = n.message;
      body.appendChild(msg);
    }
    toast.appendChild(body);

    if (n.dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'notification-toast__close';
      closeBtn.setAttribute(
        'aria-label',
        this.#localization.t('notification.dismiss'),
      );
      closeBtn.textContent = '\u2715';
      closeBtn.addEventListener(
        'click',
        () => this.#notifications.dismiss(n.id),
        { signal: this.#abortController.signal },
      );
      toast.appendChild(closeBtn);
    }

    return toast;
  }
} 
