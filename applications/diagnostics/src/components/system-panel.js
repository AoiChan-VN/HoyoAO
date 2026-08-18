/**
 * SystemPanel — boot time, uptime, memory.
 * Answers: "How long has the OS been running, and what resources does it use?" (§77)
 */

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function createSystemPanel(options = {}) {
  const { localization } = options;

  let bootTimestamp = null;

  const panel = document.createElement('section');
  panel.className = 'diagnostics__panel';

  const title = document.createElement('h3');
  title.className = 'diagnostics__panel-title';
  title.textContent = localization.t('diagnostics.system.title');
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'diagnostics__panel-body';
  panel.appendChild(body);

  function buildRow(labelText) {
    const row = document.createElement('div');
    row.className = 'diagnostics__row';

    const label = document.createElement('span');
    label.className = 'diagnostics__label';
    label.textContent = labelText;

    const value = document.createElement('span');
    value.className = 'diagnostics__value';
    value.textContent = '—';

    row.append(label, value);
    body.appendChild(row);
    return value;
  }

  const bootValue = buildRow(localization.t('diagnostics.system.bootTime'));
  const uptimeValue = buildRow(localization.t('diagnostics.system.uptime'));
  const memoryValue = buildRow(localization.t('diagnostics.system.memory'));

  function update(snapshot) {
    bootTimestamp = snapshot.boot?.timestamp ?? null;

    bootValue.textContent = bootTimestamp
      ? new Date(bootTimestamp).toLocaleTimeString()
      : '—';

    uptimeValue.textContent = bootTimestamp
      ? formatUptime(Date.now() - bootTimestamp)
      : '—';

    const mem = snapshot.memory;
    if (mem && typeof mem.usedJSHeapSize === 'number') {
      const used = formatBytes(mem.usedJSHeapSize);
      const total = formatBytes(mem.totalJSHeapSize);
      memoryValue.textContent = `${used} / ${total}`;
    } else {
      // §23 — capability not available on this platform.
      memoryValue.textContent = localization.t('diagnostics.system.memoryNA');
    }
  }

  function updateUptime() {
    if (!bootTimestamp) return;
    uptimeValue.textContent = formatUptime(Date.now() - bootTimestamp);
  }

  function destroy() {
    // Stateless DOM; nothing to release.
  }

  return { element: panel, update, updateUptime, destroy };
} 
