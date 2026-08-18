/**
 * ServicesPanel — loaded OS services.
 * Answers: "Which OS services are currently loaded?" (§77)
 */

export function createServicesPanel(options = {}) {
  const { localization } = options;

  const panel = document.createElement('section');
  panel.className = 'diagnostics__panel';

  const title = document.createElement('h3');
  title.className = 'diagnostics__panel-title';
  title.textContent = localization.t('diagnostics.services.title');
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'diagnostics__panel-body';
  panel.appendChild(body);

  function update(snapshot) {
    body.innerHTML = '';

    const services = snapshot.services || [];

    if (services.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'diagnostics__empty';
      empty.textContent = localization.t('diagnostics.services.empty');
      body.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'diagnostics__chip-list';

    for (const name of services) {
      const chip = document.createElement('span');
      chip.className = 'diagnostics__chip';
      chip.textContent = name;
      list.appendChild(chip);
    }

    body.appendChild(list);
  }

  function destroy() {
    body.innerHTML = '';
  }

  return { element: panel, update, destroy };
} 
