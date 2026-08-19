/**
 * Notification Center (§87, §97)
 *
 * A Drawer that lists the persistent notification history. Supports
 * mark-as-read, mark-all-read, remove, and clear. Follows the Drawer
 * pattern (§97) as a specialized, dynamic implementation.
 *
 * Accessibility (§38): role="dialog", aria-label, Escape to close,
 * focus moved into the panel on open and restored on close.
 */

const TYPE_ICONS = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function createNotificationCenter({ notifications, localization, icons, eventBus }) {
  let isOpen = false;
  let previouslyFocused = null;
  const unsubscribers = [];

  const backdrop = document.createElement('div');
  backdrop.className = 'notification-center__backdrop';
  backdrop.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'notification-center__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', localization.t('notifications.title'));

  /* ---- header ---- */
  const header = document.createElement('div');
  header.className = 'notification-center__header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'notification-center__title-wrap';

  const title = document.createElement('h3');
  title.className = 'notification-center__title';
  title.textContent = localization.t('notifications.title');

  const unread = document.createElement('span');
  unread.className = 'notification-center__unread';

  titleWrap.append(title, unread);

  const actions = document.createElement('div');
  actions.className = 'notification-center__actions';

  const markAllBtn = document.createElement('button');
  markAllBtn.type = 'button';
  markAllBtn.className = 'notification-center__action-btn';
  markAllBtn.textContent = localization.t('notifications.markAllRead');
  markAllBtn.addEventListener('click', () => notifications.markAllAsRead());

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'notification-center__action-btn';
  clearBtn.textContent = localization.t('notifications.clear');
  clearBtn.addEventListener('click', () => notifications.clearHistory());

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'notification-center__close';
  closeBtn.setAttribute('aria-label', localization.t('notifications.close'));
  closeBtn.textContent = '\u2715';
  closeBtn.addEventListener('click', close);

  actions.append(markAllBtn, clearBtn, closeBtn);
  header.append(titleWrap, actions);

  /* ---- list ---- */
  const list = document.createElement('div');
  list.className = 'notification-center__list';

  panel.append(header, list);
  backdrop.appendChild(panel);

  function render() {
    const history = notifications.getHistory();
    const unreadCount = notifications.getUnreadCount();

    unread.textContent = unreadCount > 0
      ? localization.t('notifications.unread', { count: unreadCount })
      : '';

    list.innerHTML = '';

    if (history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'notification-center__empty';
      empty.textContent = localization.t('notifications.empty');
      list.appendChild(empty);
      return;
    }

    for (const n of history) {
      list.appendChild(buildItem(n));
    }
  }

  function buildItem(n) {
    const item = document.createElement('div');
    item.className = 'notification-center__item';
    if (!n.read) item.classList.add('is-unread');

    if (icons) {
      const iconEl = icons.resolve(TYPE_ICONS[n.type] || 'info');
      iconEl.classList.add('ui-icon--sm', `notification-center__icon--${n.type}`);
      item.appendChild(iconEl);
    }

    const body = document.createElement('div');
    body.className = 'notification-center__item-body';

    const itemTitle = document.createElement('div');
    itemTitle.className = 'notification-center__item-title';
    itemTitle.textContent = n.title || localization.t('notifications.untitled');

    const itemMsg = document.createElement('div');
    itemMsg.className = 'notification-center__item-message';
    itemMsg.textContent = n.message || '';

    const itemTime = document.createElement('div');
    itemTime.className = 'notification-center__item-time';
    itemTime.textContent = new Date(n.timestamp).toLocaleString();

    body.append(itemTitle, itemMsg, itemTime);
    item.appendChild(body);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'notification-center__remove';
    removeBtn.setAttribute('aria-label', localization.t('notifications.remove'));
    removeBtn.textContent = '\u2715';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifications.removeFromHistory(n.id);
    });
    item.appendChild(removeBtn);

    // Click item → mark as read.
    item.tabIndex = 0;
    const activate = () => notifications.markAsRead(n.id);
    item.addEventListener('click', activate);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });

    return item;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    previouslyFocused = document.activeElement;
    backdrop.hidden = false;
    document.body.appendChild(backdrop);
    render();
    closeBtn.focus();

    document.addEventListener('keydown', onKeydown);

    // Refresh on notification events (§29).
    const events = ['notification:received', 'notification:read', 'notification:removed', 'notification:cleared', 'notification:dismissed'];
    for (const evt of events) {
      const handler = () => { if (isOpen) render(); };
      eventBus.on(evt, handler);
      unsubscribers.push(() => eventBus.off(evt, handler));
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    backdrop.hidden = true;
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    document.removeEventListener('keydown', onKeydown);

    for (const unsub of unsubscribers) unsub();
    unsubscribers.length = 0;

    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function destroy() {
    close();
  }

  return { element: backdrop, open, close, toggle, destroy, isOpen: () => isOpen };
} 
