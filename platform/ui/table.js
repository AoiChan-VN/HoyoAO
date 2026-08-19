/**
 * Table — UI Primitive (§50)
 *
 * Visual/interaction responsibility: render tabular data with optional
 * column sorting and row interaction. Contains NO domain logic (§50).
 *
 * Accessibility (§38): semantic <table>, <th scope="col">, aria-sort on
 * sorted columns, keyboard-operable sort buttons and rows.
 *
 * Performance (§94): for very large datasets consumers should paginate or
 * virtualize; this primitive renders the provided row set directly.
 */

export function createTable(options = {}) {
  const {
    columns = [],        // [{ key, label, render?, align?, sortable? }]
    rows = [],
    rowKey = 'id',
    emptyMessage = 'No data',
    sortable = false,
    onRowClick = null,
  } = options;

  let currentRows = Array.isArray(rows) ? [...rows] : [];
  let sortState = { key: null, direction: 'asc' };

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

  function renderBody() {
    tbody.innerHTML = '';
    const rowsToRender = sortedRows();

    if (rowsToRender.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.className = 'ui-table__empty';
      td.colSpan = columns.length || 1;
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (const row of rowsToRender) {
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

      tbody.appendChild(tr);
    }
  }

  function setRows(newRows) {
    currentRows = Array.isArray(newRows) ? [...newRows] : [];
    renderBody();
  }

  function destroy() {
    wrapper.innerHTML = '';
  }

  renderHead();
  renderBody();

  return { element: wrapper, setRows, destroy };
} 
