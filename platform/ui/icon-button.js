/**
 * IconButton — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a compact icon-only action.
 * Requires aria-label for accessibility (§38).
 */

/**
 * @param {object} options
 * @param {HTMLElement} options.icon - Required icon element
 * @param {string} options.label - Required aria-label (a11y)
 * @param {'primary'|'secondary'|'ghost'|'danger'} [options.variant='ghost']
 * @param {'sm'|'md'|'lg'} [options.size='md']
 * @param {boolean} [options.disabled=false]
 * @param {Function|null} [options.onClick=null]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLButtonElement, destroy: Function }}
 */
export function createIconButton(options = {}) {
  const {
    icon = null,
    label = '',
    variant = 'ghost',
    size = 'md',
    disabled = false,
    onClick = null,
    signal = null,
  } = options;

  if (!label) {
    throw new Error('createIconButton: "label" (aria-label) is required for accessibility (§38)');
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `ui-icon-button ui-icon-button--${variant} ui-icon-button--${size}`;
  button.disabled = disabled;
  button.setAttribute('aria-label', label);

  if (icon) {
    button.appendChild(icon);
  }

  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  if (onClick) {
    button.addEventListener('click', onClick, { signal: combinedSignal });
  }

  return {
    element: button,
    destroy() {
      controller.abort();
    },
  };
} 
