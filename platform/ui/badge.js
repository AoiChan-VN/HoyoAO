/**
 * Badge — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a small label indicating
 * category, state, or count.
 */

/**
 * @param {object} options
 * @param {string} options.label
 * @param {'info'|'success'|'warning'|'error'|'neutral'} [options.variant='neutral']
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createBadge(options = {}) {
  const { label = '', variant = 'neutral' } = options;

  const badge = document.createElement('span');
  badge.className = `ui-badge ui-badge--${variant}`;
  badge.textContent = label;

  return {
    element: badge,
    destroy() { /* stateless */ },
  };
} 
