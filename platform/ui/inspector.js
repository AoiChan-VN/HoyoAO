/**
 * Inspector — UI Primitive (§50, §16)
 *
 * Full-page or panel-level object inspector. Renders any JS value as a
 * collapsible key-value tree with type badges, copy support, and key
 * filtering. Used for detailed inspection of data objects (§16).
 *
 * Accessibility (§38): semantic structure, keyboard-operable collapse,
 * focus management, aria-expanded.
 *
 * API:
 *   const { element, setData, destroy } = createInspector({
 *     data: anyValue,
 *     title: 'Object Inspector',
 *     maxDepth: 6,
 *     filterable: true,
 *   });
 */

const TYPE_COLORS = {
  string: 'var(--color-success, #10b981)',
  number: 'var(--color-accent, #3b82f6)',
  boolean: 'var(--color-warning, #f59e0b)',
  object: 'var(--color-info, #06b6d4)',
  array: 'var(--color-info, #06b6d4)',
  null: 'var(--color-text-muted, #64748b)',
  undefined: 'var(--color-text-muted, #64748b)',
  function: 'var(--color-error, #ef4444)',
};

function typeOf(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function formatValue(value, type) {
  switch (type) {
    case 'string':
      return `"${value}"`;
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'function':
      return `ƒ ${value.name || 'anonymous'}()`;
    case 'object':
      return `{${Object.keys(value).length} keys}`;
    case 'array':
      return `[${value.length} items]`;
    default:
      return String(value);
  }
}

export function createInspector(options = {}) {
  const {
    data = null,
    title = 'Inspector',
    maxDepth = 6,
    filterable = true,
  } = options;

  let currentData = data;
  let filterQuery = '';

  const root = document.createElement('div');
  root.className = 'ui-inspector';

  // Header.
  const header = document.createElement('div');
  header.className = 'ui-inspector__header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'ui-inspector__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (filterable) {
    const filterInput = document.createElement('input');
    filterInput.type = 'search';
    filterInput.className = 'ui-inspector__filter';
    filterInput.placeholder = 'Filter keys…';
    filterInput.setAttribute('aria-label', 'Filter inspector keys');
    filterInput.addEventListener('input', () => {
      filterQuery = filterInput.value.trim().toLowerCase();
      renderTree();
    });
    header.appendChild(filterInput);
  }

  root.appendChild(header);

  // Tree container.
  const tree = document.createElement('div');
  tree.className = 'ui-inspector__tree';
  tree.setAttribute('role', 'tree');
  root.appendChild(tree);

  function matchesFilter(key) {
    if (!filterQuery) return true;
    return String(key).toLowerCase().includes(filterQuery);
  }

  function buildNode(key, value, depth) {
    const type = typeOf(value);
    const isExpandable = (type === 'object' || type === 'array') && depth < maxDepth;

    const node = document.createElement('div');
    node.className = 'ui-inspector__node';
    node.style.paddingLeft = `${depth * 16}px`;

    const row = document.createElement('div');
    row.className = 'ui-inspector__row';

    // Expand/collapse toggle.
    if (isExpandable) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'ui-inspector__toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '▸';
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        toggle.textContent = expanded ? '▸' : '▾';
        children.style.display = expanded ? 'none' : 'block';
      });
      row.appendChild(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'ui-inspector__toggle-spacer';
      row.appendChild(spacer);
    }

    // Key.
    const keyEl = document.createElement('span');
    keyEl.className = 'ui-inspector__key';
    keyEl.textContent = key;
    row.appendChild(keyEl);

    // Type badge.
    const typeBadge = document.createElement('span');
    typeBadge.className = 'ui-inspector__type';
    typeBadge.style.color = TYPE_COLORS[type] || 'inherit';
    typeBadge.textContent = type;
    row.appendChild(typeBadge);

    // Value preview.
    const valueEl = document.createElement('span');
    valueEl.className = 'ui-inspector__value';
    valueEl.textContent = formatValue(value, type);
    row.appendChild(valueEl);

    // Copy button.
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ui-inspector__copy';
    copyBtn.setAttribute('aria-label', `Copy value of ${key}`);
    copyBtn.textContent = '⧉';
    copyBtn.addEventListener('click', () => {
      try {
        const text = type === 'object' || type === 'array'
          ? JSON.stringify(value, null, 2)
          : String(value);
        navigator.clipboard.writeText(text);
        copyBtn.textContent = '✓';
        setTimeout(() => { copyBtn.textContent = '⧉'; }, 1200);
      } catch {
        // Clipboard unavailable; ignore gracefully (§75).
      }
    });
    row.appendChild(copyBtn);

    node.appendChild(row);

    // Children.
    const children = document.createElement('div');
    children.className = 'ui-inspector__children';
    children.style.display = 'none';

    if (isExpandable) {
      const entries = type === 'array'
        ? value.map((v, i) => [i, v])
        : Object.entries(value);

      for (const [childKey, childValue] of entries) {
        if (!matchesFilter(childKey)) continue;
        children.appendChild(buildNode(childKey, childValue, depth + 1));
      }
    }

    node.appendChild(children);
    return node;
  }

  function renderTree() {
    tree.innerHTML = '';

    if (currentData === null || currentData === undefined) {
      const empty = document.createElement('div');
      empty.className = 'ui-inspector__empty';
      empty.textContent = 'No data to inspect.';
      tree.appendChild(empty);
      return;
    }

    const type = typeOf(currentData);
    if (type === 'object' || type === 'array') {
      const entries = type === 'array'
        ? currentData.map((v, i) => [i, v])
        : Object.entries(currentData);

      for (const [key, value] of entries) {
        if (!matchesFilter(key)) continue;
        tree.appendChild(buildNode(key, value, 0));
      }
    } else {
      tree.appendChild(buildNode('value', currentData, 0));
    }
  }

  function setData(newData) {
    currentData = newData;
    renderTree();
  }

  function destroy() {
    tree.innerHTML = '';
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  renderTree();

  return { element: root, setData, destroy };
} 
