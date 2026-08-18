/**
 * Content Detail Drawer (§16, §97)
 *
 * Drawer is used because this is detailed inspection of a content item (§97).
 * Exposes identity, type, category, tags, author, status, timestamps,
 * mime/size, and excerpt (§16).
 */

import { createDrawer } from '../../../../platform/ui/drawer.js';
import { createBadge } from '../../../../platform/ui/badge.js';

const STATUS_VARIANTS = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

function formatBytes(bytes, localization) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function openContentDrawer(options = {}) {
  const { item, localization, onClose } = options;

  const content = buildContent(item, localization);

  const drawer = createDrawer({
    title: item.title,
    content,
    side: 'right',
    closable: true,
    onClose,
  });

  drawer.open();
  return drawer;
}

/* ---- private ---- */

function buildContent(item, localization) {
  const wrap = document.createElement('div');
  wrap.className = 'content__detail';

  // Status + type badges
  const badges = document.createElement('div');
  badges.className = 'content__detail-badges';

  const typeBadge = createBadge({
    label: localization.t(`content.type.${item.type}`) || item.type,
    variant: 'info',
  });
  const statusBadge = createBadge({
    label: localization.t(`content.status.${item.status}`) || item.status,
    variant: STATUS_VARIANTS[item.status] || 'neutral',
  });
  badges.append(typeBadge.element, statusBadge.element);
  wrap.appendChild(badges);

  // Metadata fields
  const fields = [
    ['content.detail.id', item.id],
    ['content.detail.category', item.category],
    ['content.detail.author', item.author],
    ['content.detail.mimeType', item.mimeType],
    ['content.detail.size', formatBytes(item.size, localization)],
    ['content.detail.createdAt', item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'],
    ['content.detail.updatedAt', item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'],
  ];

  for (const [key, value] of fields) {
    const row = document.createElement('div');
    row.className = 'content__detail-row';

    const label = document.createElement('span');
    label.className = 'content__detail-label';
    label.textContent = localization.t(key);

    const val = document.createElement('span');
    val.className = 'content__detail-value';
    val.textContent = value == null ? '—' : String(value);

    row.append(label, val);
    wrap.appendChild(row);
  }

  // Tags
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    const tagsLabel = document.createElement('div');
    tagsLabel.className = 'content__detail-label';
    tagsLabel.textContent = localization.t('content.detail.tags');
    wrap.appendChild(tagsLabel);

    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'content__detail-tags';
    for (const tag of item.tags) {
      const chip = document.createElement('span');
      chip.className = 'content__detail-tag';
      chip.textContent = tag;
      tagsWrap.appendChild(chip);
    }
    wrap.appendChild(tagsWrap);
  }

  // Excerpt / description
  if (item.excerpt) {
    const exLabel = document.createElement('div');
    exLabel.className = 'content__detail-label';
    exLabel.textContent = localization.t('content.detail.excerpt');
    wrap.appendChild(exLabel);

    const exText = document.createElement('p');
    exText.className = 'content__detail-excerpt';
    exText.textContent = item.excerpt;
    wrap.appendChild(exText);
  }

  return wrap;
} 
