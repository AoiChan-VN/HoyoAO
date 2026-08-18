/**
 * EventsPanel — emitted event counts.
 * Answers: "What events is the system emitting, and how often?" (§77)
 */

export function createEventsPanel(options = {}) {
  const { localization } = options;

  const panel = document.createElement('section');
  panel.className = 'diagnostics__panel';

  const title = document.createElement('h3');
  title.className = 'diagnostics__panel-title';
  title.textContent = localization.t('diagnostics.events.title');
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'diagnostics__panel-body';
  panel.appendChild(body);

  function update(snapshot) {
    body.innerHTML = '';

    const events = snapshot.events || {};
    const entries = Object.entries(events);

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'diagnostics__empty';
      empty.textContent = localization.t('diagnostics.events.empty');
      body.appendChild(empty);
      return;
    }

    // Show most frequent events first.
    entries.sort((a, b) => b[1] - a[1]);

    for (const [eventName, count] of entries) {
      const row = document.createElement('div');
      row.className = 'diagnostics__row';

      const name = document.createElement('span');
      name.className = 'diagnostics__label diagnostics__label--mono';
      name.textContent = eventName;

      const value = document.createElement('span');
      value.className = 'diagnostics__value';
      value.textContent = String(count);

      row.append(name, value);
      body.appendChild(row);
    }
  }

  function destroy() {
    body.innerHTML = '';
  }

  return { element: panel, update, destroy };
} 
