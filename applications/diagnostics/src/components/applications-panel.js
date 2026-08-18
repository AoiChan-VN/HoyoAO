/**
 * ApplicationsPanel — registered applications and lifecycle state.
 * Answers: "Which applications exist, and what state is each one in?" (§77)
 */

import { createBadge } from '../../../../platform/ui/badge.js';

const STATE_VARIANTS = {
  RUNNING: 'success',
  READY: 'info',
  STARTING: 'info',
  STOPPING: 'warning',
  STOPPED: 'neutral',
  SUSPENDED: 'warning',
  FAILED: 'error',
  DISABLED: 'neutral',
  DISCOVERED: 'neutral',
  VALIDATING: 'info',
};

export function createApplicationsPanel(options = {}) {
  const { localization } = options;

  const panel = document.createElement('section');
  panel.className = 'diagnostics__panel';

  const title = document.createElement('h3');
  title.className = 'diagnostics__panel-title';
  title.textContent = localization.t('diagnostics.applications.title');
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'diagnostics__panel-body';
  panel.appendChild(body);

  function update(snapshot) {
    body.innerHTML = '';

    const apps = snapshot.applications || [];

    if (apps.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'diagnostics__empty';
      empty.textContent = localization.t('diagnostics.applications.empty');
      body.appendChild(empty);
      return;
    }

    for (const app of apps) {
      const row = document.createElement('div');
      row.className = 'diagnostics__row diagnostics__row--app';

      const nameWrap = document.createElement('div');
      nameWrap.className = 'diagnostics__app-name';

      const name = document.createElement('span');
      name.textContent = app.name;

      const version = document.createElement('span');
      version.className = 'diagnostics__app-version';
      version.textContent = `v${app.version}`;

      nameWrap.append(name, version);

      const variant = STATE_VARIANTS[app.state] || 'neutral';
      const badge = createBadge({ label: app.state, variant });

      row.append(nameWrap, badge.element);
      body.appendChild(row);
    }
  }

  function destroy() {
    body.innerHTML = '';
  }

  return { element: panel, update, destroy };
} 
