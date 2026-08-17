/**
 * Toggle — UI Primitive (§50)
 *
 * Visual/interaction responsibility: an on/off switch.
 * Uses role="switch" + keyboard support (Space/Enter) (§38).
 */

let toggleIdCounter = 0;

/**
 * @param {object} options
 * @param {string} options.label
 * @param {boolean} [options.checked=false]
 * @param {boolean} [options.disabled=false]
 * @param {Function|null} [options.onChange=null]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createToggle(options = {}) {
  const {
    label = '',
    checked = false,
    disabled = false,
    onChange = null,
    signal = null,
  } = options;

  const id = `ui-toggle-${++toggleIdCounter}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'ui-toggle';

  const switchEl = document.createElement('button');
  switchEl.type = 'button';
  switchEl.id = id;
  switchEl.className = 'ui-toggle__switch';
  switchEl.setAttribute('role', 'switch');
  switchEl.setAttribute('aria-checked', String(checked));
  switchEl.disabled = disabled;

  if (checked) {
    switchEl.classList.add('ui-toggle__switch--on');
  }

  const track = document.createElement('span');
  track.className = 'ui-toggle__track';
  const thumb = document.createElement('span');
  thumb.className = 'ui-toggle__thumb';
  track.appendChild(thumb);
  switchEl.appendChild(track);

  const labelEl = document.createElement('label');
  labelEl.className = 'ui-toggle__label';
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  switchEl.addEventListener('click', () => {
    const isOn = switchEl.classList.toggle('ui-toggle__switch--on');
    switchEl.setAttribute('aria-checked', String(isOn));
    if (onChange) onChange(isOn);
  }, { signal: combinedSignal });

  wrapper.append(switchEl, labelEl);

  return {
    element: wrapper,
    destroy() {
      controller.abort();
    },
  };
} 
