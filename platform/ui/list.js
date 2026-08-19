/**
 * List — UI Primitive (§50)
 *
 * Visual/interaction responsibility: render a list of items through a
 * renderItem callback, with optional selection and an empty state.
 * Contains NO domain logic (§50). Accessible via role="list" and
 * keyboard-operable items when selectable (§38).
 */

export function createList(options = {}) {
  const {
    items = [],
    renderItem = null,      // (item) => Node | string
    itemKey = 'id',
    emptyMessage = 'No items',
    selectable = false,
    onSelect = null,
  } = options;

  let currentItems = Array.isArray(items) ? [...items] : [];
  let selectedKey = null;

  const list = document.createElement('ul');
  list.className = 'ui-list';
  list.setAttribute('role', 'list');

  function getKey(item) {
    return typeof itemKey === 'function' ? itemKey(item) : item?.[itemKey];
  }

  function render() {
    list.innerHTML = '';

    if (currentItems.length === 0) {
      const li = document.createElement('li');
      li.className = 'ui-list__empty';
      li.textContent = emptyMessage;
      list.appendChild(li);
      return;
    }

    for (const item of currentItems) {
      const li = document.createElement('li');
      li.className = 'ui-list__item';
      const key = getKey(item);
      li.dataset.key = String(key ?? '');

      if (selectable) {
        li.classList.add('is-selectable');
        li.tabIndex = 0;
        if (selectedKey === key) li.classList.add('is-selected');

        const activate = () => {
          selectedKey = key;
          // Update selection without full re-render (§95 DOM efficiency).
          list
            .querySelectorAll('.ui-list__item.is-selected')
            .forEach((el) => el.classList.remove('is-selected'));
          li.classList.add('is-selected');
          if (onSelect) onSelect(item, key);
        };

        li.addEventListener('click', activate);
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
          }
        });
      }

      if (typeof renderItem === 'function') {
        const node = renderItem(item);
        if (node instanceof Node) li.appendChild(node);
        else li.textContent = node == null ? '' : String(node);
      } else {
        li.textContent = String(item);
      }

      list.appendChild(li);
    }
  }

  function setItems(newItems) {
    currentItems = Array.isArray(newItems) ? [...newItems] : [];
    render();
  }

  function setSelected(key) {
    selectedKey = key;
    render();
  }

  function destroy() {
    list.innerHTML = '';
  }

  render();

  return { element: list, setItems, setSelected, destroy };
} 
