/**
 * Category Card (§16)
 *
 * Represents one data category (domain). Clicking opens detailed info.
 * Accessible: real <button>, keyboard operable (§38).
 */
export function createCategoryCard(options = {}) {
  const { domain, count, lastActivity, onClick } = options;

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'dashboard__category-card';
  card.setAttribute('aria-label', `Open details for ${domain}`);

  const title = document.createElement('div');
  title.className = 'dashboard__category-card-title';
  title.textContent = domain;

  const countEl = document.createElement('div');
  countEl.className = 'dashboard__category-card-count';
  countEl.textContent = String(count);

  const meta = document.createElement('div');
  meta.className = 'dashboard__category-card-meta';
  meta.textContent = lastActivity
    ? new Date(lastActivity).toLocaleTimeString()
    : '—';

  card.append(title, countEl, meta);

  const controller = new AbortController();
  card.addEventListener(
    'click',
    () => {
      if (onClick) onClick(domain);
    },
    { signal: controller.signal },
  );

  return {
    element: card,
    update(newCount, newLastActivity) {
      countEl.textContent = String(newCount);
      meta.textContent = newLastActivity
        ? new Date(newLastActivity).toLocaleTimeString()
        : '—';
    },
    destroy() {
      controller.abort();
    },
  };
} 
