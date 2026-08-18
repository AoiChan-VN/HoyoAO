/**
 * OS Settings definitions (§49, §36)
 *
 * Sections and settings owned by the OS (not by any Application).
 * Effects are expressed as apply() callbacks — no hardcoded if-else (§89).
 */

export const OS_SETTINGS_SECTIONS = [
  { id: 'appearance', titleKey: 'settings.section.appearance', scope: 'os', order: 1 },
  { id: 'language', titleKey: 'settings.section.language', scope: 'os', order: 2 },
];

/**
 * Build OS setting definitions.
 * Defaults are taken from OS configuration (§36), user preferences
 * loaded later will override them.
 * @param {object} config - ConfigService
 */
export function createOSSettingsDefaults(config) {
  return [
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
  ];
} 
