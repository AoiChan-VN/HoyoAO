/**
 * ServerSummaryBar — fleet status distribution.
 * Answers: "How many servers exist, and how are they distributed by status?" (§77)
 */

import { createBadge } from '../../../../platform/ui/badge.js';

export function createServerSummaryBar(options = {}) {
  const { localization } = options;

  const bar = document.createElement('div');
  bar.className = 'server__summary-bar';

  const statsWrap = document.createElement('div');
  statsWrap.className = 'server__summary-stats';

  const badgeWrap = document.createElement('div');
  badgeWrap.className = 'server__summary-badge';

  bar.append(statsWrap, badgeWrap);

  const statEls = {};

  function buildStat(key) {
    const stat = document.createElement('div');
    stat.className = 'server__summary-stat';

    const value = document.createElement('div');
    value.className = 'server__summary-stat-value';
    value.textContent = '0';

    const label = document.createElement('div');
    label.className = 'server__summary-stat-label';
    label.textContent = localization.t(key);

    stat.append(value, label);
    statsWrap.appendChild(stat);
    return value;
  }

  statEls.total = buildStat('server.summary.total');
  statEls.online = buildStat('server.summary.online');
  statEls.degraded = buildStat('server.summary.degraded');
  statEls.offline = buildStat('server.summary.offline');

  function update(servers, isSimulated) {
    const total = servers.length;
    let online = 0;
    let degraded = 0;
    let offline = 0;

    for (const s of servers) {
      if (s.status === 'online') online++;
      else if (s.status === 'degraded') degraded++;
      else if (s.status === 'offline') offline++;
    }

    statEls.total.textContent = String(total);
    statEls.online.textContent = String(online);
    statEls.degraded.textContent = String(degraded);
    statEls.offline.textContent = String(offline);

    // Data source label (§45) — never hide that data is simulated.
    badgeWrap.innerHTML = '';
    const badge = createBadge({
      label: isSimulated
        ? localization.t('server.source.simulated')
        : localization.t('server.source.real'),
      variant: isSimulated ? 'warning' : 'success',
    });
    badgeWrap.appendChild(badge.element);
  }

  function destroy() {
    bar.innerHTML = '';
  }

  return { element: bar, update, destroy };
}
