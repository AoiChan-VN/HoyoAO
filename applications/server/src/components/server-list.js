/**
 * ServerList — renders the fleet as interactive rows.
 * Answers: "What is each server's status, address, and current load?" (§77)
 * Each row is a real <button> for keyboard accessibility (§38).
 */

import { createBadge } from '../../../../platform/ui/badge.js';

const STATUS_VARIANTS = {
  online: 'success',
  degraded: 'warning',
  offline: 'error',
  maintenance: 'info',
};

export function createServerList(options = {}) {
  const { localization, icons, onSelect } = options;

  const list = document.createElement('div');
  list.className = 'server__list';
  list.setAttribute('role', 'list');

  function update(servers) {
    list.innerHTML = '';

    for (const server of servers) {
      list.appendChild(buildRow(server));
    }
  }

  function buildRow(server) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'server__row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${server.name} — ${server.status}`);

    // Identity
    const identity = document.createElement('div');
    identity.className = 'server__row-identity';

    if (icons) {
      const iconEl = icons.resolve(server.type === 'database' ? 'app' : 'app');
      iconEl.classList.add('ui-icon--sm');
      identity.appendChild(iconEl);
    }

    const nameWrap = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'server__row-name';
    name.textContent = server.name;

    const meta = document.createElement('div');
    meta.className = 'server__row-meta';
    meta.textContent = `${server.host}:${server.port} · ${server.region}`;

    nameWrap.append(name, meta);
    identity.appendChild(nameWrap);

    // Load
    const load = document.createElement('div');
    load.className = 'server__row-load';

    const cpu = document.createElement('span');
    cpu.className = 'server__row-metric';
    cpu.textContent = `CPU ${server.cpuLoad}%`;

    const mem = document.createElement('span');
    mem.className = 'server__row-metric';
    mem.textContent = `MEM ${server.memoryLoad}%`;

    load.append(cpu, mem);

    // Status
    const variant = STATUS_VARIANTS[server.status] || 'neutral';
    const badge = createBadge({ label: server.status, variant });

    row.append(identity, load, badge.element);

    row.addEventListener('click', () => {
      if (onSelect) onSelect(server.id);
    });

    return row;
  }

  function destroy() {
    list.innerHTML = '';
  }

  return { element: list, update, destroy };
} 
