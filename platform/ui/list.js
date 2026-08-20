/**
 * List — UI Primitive (§50, §94)
 *
 * Visual/interaction responsibility: render a list of items through a
 * renderItem callback, with optional selection and OPTIONAL virtualization
 * for large datasets (§94 performance).
 */

const VISIBLE_BUFFER = 10;

export function createList(options = {}) {
  const {
    items = [],
    renderItem = null,
    itemKey = 'id',
    itemHeight = 56,
    emptyMessage = 'No items',
    selectable = false,
    onSelect = null,
    virtualize = false,
    containerHeight = null,
  } = options;

  let currentItems = Array.isArray(items) ? [...items] : [];
  let selectedKey = null;
  let scrollTop = 0;

  const itemH = Number.isFinite(itemHeight) && itemHeight > 0 ? itemHeight : 56;
  const viewportHeight = Number.isFinite(containerHeight) && containerHeight > 0
    ? containerHeight
    : 480;

  const list = document.createElement('ul');
  list.className = 'ui-list';
  list.setAttribute('role', 'list');
  if (virtualize) {
    list.classList.add('ui-list--virtual');
    list.style.height = `${viewportHeight}px`;
    list.style.overflowY = 'auto';
    list.addEventListener('scroll', () => {
      scrollTop = list.scrollTop;
      renderVirtual();
    });
  }

  function getKey(item) {
    return typeof itemKey === 'function' ? itemKey(item) : item?.[itemKey];
  }

  function buildItem(item) {
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

    return li;
  }

  function renderFull() {
    list.innerHTML = '';

    if (currentItems.length === 0) {
      const li = document.createElement('li');
      li.className = 'ui-list__empty';
      li.textContent = emptyMessage;
      list.appendChild(li);
      return;
    }

    for (const item of currentItems) {
      list.appendChild(buildItem(item));
    }
  }

  function renderVirtual() {
    const inner = list.querySelector('.ui-list__virtual-inner');
    if (!inner) return;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemH) - VISIBLE_BUFFER);
    const endIndex = Math.min(
      currentItems.length,
      Math.ceil((scrollTop + viewportHeight) / itemH) + VISIBLE_BUFFER,
    );

    inner.innerHTML = '';
    inner.style.paddingTop = `${startIndex * itemH}px`;

    for (let i = startIndex; i < endIndex; i++) {
      inner.appendChild(buildItem(currentItems[i]));
    }
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

    if (!virtualize) {
      renderFull();
      return;
    }

    // Virtualized: wrap + inner.
    const wrap = document.createElement('li');
    wrap.className = 'ui-list__virtual-wrap';
    wrap.setAttribute('role', 'presentation');
    wrap.style.listStyle = 'none';

    const inner = document.createElement('div');
    inner.className = 'ui-list__virtual-inner';
    inner.style.height = `${currentItems.length * itemH}px`;
    inner.style.position = 'relative';

    wrap.appendChild(inner);
    list.appendChild(wrap);
    renderVirtual();
  }

  function setItems(newItems) {
    currentItems = Array.isArray(newItems) ? [...newItems] : [];
    scrollTop = 0;
    if (list.scrollTop !== undefined) list.scrollTop = 0;
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
