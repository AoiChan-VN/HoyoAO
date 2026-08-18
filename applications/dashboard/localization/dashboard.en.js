/**
 * Dashboard localization strings (§37).
 * Registered with the OS LocalizationService under the "en" locale.
 * Keys are namespaced with "dashboard." to avoid collisions (§64).
 */
export default {
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Indexed data overview & system monitoring',

  'dashboard.source.simulated': 'Simulated data (development)',
  'dashboard.source.real': 'Live data',

  'dashboard.stats.total': 'Total indexed',
  'dashboard.stats.rate': 'Rate',
  'dashboard.stats.rateUnit': '/min',
  'dashboard.stats.mostActive': 'Most active',
  'dashboard.stats.dataSource': 'Data source',
  'dashboard.stats.lastUpdate': 'Last update',

  'dashboard.categories.title': 'Data Categories',

  'dashboard.empty.title': 'No indexed data yet',
  'dashboard.empty.description':
    'This view populates automatically when data sources are indexed. ' +
    'In development mode, simulated telemetry will appear shortly. ' +
    'In production, connect a real data source to populate this view.',

  'dashboard.loading': 'Connecting to data stream…',

  'dashboard.detail.packets': 'Recent packets',
  'dashboard.detail.none': 'No packets in this category.',
  'dashboard.detail.id': 'Identity',
  'dashboard.detail.source': 'Source',
  'dashboard.detail.origin': 'Origin',
  'dashboard.detail.application': 'Application',
  'dashboard.detail.domain': 'Domain',
  'dashboard.detail.type': 'Type',
  'dashboard.detail.category': 'Category',
  'dashboard.detail.status': 'Status',
  'dashboard.detail.timestamp': 'Timestamp',
  'dashboard.detail.payload': 'Payload',
}; 
