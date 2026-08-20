/**
 * Table — UI Primitive (§50, §94)
 *
 * Visual/interaction responsibility: render tabular data with optional
 * column sorting, row interaction, and OPTIONAL virtualization for large
 * datasets (§94 performance).
 *
 * When `virtualize: true`, only visible rows (+buffer) are rendered in the
 * DOM; scroll is intercepted and re-renders on demand. Suitable for 1,000+
 * rows without DOM bloat.
 *
 * Accessibility (§38): semantic <table>, <th scope>, aria-sort, keyboard
 * sort/row activation.
 */

const VISIBLE_BUFFER = 8;

export function createTable(options = {}) {
  const {
    columns = [],
    rows = [],
    rowKey = 'id',
    rowHeight = 44,
    emptyMessage = 'No data',
    sortable = false,
    onRowClick = null,
    virtualize = false,
    containerHeight = null,
  } = options;

  let currentRows = Array.isArray(rows) ? [...rows] : [];
  let sortState = { key: null, direction: 'asc' };
  let scrollTop = 0;
  const rowH = Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 44;
  const viewportHeight = Number.isFinite(containerHeight) && containerHeight > 0
    ? containerHeight
    : 480;

  const wrapper = document.createElement('div');
  wrapper.className = 'ui-table-wrapper';

  const table = document.createElement('table');
  table.className = 'ui-table';

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);
  wrapper.appendChild(table);

  function getKey(row) {
    return typeof rowKey === 'function' ? rowKey(row) : row?.[rowKey];
  }

  function renderHead() {
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    for (const col of columns) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = 'ui-table__th';
      if (col.align) th.dataset.align = col.align;

      const isSortable = sortable && col.sortable !== false;

      if (isSortable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ui-table__sort-btn';
        btn.textContent = col.label;

        if (sortState.key === col.key) {
          const dir = sortState.direction;
          th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
          btn.classList.add(dir === 'asc' ? 'is-asc' : 'is-desc');
        }

        btn.addEventListener('click', () => {
          if (sortState.key === col.key) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
          } else {
            sortState.key = col.key;
            sortState.direction = 'asc';
          }
          renderHead();
          renderBody();
        });

        th.appendChild(btn);
      } else {
        th.textContent = col.label;
      }

      tr.appendChild(th);
    }

    thead.appendChild(tr);
  }

  function sortedRows() {
    if (!sortState.key) return currentRows;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...currentRows].sort((a, b) => {
      const av = a?.[sortState.key];
      const bv = b?.[sortState.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  function buildRow(row) {
    const tr = document.createElement('tr');
    tr.className = 'ui-table__row';
    tr.dataset.key = String(getKey(row) ?? '');

    if (onRowClick) {
      tr.classList.add('is-clickable');
      tr.tabIndex = 0;
      const activate = () => onRowClick(row);
      tr.addEventListener('click', activate);
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    }

    for (const col of columns) {
      const td = document.createElement('td');
      td.className = 'ui-table__td';
      if (col.align) td.dataset.align = col.align;

      const value = row?.[col.key];
      if (typeof col.render === 'function') {
        const node = col.render(value, row);
        if (node instanceof Node) td.appendChild(node);
        else td.textContent = node == null ? '' : String(node);
      } else {
        td.textContent = value == null ? '' : String(value);
      }

      tr.appendChild(td);
    }

    return tr;
  }

  function renderBody() {
    tbody.innerHTML = '';
    const data = sortedRows();

    if (data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.className = 'ui-table__empty';
      td.colSpan = columns.length || 1;
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // Non-virtualized: render everything (default).
    if (!virtualize) {
      for (const row of data) tbody.appendChild(buildRow(row));
      return;
    }

    // Virtualized: scroll container with spacer.
    const totalHeight = data.length * rowH;

    const topSpacer = document.createElement('tr');
    topSpacer.className = 'ui-table__spacer';
    const topTd = document.createElement('td');
    topTd.colSpan = columns.length || 1;
    topTd.style.height = '0';
    topTd.style.padding = '0';
    topTd.style.border = 'none';
    topSpacer.appendChild(topTd);
    tbody.appendChild(topSpacer);

    const rowsToRender = [];
    const startIndex = Math.max(0, Math.floor(scrollTop / rowH) - VISIBLE_BUFFER);
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + viewportHeight) / rowH) + VISIBLE_BUFFER,
    );

    for (let i = startIndex; i < endIndex; i++) {
      rowsToRender.push({ row: data[i], offset: (i - startIndex) * rowH });
    }

    // Use a transform-based positioning within the table body via a wrapper.
    const virtualWrap = document.createElement('tr');
    virtualWrap.className = 'ui-table__virtual-wrap';
    const virtualTd = document.createElement('td');
    virtualTd.colSpan = columns.length || 1;
    virtualTd.style.padding = '0';
    virtualTd.style.border = 'none';

    const inner = document.createElement('div');
    inner.className = 'ui-table__virtual-inner';
    inner.style.height = `${totalHeight}px`;
    inner.style.position = 'relative';

    const content = document.createElement('div');
    content.className = 'ui-table__virtual-content';
    content.style.position = 'absolute';
    content.style.top = `${startIndex * rowH}px`;
    content.style.left = '0';
    content.style.right = '0';

    for (const { row } of rowsToRender) {
      const tr = buildRow(row);
      tr.style.display = 'table';
      tr.style.width = '100%';
      tr.style.tableLayout = 'fixed';
      content.appendChild(tr);
    }

    inner.appendChild(content);
    virtualTd.appendChild(inner);
    virtualWrap.appendChild(virtualTd);
    tbody.appendChild(virtualWrap);

    const bottomSpacer = document.createElement('tr');
    bottomSpacer.className = 'ui-table__spacer';
    const bottomTd = document.createElement('td');
    bottomTd.colSpan = columns.length || 1;
    bottomTd.style.height = '0';
    bottomTd.style.padding = '0';
    bottomTd.style.border = 'none';
    bottomSpacer.appendChild(bottomTd);
    tbody.appendChild(bottomSpacer);
  }

  function setRows(newRows) {
    currentRows = Array.isArray(newRows) ? [...newRows] : [];
    scrollTop = 0;
    renderBody();
  }

  function setScrollTop(top) {
    scrollTop = Math.max(0, top);
    if (virtualize) renderBody();
  }

  function destroy() {
    wrapper.innerHTML = '';
  }

  renderHead();
  renderBody();

  return { element: wrapper, setRows, setScrollTop, destroy };
}
