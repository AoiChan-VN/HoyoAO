/**
 * Status — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a status indicator with dot + label.
 */

/**
 * @param {object} options
 * @param {'online'|'offline'|'error'|'pending'|'unknown'} options.state
 * @param {string} [options.label='']
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createStatus(options = {}) {
  const { state = 'unknown', label = '' } = options;

  const status = document.createElement('span');
  status.className = `ui-status ui-status--${state}`;

  const dot = document.createElement('span');
  dot.className = 'ui-status__dot';
  dot.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'ui-status__label';
  text.textContent = label || state;

  status.append(dot, text);

  return {
    element: status,
    destroy() { /* stateless */ },
  };
} 
