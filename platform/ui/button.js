/**
 * Button — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a clickable action element.
 * No domain logic. No hardcoded text. No hardcoded icons (§20, §37).
 */

/**
 * @param {object} options
 * @param {string} options.label - Button text (caller localizes)
 * @param {'primary'|'secondary'|'ghost'|'danger'} [options.variant='primary']
 * @param {'sm'|'md'|'lg'} [options.size='md']
 * @param {boolean} [options.disabled=false]
 * @param {HTMLElement|null} [options.icon=null] - Optional icon element
 * @param {Function|null} [options.onClick=null]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLButtonElement, destroy: Function }}
 */
export function createButton(options = {}) {
  const {
    label = '',
    variant = 'primary',
    size = 'md',
    disabled = false,
    icon = null,
    onClick = null,
    signal = null,
  } = options;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `ui-button ui-button--${variant} ui-button--${size}`;
  button.disabled = disabled;

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'ui-button__icon';
    iconSpan.appendChild(icon);
    button.appendChild(iconSpan);
  }

  const labelSpan = document.createElement('span');
  labelSpan.className = 'ui-button__label';
  labelSpan.textContent = label;
  button.appendChild(labelSpan);

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
