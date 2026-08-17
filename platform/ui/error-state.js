/**
 * ErrorState — UI Primitive (§50, §76)
 *
 * Visual/interaction responsibility: displays an error with
 * optional retry action. User receives understandable error state (§46).
 */

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.description='']
 * @param {HTMLElement|null} [options.retryAction=null] - e.g. a Button element
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createErrorState(options = {}) {
  const {
    title = '',
    description = '',
    retryAction = null,
  } = options;

  const container = document.createElement('div');
  container.className = 'ui-error-state';
  container.setAttribute('role', 'alert');

  const titleEl = document.createElement('h3');
  titleEl.className = 'ui-error-state__title';
  titleEl.textContent = title;
  container.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'ui-error-state__description';
    descEl.textContent = description;
    container.appendChild(descEl);
  }

  if (retryAction) {
    const actionWrap = document.createElement('div');
    actionWrap.className = 'ui-error-state__action';
    actionWrap.appendChild(retryAction);
    container.appendChild(actionWrap);
  }

  return {
    element: container,
    destroy() { /* stateless */ },
  };
} 
