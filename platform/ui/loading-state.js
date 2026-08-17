/**
 * LoadingState — UI Primitive (§50, §76)
 *
 * Visual/interaction responsibility: indicates async work in progress.
 * Supports spinner and skeleton variants.
 */

/**
 * @param {object} options
 * @param {string} [options.label='']
 * @param {'spinner'|'skeleton'} [options.variant='spinner']
 * @param {number} [options.skeletonRows=3]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createLoadingState(options = {}) {
  const {
    label = '',
    variant = 'spinner',
    skeletonRows = 3,
  } = options;

  const container = document.createElement('div');
  container.className = `ui-loading-state ui-loading-state--${variant}`;
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  if (variant === 'spinner') {
    const spinner = document.createElement('div');
    spinner.className = 'ui-loading-state__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    container.appendChild(spinner);

    if (label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'ui-loading-state__label';
      labelEl.textContent = label;
      container.appendChild(labelEl);
    }
  } else {
    for (let i = 0; i < skeletonRows; i++) {
      const row = document.createElement('div');
      row.className = 'ui-loading-state__skeleton-row';
      row.setAttribute('aria-hidden', 'true');
      container.appendChild(row);
    }
  }

  return {
    element: container,
    destroy() { /* stateless */ },
  };
} 
