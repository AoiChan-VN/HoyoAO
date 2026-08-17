/**
 * Theme Service (§21)
 *
 * Centralized theme management using design tokens.
 * Themes are defined as JSON files containing CSS variable overrides.
 * Applying a theme sets CSS custom properties on document.documentElement.
 *
 * Supports: Light, Dark, custom themes, application themes,
 * accessibility adjustments — without rewriting components (§21).
 *
 * Respects reduced-motion preferences (§96).
 */

export class ThemeService {
  /** @type {Map<string, object>} theme name → token map */
  #themes = new Map();
  #current = null;
  #config;
  #eventBus;
  #logger;

  constructor(config, eventBus, logger) {
    this.#config = config;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Initialize: load and apply the default theme from config.
   */
  async init() {
    const defaultTheme = this.#config.get('theme.default', 'dark');
    await this.loadTheme(defaultTheme);
    this.apply(defaultTheme);
    this.#logger.info('theme', `Theme service initialised with "${defaultTheme}"`);
  }

  /**
   * Register a theme programmatically.
   * @param {string} name
   * @param {object} tokens - Map of CSS variable name → value
   */
  register(name, tokens) {
    if (!name || typeof tokens !== 'object') {
      this.#logger.warn('theme', `Invalid theme registration: "${name}"`);
      return;
    }
    this.#themes.set(name, tokens);
    this.#logger.debug('theme', `Registered theme "${name}" with ${Object.keys(tokens).length} tokens`);
  }

  /**
   * Load a theme definition from platform/themes/{name}.json
   * @param {string} name
   */
  async loadTheme(name) {
    if (this.#themes.has(name)) return;

    try {
      const res = await fetch(`platform/themes/${name}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const theme = await res.json();

      if (!theme.tokens || typeof theme.tokens !== 'object') {
        throw new Error(`Theme "${name}" missing "tokens" object`);
      }

      this.register(name, theme.tokens);
    } catch (err) {
      this.#logger.warn('theme', `Failed to load theme "${name}"`, {
        error: err.message,
      });
    }
  }

  /**
   * Apply a registered theme by setting CSS variables on :root.
   * @param {string} name
   */
  apply(name) {
    const tokens = this.#themes.get(name);
    if (!tokens) {
      this.#logger.warn('theme', `Cannot apply unknown theme "${name}"`);
      return;
    }

    if (typeof document === 'undefined') {
      this.#logger.warn('theme', 'No document available — theme not applied to DOM');
      this.#current = name;
      return;
    }

    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
    }

    const previous = this.#current;
    this.#current = name;

    this.#eventBus.emit('theme:changed', {
      theme: name,
      previous,
      tokenCount: Object.keys(tokens).length,
    });

    this.#logger.info('theme', `Theme applied: "${name}"`);
  }

  /**
   * Get the currently active theme name.
   * @returns {string|null}
   */
  getCurrent() {
    return this.#current;
  }

  /**
   * Get all registered theme names.
   * @returns {string[]}
   */
  getAvailable() {
    return Array.from(this.#themes.keys());
  }

  /**
   * Check if the user prefers reduced motion (§96).
   * @returns {boolean}
   */
  prefersReducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if the user prefers a specific color scheme.
   * @param {'light'|'dark'} scheme
   * @returns {boolean}
   */
  prefersColorScheme(scheme) {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches;
  }
} 
