/**
 * Detail Drawer (§16, §97)
 *
 * Opens a Drawer listing packets of a category with meaningful detail:
 * identity, source, origin, application, domain, type, category,
 * status, timestamp, payload (§16).
 *
 * Uses the OS Drawer primitive. Drawer (not Modal) because this is
 * detailed inspection (§97).
 */
import { createDrawer } from '../../../../platform/ui/drawer.js';

export function openCategoryDrawer(options = {}) {
  const { domain, packets, localization, onClose } = options;

  const content = buildContent(packets, localization);
  const drawer = createDrawer({
    title: domain,
    content,
    side: 'right',
    closable: true,
    onClose,
  });
  drawer.open();
  return drawer;
}

/* ---- private ---- */

function buildContent(packets, localization) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard__detail';

  if (!packets || packets.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dashboard__detail-empty';
    empty.textContent = localization.t('dashboard.detail.none');
    wrap.appendChild(empty);
    return wrap;
  }

  const listTitle = document.createElement('h3');
  listTitle.className = 'dashboard__detail-list-title';
  listTitle.textContent = localization.t('dashboard.detail.packets');
  wrap.appendChild(listTitle);

  // Show the most recent 20 to keep DOM small (§94).
  const MAX = 20;
  const recent = packets.slice(-MAX).reverse();

  for (const p of recent) {
    wrap.appendChild(buildPacketItem(p, localization));
  }

  return wrap;
}

function buildPacketItem(packet, localization) {
  const item = document.createElement('div');
  item.className = 'dashboard__detail-item';

  const m = packet.metadata;

  const fields = [
    ['dashboard.detail.id', packet.id],
    ['dashboard.detail.source', m.source],
    ['dashboard.detail.origin', m.origin],
    ['dashboard.detail.application', m.application],
    ['dashboard.detail.domain', m.domain],
    ['dashboard.detail.type', m.type],
    ['dashboard.detail.category', m.category],
    ['dashboard.detail.status', m.status],
    ['dashboard.detail.timestamp', new Date(m.timestamp).toLocaleString()],
  ];

  for (const [key, value] of fields) {
    const row = document.createElement('div');
    row.className = 'dashboard__detail-row';

    const label = document.createElement('span');
    label.className = 'dashboard__detail-label';
    label.textContent = localization.t(key);

    const val = document.createElement('span');
    val.className = 'dashboard__detail-value';
    val.textContent = value == null ? '—' : String(value);

    row.append(label, val);
    item.appendChild(row);
  }

  if (packet.payload) {
    const payloadRow = document.createElement('div');
    payloadRow.className = 'dashboard__detail-row dashboard__detail-row--payload';

    const label = document.createElement('span');
    label.className = 'dashboard__detail-label';
    label.textContent = localization.t('dashboard.detail.payload');

    const val = document.createElement('pre');
    val.className = 'dashboard__detail-payload';
    val.textContent = JSON.stringify(packet.payload, null, 2);

    payloadRow.append(label, val);
    item.appendChild(payloadRow);
  }

  return item;
} 
