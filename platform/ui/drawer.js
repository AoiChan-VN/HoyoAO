/**
 * Drawer — UI Primitive (§50, §97)
 *
 * Visual/interaction responsibility: a side panel for detail
 * inspection or content that doesn't warrant a full page.
 * §97: Use Drawer for detailed inspection, not confirmation.
 */

/**
 * @param {object} options
 * @param {string} options.title
 * @param {HTMLElement|string} options.content
 * @param {'left'|'right'} [options.side='right']
 * @param {boolean} [options.closable=true]
 * @param {Function|null} [options.onClose=null]
 * @returns {{ element: HTMLElement, open: Function, close: Function, destroy: Function }}
 */
export function createDrawer(options = {}) {
  const {
    title = '',
    content = null,
    side = 'right',
    closable = true,
    onClose = null,
  } = options;

  const controller = new AbortController();
  const { signal } = controller;

  const backdrop = document.createElement('div');
  backdrop.className = 'ui-drawer__backdrop';
  backdrop.hidden = true;

  const drawer = document.createElement('div');
  drawer.className = `ui-drawer ui-drawer--${side}`;
  drawer.setAttribute('role', 'complementary');
  drawer.setAttribute('aria-label', title);

  /* Header */
  const header = document.createElement('div');
  header.className = 'ui-drawer__header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'ui-drawer__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (closable) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ui-drawer__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', close, { signal });
    header.appendChild(closeBtn);
  }

  /* Body */
  const body = document.createElement('div');
  body.className = 'ui-drawer__body';
  if (typeof content === 'string') {
    body.textContent = content;
  } else if (content) {
    body.appendChild(content);
  }

  drawer.append(header, body);
  backdrop.appendChild(drawer);

  /* ESC close (§38) */
  function onKeyDown(e) {
    if (e.key === 'Escape' && closable) {
      close();
    }
  }

  function open() {
    backdrop.hidden = false;
    document.body.appendChild(backdrop);
    document.addEventListener('keydown', onKeyDown, { signal });

    requestAnimationFrame(() => {
      drawer.classList.add('ui-drawer--open');
    });
  }

  function close() {
    drawer.classList.remove('ui-drawer--open');
    document.removeEventListener('keydown', onKeyDown);

    // Wait for transition before removing
    setTimeout(() => {
      backdrop.hidden = true;
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }, 250);

    if (onClose) onClose();
  }

  if (closable) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    }, { signal });
  }

  return {
    element: backdrop,
    open,
    close,
    destroy() {
      controller.abort();
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    },
  };
} 
