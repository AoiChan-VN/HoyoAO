/**
 * Localization Service (§37)
 *
 * Centralized UI text management.
 * UI labels are stored in locale JSON files, not hardcoded in JS (§37).
 *
 * Supports:
 *   - Multiple locales
 *   - Fallback to default locale
 *   - Interpolation: "Hello, {name}" → t('key', { name: 'World' })
 *   - Runtime locale switching with event emission
 *   - Lazy loading of locale files
 */

export class LocalizationService {
  /** @type {Map<string, object>} locale → translations map */
  #locales = new Map();
  #current = null;
  #fallback = 'en';
  #config;
  #eventBus;
  #logger;

  constructor(config, eventBus, logger) {
    this.#config = config;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Initialize: load and set the default locale from config.
   */
  async init() {
    const defaultLocale = this.#config.get('localization.defaultLocale', 'en');
    this.#fallback = defaultLocale;

    await this.loadLocale(defaultLocale);
    this.setLocale(defaultLocale);

    this.#logger.info('localization', `Localization service initialised with "${defaultLocale}"`);
  }

  /**
   * Register translations programmatically.
   * @param {string} locale
   * @param {object} translations - Flat key → text map
   */
  register(locale, translations) {
    if (!locale || typeof translations !== 'object') {
      this.#logger.warn('localization', `Invalid locale registration: "${locale}"`);
      return;
    }

    const existing = this.#locales.get(locale) || {};
    this.#locales.set(locale, { ...existing, ...translations });
    this.#logger.debug('localization', `Registered locale "${locale}" with ${Object.keys(translations).length} keys`);
  }

  /**
   * Load a locale file from platform/locales/{locale}.json
   * @param {string} locale
   */
  async loadLocale(locale) {
    if (this.#locales.has(locale)) return;

    try {
      const res = await fetch(`platform/locales/${locale}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data.translations || typeof data.translations !== 'object') {
        throw new Error(`Locale "${locale}" missing "translations" object`);
      }

      this.register(locale, data.translations);
    } catch (err) {
      this.#logger.warn('localization', `Failed to load locale "${locale}"`, {
        error: err.message,
      });
    }
  }

  /**
   * Set the active locale.
   * @param {string} locale
   */
  setLocale(locale) {
    if (!this.#locales.has(locale)) {
      this.#logger.warn('localization', `Locale "${locale}" not loaded — cannot set`);
      return;
    }

    const previous = this.#current;
    this.#current = locale;

    this.#eventBus.emit('locale:changed', { locale, previous });
    this.#logger.info('localization', `Locale set: "${locale}"`);
  }

  /**
   * Translate a key with optional interpolation.
   *
   * @param {string} key - Dot-notation key, e.g. "nav.applications"
   * @param {object} params - Interpolation values, e.g. { count: 5 }
   * @returns {string} Translated text, or the key itself if not found
   */
  t(key, params = {}) {
    const currentTranslations = this.#locales.get(this.#current) || {};
    const fallbackTranslations = this.#locales.get(this.#fallback) || {};

    // Lookup: current locale → fallback locale → key itself
    let text = currentTranslations[key];
    if (text === undefined) {
      text = fallbackTranslations[key];
    }
    if (text === undefined) {
      this.#logger.debug('localization', `Missing translation key: "${key}"`);
      return key;
    }

    // Interpolation: replace {param} with values
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }

    return text;
  }

  /**
   * Check if a translation key exists.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const currentTranslations = this.#locales.get(this.#current) || {};
    const fallbackTranslations = this.#locales.get(this.#fallback) || {};
    return key in currentTranslations || key in fallbackTranslations;
  }

  /**
   * Get the currently active locale.
   * @returns {string|null}
   */
  getCurrent() {
    return this.#current;
  }

  /**
   * Get all loaded locale codes.
   * @returns {string[]}
   */
  getAvailable() {
    return Array.from(this.#locales.keys());
  }

  /**
   * Get the fallback locale.
   * @returns {string}
   */
  getFallback() {
    return this.#fallback;
  }
} 
