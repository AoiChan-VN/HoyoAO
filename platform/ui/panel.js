/**
 * Panel — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a collapsible content section.
 */

/**
 * @param {object} options
 * @param {string} [options.title='']
 * @param {HTMLElement|string|null} [options.content=null]
 * @param {boolean} [options.collapsible=false]
 * @param {boolean} [options.collapsed=false]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createPanel(options = {}) {
  const {
    title = '',
    content = null,
    collapsible = false,
    collapsed = false,
    signal = null,
  } = options;

  const panel = document.createElement('div');
  panel.className = 'ui-panel';

  const header = document.createElement('div');
  header.className = 'ui-panel__header';

  const titleEl = document.createElement('span');
  titleEl.className = 'ui-panel__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const body = document.createElement('div');
  body.className = 'ui-panel__body';
  if (typeof content === 'string') {
    body.textContent = content;
  } else if (content) {
    body.appendChild(content);
  }

  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  if (collapsible) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'ui-panel__toggle';
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    toggleBtn.textContent = collapsed ? '▸' : '▾';

    if (collapsed) {
      body.classList.add('ui-panel__body--collapsed');
    }

    toggleBtn.addEventListener('click', () => {
      const isCollapsed = body.classList.toggle('ui-panel__body--collapsed');
      toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
      toggleBtn.textContent = isCollapsed ? '▸' : '▾';
    }, { signal: combinedSignal });

    header.appendChild(toggleBtn);
  }

  panel.append(header, body);

  return {
    element: panel,
    destroy() {
      controller.abort();
    },
  };
} 
