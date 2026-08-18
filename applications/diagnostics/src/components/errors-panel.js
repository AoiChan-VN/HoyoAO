/**
 * ErrorsPanel — recent errors and fatal events.
 * Answers: "Is anything failing?" (§77)
 * Empty state is a healthy state — never fabricate errors (§45, §98).
 */

import { createEmptyState } from '../../../../platform/ui/empty-state.js';

export function createErrorsPanel(options = {}) {
  const { localization } = options;

  const panel = document.createElement('section');
  panel.className = 'diagnostics__panel diagnostics__panel--wide';

  const title = document.createElement('h3');
  title.className = 'diagnostics__panel-title';
  title.textContent = localization.t('diagnostics.errors.title');
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'diagnostics__panel-body';
  panel.appendChild(body);

  let emptyHandle = null;

  function update(snapshot) {
    body.innerHTML = '';
    if (emptyHandle) {
      emptyHandle = null;
    }

    const errors = snapshot.errors || [];

    if (errors.length === 0) {
      // §98 — explain the empty state honestly.
      emptyHandle = createEmptyState({
        title: localization.t('diagnostics.errors.empty'),
        description: '',
      });
      body.appendChild(emptyHandle.element);
      return;
    }

    // Most recent first.
    const recent = [...errors].reverse();

    for (const err of recent) {
      const item = document.createElement('div');
      item.className = 'diagnostics__error-item';

      const top = document.createElement('div');
      top.className = 'diagnostics__error-top';

      const level = document.createElement('span');
      level.className = `diagnostics__error-level diagnostics__error-level--${err.level}`;
      level.textContent = err.level;

      const category = document.createElement('span');
      category.className = 'diagnostics__error-category';
      category.textContent = err.category || '—';

      const time = document.createElement('span');
      time.className = 'diagnostics__error-time';
      time.textContent = err.timestamp
        ? new Date(err.timestamp).toLocaleTimeString()
        : '—';

      top.append(level, category, time);

      const message = document.createElement('div');
      message.className = 'diagnostics__error-message';
      message.textContent = err.message || '';

      item.append(top, message);
      body.appendChild(item);
    }
  }

  function destroy() {
    body.innerHTML = '';
    emptyHandle = null;
  }

  return { element: panel, update, destroy };
} 
