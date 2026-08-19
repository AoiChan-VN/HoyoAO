/**
 * FileList — responsive list of file rows (§17).
 * Answers: "Which files match my query, and what are their size/status?" (§77)
 * Handles two distinct empty cases:
 *   - no data source at all
 *   - filters matched nothing (§98)
 */

import { createBadge } from '../../../../platform/ui/badge.js';
import { formatBytes, formatDate } from '../utils/format.js';

const STATUS_VARIANTS = {
  available: 'success',
  offline: 'error',
  syncing: 'info',
};

const CATEGORY_VARIANTS = {
  documents: 'info',
  images: 'success',
  media: 'warning',
  archives: 'neutral',
  other: 'neutral',
};

export function createFileList(options = {}) {
  const { localization, onSelect } = options;

  const list = document.createElement('div');
  list.className = 'file-manager__list';
  list.setAttribute('role', 'list');

  function update(files, totalCount) {
    list.innerHTML = '';

    if (!files || files.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'file-manager__empty';

      const msg = document.createElement('p');
      msg.className = 'file-manager__empty-message';

      // Distinguish "no source" from "no results" (§98).
      if (totalCount === 0) {
        msg.textContent = localization.t('fileManager.empty.description');
      } else {
        msg.textContent = localization.t('fileManager.noResults');
      }

      empty.appendChild(msg);
      list.appendChild(empty);
      return;
    }

    for (const file of files) {
      list.appendChild(buildRow(file));
    }
  }

  function buildRow(file) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'file-manager__row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', file.name);

    // Identity: name + path
    const identity = document.createElement('div');
    identity.className = 'file-manager__row-identity';

    const name = document.createElement('div');
    name.className = 'file-manager__row-name';
    name.textContent = file.name;

    const path = document.createElement('div');
    path.className = 'file-manager__row-path';
    path.textContent = file.path;

    identity.append(name, path);

    // Size
    const size = document.createElement('span');
    size.className = 'file-manager__row-size';
    size.textContent = formatBytes(file.size);

    // Modified
    const modified = document.createElement('span');
    modified.className = 'file-manager__row-date';
    modified.textContent = formatDate(file.modifiedAt);

    // Category badge
    const categoryBadge = createBadge({
      label: localization.t(`fileManager.category.${file.category}`) || file.category,
      variant: CATEGORY_VARIANTS[file.category] || 'neutral',
    });

    // Status badge
    const statusBadge = createBadge({
      label: localization.t(`fileManager.status.${file.status}`) || file.status,
      variant: STATUS_VARIANTS[file.status] || 'neutral',
    });

    const badges = document.createElement('div');
    badges.className = 'file-manager__row-badges';
    badges.append(categoryBadge.element, statusBadge.element);

    row.append(identity, size, modified, badges);

    row.addEventListener('click', () => {
      if (onSelect) onSelect(file.id);
    });

    return row;
  }

  function destroy() {
    list.innerHTML = '';
  }

  return { element: list, update, destroy };
} 
