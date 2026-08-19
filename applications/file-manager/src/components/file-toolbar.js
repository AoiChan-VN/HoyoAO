/**
 * FileToolbar — search + category filter (§17).
 * Answers: "What am I searching or filtering for?"
 * Categories are provided by the controller (derived from data, §8).
 */

import { createInput } from '../../../../platform/ui/input.js';
import { createSelect } from '../../../../platform/ui/select.js';

export function createFileToolbar(options = {}) {
  const { localization, categories = [], onFilterChange } = options;

  const bar = document.createElement('div');
  bar.className = 'file-manager__toolbar';

  function emit(patch) {
    if (onFilterChange) onFilterChange(patch);
  }

  // Search by name
  const search = createInput({
    label: localization.t('fileManager.search.label'),
    type: 'search',
    placeholder: localization.t('fileManager.search.placeholder'),
    onChange: (value) => emit({ search: value }),
  });
  const searchWrap = document.createElement('div');
  searchWrap.className = 'file-manager__toolbar-search';
  searchWrap.appendChild(search.element);

  // Category filter (derived from real data)
  const categoryOptions = [
    { value: 'all', label: localization.t('fileManager.filter.allCategories') },
    ...categories.map((c) => ({
      value: c,
      label: localization.t(`fileManager.category.${c}`) || c,
    })),
  ];
  const categorySelect = createSelect({
    label: localization.t('fileManager.filter.category'),
    options: categoryOptions,
    value: 'all',
    onChange: (value) => emit({ category: value }),
  });

  const filtersWrap = document.createElement('div');
  filtersWrap.className = 'file-manager__toolbar-filters';
  filtersWrap.appendChild(categorySelect.element);

  bar.append(searchWrap, filtersWrap);

  function destroy() {
    search.destroy();
    categorySelect.destroy();
    bar.innerHTML = '';
  }

  return { element: bar, destroy };
} 
