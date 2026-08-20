/**
 * OS Settings Definitions (§49)
 *
 * Sections: Appearance, Language, Accessibility, Network, Diagnostics.
 * Each section has settings definitions with apply callbacks.
 * Applications register their own settings separately (§49).
 */

export const OS_SETTINGS_SECTIONS = [
  { id: 'appearance', titleKey: 'settings.section.appearance', scope: 'os', order: 1 },
  { id: 'language', titleKey: 'settings.section.language', scope: 'os', order: 2 },
  { id: 'accessibility', titleKey: 'settings.section.accessibility', scope: 'os', order: 3 },
  { id: 'network', titleKey: 'settings.section.network', scope: 'os', order: 4 },
  { id: 'diagnostics', titleKey: 'settings.section.diagnostics', scope: 'os', order: 5 },
];

export function createOSSettingsDefaults(config) {
  return [
    // Appearance.
    {
      key: 'appearance.theme',
      section: 'appearance',
      type: 'select',
      labelKey: 'settings.appearance.theme',
      options: [
        { value: 'dark', labelKey: 'settings.appearance.theme.dark' },
        { value: 'light', labelKey: 'settings.appearance.theme.light' },
      ],
      defaultValue: config.get('theme.default', 'dark'),
      apply: (value, ctx) => {
        if (ctx?.theme) ctx.theme.apply(value);
      },
    },

    // Language.
    {
      key: 'language.current',
      section: 'language',
      type: 'select',
      labelKey: 'settings.language.current',
      options: [
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Tiếng Việt' },
      ],
      defaultValue: config.get('localization.defaultLocale', 'en'),
      apply: (value, ctx) => {
        if (ctx?.localization) ctx.localization.setLocale(value);
      },
    },

    // Accessibility (§38).
    {
      key: 'accessibility.reducedMotion',
      section: 'accessibility',
      type: 'toggle',
      labelKey: 'settings.accessibility.reducedMotion',
      defaultValue: false,
      apply: (value) => {
        document.documentElement.setAttribute('data-reduced-motion', String(value));
      },
    },
    {
      key: 'accessibility.fontSize',
      section: 'accessibility',
      type: 'select',
      labelKey: 'settings.accessibility.fontSize',
      options: [
        { value: 'sm', labelKey: 'settings.accessibility.fontSize.sm' },
        { value: 'md', labelKey: 'settings.accessibility.fontSize.md' },
        { value: 'lg', labelKey: 'settings.accessibility.fontSize.lg' },
      ],
      defaultValue: 'md',
      apply: (value) => {
        const multipliers = { sm: 0.875, md: 1, lg: 1.125 };
        const mult = multipliers[value] || 1;
        document.documentElement.style.setProperty('--font-scale', String(mult));
      },
    },

    // Network (§24).
    {
      key: 'network.offlineNotifications',
      section: 'network',
      type: 'toggle',
      labelKey: 'settings.network.offlineNotifications',
      defaultValue: true,
      apply: (value, ctx) => {
        if (ctx?.config) ctx.config.set('network.offlineNotifications', value);
      },
    },

    // Diagnostics (§48).
    {
      key: 'diagnostics.verboseLogging',
      section: 'diagnostics',
      type: 'toggle',
      labelKey: 'settings.diagnostics.verboseLogging',
      defaultValue: false,
      apply: (value, ctx) => {
        if (ctx?.config) {
          ctx.config.set('os.logLevel', value ? 'debug' : 'info');
        }
      },
    },
  ];
}
