/**
 * Stats Panel (§13 right side)
 *
 * Temporal & statistical info for the active dataset:
 * total indexed, rate, most active category, data source, last update.
 * All values come from the DataStreamStore — never fabricated (§45).
 */
export function createStatsPanel(options = {}) {
  const { store, localization } = options;

  const panel = document.createElement('aside');
  panel.className = 'dashboard__stats';
  panel.setAttribute('aria-label', 'Data statistics');

  const rows = {};

  function buildRow(labelKey) {
    const row = document.createElement('div');
    row.className = 'dashboard__stats-row';

    const label = document.createElement('span');
    label.className = 'dashboard__stats-label';
    label.textContent = localization.t(labelKey);

    const value = document.createElement('span');
    value.className = 'dashboard__stats-value';

    row.append(label, value);
    panel.appendChild(row);
    return value;
  }

  rows.total = buildRow('dashboard.stats.total');
  rows.rate = buildRow('dashboard.stats.rate');
  rows.mostActive = buildRow('dashboard.stats.mostActive');
  rows.dataSource = buildRow('dashboard.stats.dataSource');
  rows.lastUpdate = buildRow('dashboard.stats.lastUpdate');

  let unsubscribe = null;

  function update() {
    rows.total.textContent = String(store.getTotal());
    rows.rate.textContent =
      store.getRate() + localization.t('dashboard.stats.rateUnit');
    rows.mostActive.textContent = store.getMostActiveCategory() || '—';
    rows.dataSource.textContent = store.hasSimulatedData()
      ? localization.t('dashboard.source.simulated')
      : localization.t('dashboard.source.real');
    const last = store.getLastTimestamp();
    rows.lastUpdate.textContent = last
      ? new Date(last).toLocaleTimeString()
      : '—';
  }

  function start() {
    unsubscribe = store.subscribe(update);
    update();
  }

  function destroy() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return { element: panel, start, destroy };
} 
