/**
 * Diagnostics localization strings (§37).
 * Registered with the OS LocalizationService under the "en" locale.
 * Keys are namespaced with "diagnostics." to avoid collisions (§64).
 */
export default {
  'diagnostics.title': 'Diagnostics',
  'diagnostics.subtitle': 'System observability & runtime health',

  'diagnostics.system.title': 'System',
  'diagnostics.system.bootTime': 'Boot time',
  'diagnostics.system.uptime': 'Uptime',
  'diagnostics.system.memory': 'Memory (JS heap)',
  'diagnostics.system.memoryNA': 'Not available',

  'diagnostics.applications.title': 'Applications',
  'diagnostics.applications.empty': 'No applications registered.',

  'diagnostics.services.title': 'Services',
  'diagnostics.services.empty': 'No services registered.',

  'diagnostics.events.title': 'Events',
  'diagnostics.events.empty': 'No events emitted yet.',

  'diagnostics.errors.title': 'Errors',
  'diagnostics.errors.empty': 'No errors recorded. System is healthy.',
}; 
