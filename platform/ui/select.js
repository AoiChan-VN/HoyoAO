/**
 * Select — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a labeled dropdown select.
 * Uses semantic <label> + <select> for accessibility (§38).
 */

let selectIdCounter = 0;

/**
 * @param {object} options
 * @param {string} options.label
 * @param {Array<{value: string, label: string}>} options.options
 * @param {string} [options.value='']
 * @param {boolean} [options.disabled=false]
 * @param {Function|null} [options.onChange=null]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createSelect(options = {}) {
  const {
    label = '',
    options: selectOptions = [],
    value = '',
    disabled = false,
    onChange = null,
    signal = null,
  } = options;

  const id = `ui-select-${++selectIdCounter}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'ui-select';

  const labelEl = document.createElement('label');
  labelEl.className = 'ui-select__label';
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  wrapper.appendChild(labelEl);

  const select = document.createElement('select');
  select.id = id;
  select.className = 'ui-select__field';
  select.disabled = disabled;

  for (const opt of selectOptions) {
    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    if (opt.value === value) optionEl.selected = true;
    select.appendChild(optionEl);
  }

  wrapper.appendChild(select);

  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  if (onChange) {
    select.addEventListener('change', (e) => onChange(e.target.value), { signal: combinedSignal });
  }

  return {
    element: wrapper,
    destroy() {
      controller.abort();
    },
  };
} 
