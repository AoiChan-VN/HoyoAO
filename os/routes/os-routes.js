/**
 * OS Route Definitions (§30)
 *
 * Routes owned by the OS. Application routes are registered separately
 * from manifests. Adding an OS view here automatically surfaces it in
 * the OS navigation (§89 — no hardcoded menu logic).
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
  {
    path: '/os/applications',
    scope: 'os',
    kind: 'os',
    viewId: 'applications',
    titleKey: 'os.applications',
    icon: 'app',
    order: 2,
  },
];
