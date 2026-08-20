/**
 * Global Search (§87, §19, §64)
 *
 * Shell-level search over the OS SearchService. Triggered by clicking the
 * search icon in the Shell header or pressing Cmd/Ctrl+K. Results are
 * grouped by source (resources, applications, …) and navigating to an item
 * emits a navigation event.
 *
 * Accessibility (§38): role=dialog, Escape closes, focus auto on input,
 * ArrowUp/Down keyboard navigation, Enter to activate.
 *
 * Cleanup (§74): listeners + keyboard shortcut are removed on destroy().
 */
export class GlobalSearch {
  #searchService;
  #eventBus;
  #localization;
  #icons;

  #container = null;
  #input = null;
  #results = null;
  #counter = null;
  #debounceTimer = null;
  #selectedIdx = -1;
  #lastResults = [];

  #onKeydownGlobal = null;
  #onKeydownDialog = null;

  constructor({ searchService, eventBus, localization, icons }) {
    this.#searchService = searchService;
    this.#eventBus = eventBus;
    this.#localization = localization;
    this.#icons = icons;
  }

  /**
   * Build the DOM. Call mount(container) to insert into the Shell header.
   */
  buildButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-shell__search-btn';
    btn.setAttribute('aria-label', this.#localization.t('search.open'));

    if (this.#icons) {
      const icon = this.#icons.resolve('search');
      icon.classList.add('ui-icon--sm');
      btn.appendChild(icon);
    }

    const hint = document.createElement('kbd');
    hint.className = 'os-shell__search-hint';
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    hint.textContent = isMac ? '⌘K' : 'Ctrl+K';
    btn.appendChild(hint);

    btn.addEventListener('click', () => this.open());
    return btn;
  }

  buildDialog() {
    this.#container = document.createElement('div');
    this.#container.className = 'global-search__backdrop';
    this.#container.setAttribute('role', 'dialog');
    this.#container.setAttribute('aria-modal', 'true');
    this.#container.setAttribute('aria-label', this.#localization.t('search.title'));
    this.#container.hidden = true;

    const panel = document.createElement('div');
    panel.className = 'global-search__panel';

    const header = document.createElement('div');
    header.className = 'global-search__header';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'global-search__input-wrap';

    if (this.#icons) {
      const icon = this.#icons.resolve('search');
      icon.classList.add('ui-icon--sm', 'global-search__input-icon');
      inputWrap.appendChild(icon);
    }

    this.#input = document.createElement('input');
    this.#input.type = 'search';
    this.#input.className = 'global-search__input';
    this.#input.placeholder = this.#localization.t('search.placeholder');
    this.#input.setAttribute('aria-label', this.#localization.t('search.label'));
    this.#input.autocomplete = 'off';
    this.#input.spellcheck = false;

    this.#counter = document.createElement('span');
    this.#counter.className = 'global-search__counter';
    this.#counter.setAttribute('aria-live', 'polite');

    inputWrap.append(this.#input, this.#counter);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'global-search__close';
    closeBtn.setAttribute('aria-label', this.#localization.t('search.close'));
    closeBtn.textContent = 'Esc';
    closeBtn.addEventListener('click', () => this.close());

    header.append(inputWrap, closeBtn);

    this.#results = document.createElement('div');
    this.#results.className = 'global-search__results';
    this.#results.setAttribute('role', 'listbox');

    panel.append(header, this.#results);
    this.#container.appendChild(panel);

    // Events.
    this.#input.addEventListener('input', () => this.#onInput());
    this.#onKeydownDialog = (e) => this.#handleDialogKeydown(e);
    this.#input.addEventListener('keydown', this.#onKeydownDialog);

    this.#container.addEventListener('click', (e) => {
      if (e.target === this.#container) this.close();
    });

    return this.#container;
  }

  open() {
    if (!this.#container) return;
    this.#container.hidden = false;
    document.body.appendChild(this.#container);
    this.#input.value = '';
    this.#counter.textContent = '';
    this.#lastResults = [];
    this.#selectedIdx = -1;
    this.#results.innerHTML = '';

    // Global keyboard shortcut.
    this.#onKeydownGlobal = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this.#onKeydownGlobal);

    requestAnimationFrame(() => this.#input.focus());
  }

  close() {
    if (!this.#container) return;
    this.#container.hidden = true;
    if (this.#container.parentNode) this.#container.parentNode.removeChild(this.#container);
    if (this.#onKeydownGlobal) {
      document.removeEventListener('keydown', this.#onKeydownGlobal);
      this.#onKeydownGlobal = null;
    }
    this.#stopDebounce();
  }

  destroy() {
    this.close();
    if (this.#onKeydownDialog && this.#input) {
      this.#input.removeEventListener('keydown', this.#onKeydownDialog);
    }
    this.#stopDebounce();
  }

  /* ---- private ---- */

  #stopDebounce() {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }

  #onInput() {
    this.#stopDebounce();
    const value = this.#input.value.trim();
    if (!value) {
      this.#renderEmpty();
      return;
    }
    this.#debounceTimer = setTimeout(() => this.#runSearch(value), 150);
  }

  #runSearch(query) {
    if (!this.#searchService) {
      this.#renderEmpty();
      return;
    }
    const results = this.#searchService.query(query, { limit: 50 });
    this.#lastResults = results;
    this.#selectedIdx = -1;
    this.#counter.textContent = this.#localization.t('search.count', {
      count: results.length,
    });
    this.#renderResults(results);
  }

  #renderEmpty() {
    this.#lastResults = [];
    this.#results.innerHTML = '';
    this.#counter.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'global-search__empty';
    empty.textContent = this.#localization.t('search.empty');
    this.#results.appendChild(empty);
  }

  #renderResults(results) {
    this.#results.innerHTML = '';

    if (results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'global-search__empty';
      empty.textContent = this.#localization.t('search.noResults');
      this.#results.appendChild(empty);
      return;
    }

    // Group by source for clear presentation (§19 discoverability).
    const grouped = new Map();
    for (const r of results) {
      if (!grouped.has(r.source)) grouped.set(r.source, []);
      grouped.get(r.source).push(r);
    }

    let flatIndex = 0;
    for (const [source, items] of grouped) {
      const group = document.createElement('div');
      group.className = 'global-search__group';

      const heading = document.createElement('div');
      heading.className = 'global-search__group-title';
      heading.textContent = source.charAt(0).toUpperCase() + source.slice(1);
      group.appendChild(heading);

      for (const item of items) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'global-search__row';
        row.setAttribute('role', 'option');
        row.dataset.index = String(flatIndex++);

        if (this.#icons) {
          const icon = this.#icons.resolve(this.#iconFor(item.type));
          icon.classList.add('ui-icon--sm', 'global-search__row-icon');
          row.appendChild(icon);
        }

        const body = document.createElement('div');
        body.className = 'global-search__row-body';

        const title = document.createElement('div');
        title.className = 'global-search__row-title';
        title.textContent = item.title;

        const meta = document.createElement('div');
        meta.className = 'global-search__row-meta';
        meta.textContent = item.body || item.route || '';

        body.append(title, meta);
        row.appendChild(body);

        const score = document.createElement('span');
        score.className = 'global-search__row-score';
        score.textContent = `+${item.score}`;
        row.appendChild(score);

        row.addEventListener('click', () => this.#activate(item));
        row.addEventListener('mouseenter', () => {
          this.#setSelected(Number(row.dataset.index));
        });

        group.appendChild(row);
      }

      this.#results.appendChild(group);
    }
  }

  #iconFor(type) {
    switch (type) {
      case 'application': return 'app';
      case 'theme': return 'settings';
      default: return 'info';
    }
  }

  #setSelected(index) {
    if (index < 0 || index >= this.#lastResults.length) return;
    this.#selectedIdx = index;
    const rows = this.#results.querySelectorAll('.global-search__row');
    rows.forEach((r, i) => r.classList.toggle('is-selected', i === index));
    if (rows[index]) rows[index].scrollIntoView({ block: 'nearest' });
  }

  #handleDialogKeydown(e) {
    const total = this.#lastResults.length;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (total > 0) this.#setSelected(Math.min(total - 1, this.#selectedIdx + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (total > 0) this.#setSelected(Math.max(0, this.#selectedIdx - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.#selectedIdx >= 0 && this.#lastResults[this.#selectedIdx]) {
        this.#activate(this.#lastResults[this.#selectedIdx]);
      }
    }
  }

  #activate(item) {
    if (item.route) {
      this.#eventBus.emit('navigation:selected', { path: item.route });
    }
    this.close();
  }
} 
