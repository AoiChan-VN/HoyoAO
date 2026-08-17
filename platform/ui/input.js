/**
 * Input — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a labeled text input field.
 * Uses semantic <label> + <input> for accessibility (§38).
 */

let inputIdCounter = 0;

/**
 * @param {object} options
 * @param {string} options.label
 * @param {'text'|'number'|'password'|'email'|'search'} [options.type='text']
 * @param {string} [options.placeholder='']
 * @param {string} [options.value='']
 * @param {boolean} [options.disabled=false]
 * @param {Function|null} [options.onChange=null]
 * @param {AbortSignal|null} [options.signal=null]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createInput(options = {}) {
  const {
    label = '',
    type = 'text',
    placeholder = '',
    value = '',
    disabled = false,
    onChange = null,
    signal = null,
  } = options;

  const id = `ui-input-${++inputIdCounter}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'ui-input';

  const labelEl = document.createElement('label');
  labelEl.className = 'ui-input__label';
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  wrapper.appendChild(labelEl);

  const input = document.createElement('input');
  input.id = id;
  input.className = 'ui-input__field';
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.disabled = disabled;
  wrapper.appendChild(input);

  const controller = new AbortController();
  const combinedSignal = signal || controller.signal;

  if (onChange) {
    input.addEventListener('input', (e) => onChange(e.target.value), { signal: combinedSignal });
  }

  return {
    element: wrapper,
    destroy() {
      controller.abort();
    },
  };
} 
