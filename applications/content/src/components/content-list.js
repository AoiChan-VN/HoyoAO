/**
 * ContentList — responsive grid of content cards (§17).
 * Answers: "Which content items match my query, and what is their status?"
 * Handles two distinct empty cases:
 *   - no data source at all
 *   - filters matched nothing (§98)
 */

import { createBadge } from '../../../../platform/ui/badge.js';

const STATUS_VARIANTS = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

function formatDate(ts, localization) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString();
}

export function createContentList(options = {}) {
  const { localization, onSelect } = options;

  const list = document.createElement('div');
  list.className = 'content__list';
  list.setAttribute('role', 'list');

  function update(items, totalCount) {
    list.innerHTML = '';

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'content__empty';

      const msg = document.createElement('p');
      msg.className = 'content__empty-message';

      // Distinguish "no source" from "no results" (§98).
      if (totalCount === 0) {
        msg.textContent = localization.t('content.empty.description');
      } else {
        msg.textContent = localization.t('content.noResults');
      }

      empty.appendChild(msg);
      list.appendChild(empty);
      return;
    }

    for (const item of items) {
      list.appendChild(buildCard(item));
    }
  }

  function buildCard(item) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'content__card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', item.title);

    // Top row: type + status
    const top = document.createElement('div');
    top.className = 'content__card-top';

    const typeBadge = createBadge({
      label: localization.t(`content.type.${item.type}`) || item.type,
      variant: 'info',
    });

    const statusBadge = createBadge({
      label: localization.t(`content.status.${item.status}`) || item.status,
      variant: STATUS_VARIANTS[item.status] || 'neutral',
    });

    top.append(typeBadge.element, statusBadge.element);

    // Title
    const title = document.createElement('h4');
    title.className = 'content__card-title';
    title.textContent = item.title;

    // Excerpt
    const excerpt = document.createElement('p');
    excerpt.className = 'content__card-excerpt';
    excerpt.textContent = item.excerpt || '';

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'content__card-meta';

    const category = document.createElement('span');
    category.className = 'content__card-category';
    category.textContent = item.category || '—';

    const date = document.createElement('span');
    date.className = 'content__card-date';
    date.textContent = formatDate(item.updatedAt, localization);

    meta.append(category, date);

    card.append(top, title, excerpt, meta);

    card.addEventListener('click', () => {
      if (onSelect) onSelect(item.id);
    });

    return card;
  }

  function destroy() {
    list.innerHTML = '';
  }

  return { element: list, update, destroy };
} 
