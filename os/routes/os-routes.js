/**
 * OS Route Definitions (§30)
 *
 * Routes owned by the OS (not by any Application).
 * Diagnostics is an APPLICATION (§48), so it is NOT listed here —
 * it is registered from its manifest as an application route.
 */
export const OS_ROUTES = [
  {
    path: '/os/settings',
    scope: 'os',
    kind: 'os',
    viewId: 'settings',
    titleKey: 'os.settings',
    icon: 'settings',
    order: 1,
  },
]; 
