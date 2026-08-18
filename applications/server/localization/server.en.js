/**
 * Server localization strings (§37).
 * Registered with the OS LocalizationService under the "en" locale.
 * Keys are namespaced with "server." to avoid collisions (§64).
 */
export default {
  'server.title': 'Server',
  'server.subtitle': 'Server fleet monitoring & inspection',

  'server.loading': 'Loading servers…',

  'server.empty.title': 'No servers available',
  'server.empty.description':
    'No server data source is connected. In development mode a simulated fleet is shown. ' +
    'In production, connect a server data source via a ServerDataProvider.',

  'server.error.title': 'Failed to load servers',
  'server.error.description': 'The server data source returned an error.',

  'server.source.simulated': 'Simulated data (development)',
  'server.source.real': 'Live data',

  'server.summary.total': 'Total',
  'server.summary.online': 'Online',
  'server.summary.degraded': 'Degraded',
  'server.summary.offline': 'Offline',

  'server.detail.id': 'Identity',
  'server.detail.type': 'Type',
  'server.detail.host': 'Address',
  'server.detail.region': 'Region',
  'server.detail.version': 'Version',
  'server.detail.cpu': 'CPU load',
  'server.detail.memory': 'Memory load',
  'server.detail.connections': 'Connections',
  'server.detail.uptime': 'Uptime',
  'server.detail.startedAt': 'Started at',
}; 
