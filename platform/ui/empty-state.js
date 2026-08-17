/**
 * EmptyState — UI Primitive (§50, §98)
 *
 * Visual/interaction responsibility: explains an empty dataset.
 * §98: Do not show fake statistics. Explain what is empty,
 * why, and what action can populate it.
 */

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.description='']
 * @param {HTMLElement|null} [options.icon=null]
 * @param {HTMLElement|null} [options.action=null] - e.g. a Button element
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createEmptyState(options = {}) {
  const {
    title = '',
    description = '',
    icon = null,
    action = null,
  } = options;

  const container = document.createElement('div');
  container.className = 'ui-empty-state';
  container.setAttribute('role', 'status');

  if (icon) {
    const iconWrap = document.createElement('div');
    iconWrap.className = 'ui-empty-state__icon';
    iconWrap.appendChild(icon);
    container.appendChild(iconWrap);
  }

  const titleEl = document.createElement('h3');
  titleEl.className = 'ui-empty-state__title';
  titleEl.textContent = title;
  container.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'ui-empty-state__description';
    descEl.textContent = description;
    container.appendChild(descEl);
  }

  if (action) {
    const actionWrap = document.createElement('div');
    actionWrap.className = 'ui-empty-state__action';
    actionWrap.appendChild(action);
    container.appendChild(actionWrap);
  }

  return {
    element: container,
    destroy() { /* stateless */ },
  };
} 
