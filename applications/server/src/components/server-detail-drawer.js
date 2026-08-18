/**
 * Server Detail Drawer (§16, §97)
 *
 * Drawer is used because this is detailed inspection of a single server (§97).
 * Exposes meaningful detail: identity, address, region, version, load,
 * connections, uptime, timestamps (§16).
 */

import { createDrawer } from '../../../../platform/ui/drawer.js';
import { createBadge } from '../../../../platform/ui/badge.js';

const STATUS_VARIANTS = {
  online: 'success',
  degraded: 'warning',
  offline: 'error',
  maintenance: 'info',
};

function formatUptime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '—';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function openServerDrawer(options = {}) {
  const { server, localization, onClose } = options;

  const content = buildContent(server, localization);

  const drawer = createDrawer({
    title: server.name,
    content,
    side: 'right',
    closable: true,
    onClose,
  });

  drawer.open();
  return drawer;
}

/* ---- private ---- */

function buildContent(server, localization) {
  const wrap = document.createElement('div');
  wrap.className = 'server__detail';

  // Status badge
  const variant = STATUS_VARIANTS[server.status] || 'neutral';
  const badge = createBadge({ label: server.status, variant });
  wrap.appendChild(badge.element);

  // Fields
  const fields = [
    ['server.detail.id', server.id],
    ['server.detail.type', server.type],
    ['server.detail.host', `${server.host}:${server.port}`],
    ['server.detail.region', server.region],
    ['server.detail.version', server.version],
    ['server.detail.cpu', `${server.cpuLoad}%`],
    ['server.detail.memory', `${server.memoryLoad}%`],
    ['server.detail.connections', String(server.connections)],
    ['server.detail.uptime', formatUptime(server.uptimeSeconds)],
    [
      'server.detail.startedAt',
      server.startedAt ? new Date(server.startedAt).toLocaleString() : '—',
    ],
  ];

  for (const [key, value] of fields) {
    const row = document.createElement('div');
    row.className = 'server__detail-row';

    const label = document.createElement('span');
    label.className = 'server__detail-label';
    label.textContent = localization.t(key);

    const val = document.createElement('span');
    val.className = 'server__detail-value';
    val.textContent = value == null ? '—' : String(value);

    row.append(label, val);
    wrap.appendChild(row);
  }

  return wrap;
} 
