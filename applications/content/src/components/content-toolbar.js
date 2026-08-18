/**
 * ContentToolbar — search + category filter + type filter (§17).
 * Answers: "What am I searching or filtering for?"
 * Categories are provided by the controller (derived from data, §8).
 */

import { createInput } from '../../../../platform/ui/input.js';
import { createSelect } from '../../../../platform/ui/select.js';

const TYPE_OPTIONS = ['article', 'image', 'file', 'document', 'media'];

export function createContentToolbar(options = {}) {
  const { localization, categories = [], onFilterChange } = options;

  const bar = document.createElement('div');
  bar.className = 'content__toolbar';

  function emit(patch) {
    if (onFilterChange) onFilterChange(patch);
  }

  // Search
  const search = createInput({
    label: localization.t('content.search.label'),
    type: 'search',
    placeholder: localization.t('content.search.placeholder'),
    onChange: (value) => emit({ search: value }),
  });
  const searchWrap = document.createElement('div');
  searchWrap.className = 'content__toolbar-search';
  searchWrap.appendChild(search.element);

  // Category filter (derived from real data)
  const categoryOptions = [
    { value: 'all', label: localization.t('content.filter.allCategories') },
    ...categories.map((c) => ({ value: c, label: c })),
  ];
  const categorySelect = createSelect({
    label: localization.t('content.filter.category'),
    options: categoryOptions,
    value: 'all',
    onChange: (value) => emit({ category: value }),
  });

  // Type filter
  const typeOptions = [
    { value: 'all', label: localization.t('content.filter.allTypes') },
    ...TYPE_OPTIONS.map((t) => ({
      value: t,
      label: localization.t(`content.type.${t}`),
    })),
  ];
  const typeSelect = createSelect({
    label: localization.t('content.filter.type'),
    options: typeOptions,
    value: 'all',
    onChange: (value) => emit({ type: value }),
  });

  const filtersWrap = document.createElement('div');
  filtersWrap.className = 'content__toolbar-filters';
  filtersWrap.append(categorySelect.element, typeSelect.element);

  bar.append(searchWrap, filtersWrap);

  function destroy() {
    search.destroy();
    categorySelect.destroy();
    typeSelect.destroy();
    bar.innerHTML = '';
  }

  return { element: bar, destroy };
} 
