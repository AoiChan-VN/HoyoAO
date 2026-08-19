/**
 * File Detail Drawer (§16, §97)
 *
 * Drawer is used because this is detailed inspection of a file (§97).
 * Exposes identity, category, mime, size, virtual path, timestamps, status (§16).
 */

import { createDrawer } from '../../../../platform/ui/drawer.js';
import { createBadge } from '../../../../platform/ui/badge.js';
import { formatBytes, formatDate } from '../utils/format.js';

const STATUS_VARIANTS = {
  available: 'success',
  offline: 'error',
  syncing: 'info',
};

export function openFileDrawer(options = {}) {
  const { file, localization, onClose } = options;

  const content = buildContent(file, localization);

  const drawer = createDrawer({
    title: file.name,
    content,
    side: 'right',
    closable: true,
    onClose,
  });

  drawer.open();
  return drawer;
}

/* ---- private ---- */

function buildContent(file, localization) {
  const wrap = document.createElement('div');
  wrap.className = 'file-manager__detail';

  // Status badge
  const badgeRow = document.createElement('div');
  badgeRow.className = 'file-manager__detail-badges';

  const statusBadge = createBadge({
    label: localization.t(`fileManager.status.${file.status}`) || file.status,
    variant: STATUS_VARIANTS[file.status] || 'neutral',
  });
  const categoryBadge = createBadge({
    label: localization.t(`fileManager.category.${file.category}`) || file.category,
    variant: 'info',
  });
  badgeRow.append(statusBadge.element, categoryBadge.element);
  wrap.appendChild(badgeRow);

  // Metadata fields
  const fields = [
    ['fileManager.detail.id', file.id],
    ['fileManager.detail.mimeType', file.mimeType],
    ['fileManager.detail.size', formatBytes(file.size)],
    ['fileManager.detail.path', file.path],
    ['fileManager.detail.createdAt', formatDate(file.createdAt)],
    ['fileManager.detail.modifiedAt', formatDate(file.modifiedAt)],
  ];

  for (const [key, value] of fields) {
    const row = document.createElement('div');
    row.className = 'file-manager__detail-row';

    const label = document.createElement('span');
    label.className = 'file-manager__detail-label';
    label.textContent = localization.t(key);

    const val = document.createElement('span');
    val.className = 'file-manager__detail-value';
    val.textContent = value == null ? '—' : String(value);

    row.append(label, val);
    wrap.appendChild(row);
  }

  return wrap;
} 
