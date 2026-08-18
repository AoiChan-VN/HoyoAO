/**
 * Icon Registry (§20, §64)
 *
 * Single source of truth for icons. Components reference icons BY NAME.
 *
 * Performance (§41, §95): parsing SVG via DOMParser on every resolve()
 * is duplicated work. When a cache partition is provided, parsed icons
 * are stored as <template> nodes and cloned on demand — avoiding re-parse.
 * Cache is OPTIONAL: behaviour is unchanged without it (§71 additive).
 */
export class IconRegistry {
  /** @type {Map<string, string>} name → svg markup */
  #icons = new Map();
  /** @type {object|null} cache partition { get, set } */
  #cache = null;
  #logger;

  constructor(logger, cache = null) {
    this.#logger = logger;
    this.#cache = cache || null;
  }

  register(name, svgMarkup) {
    if (!name || typeof svgMarkup !== 'string' || !svgMarkup.includes('<svg')) {
      this.#logger.warn('icons', `Invalid icon registration: "${name}"`);
      return;
    }
    this.#icons.set(name, svgMarkup);

    // Invalidate any cached template for this icon (§60 predictable change).
    if (this.#cache) {
      this.#cache.delete(this.#cacheKey(name));
    }
  }

  registerMany(definitions) {
    if (!definitions || typeof definitions !== 'object') return;
    for (const [name, svg] of Object.entries(definitions)) {
      this.register(name, svg);
    }
    this.#logger.info('icons', `Registered icons (total: ${this.#icons.size})`);
  }

  has(name) {
    return this.#icons.has(name);
  }

  get(name) {
    return this.#icons.get(name) || null;
  }

  /**
   * Resolve an icon name into a DOM element.
   * Uses cache when available to avoid re-parsing SVG (§41, §95).
   * @param {string} name
   * @returns {HTMLElement}
   */
  resolve(name) {
    const svgMarkup = this.#icons.get(name);
    if (!svgMarkup) {
      this.#logger.warn('icons', `Icon "${name}" not found — using fallback`);
      return this.#createFallback();
    }

    // Cache hit → clone the stored template (§41).
    if (this.#cache) {
      const cachedTemplate = this.#cache.get(this.#cacheKey(name));
      if (cachedTemplate) {
        const cloned = this.#fromTemplate(cachedTemplate);
        if (cloned) return cloned;
      }
    }

    // Cache miss → parse, store template, then clone.
    const template = this.#createTemplate(svgMarkup);
    if (!template) {
      this.#logger.warn('icons', `Parsed SVG invalid for "${name}" — using fallback`);
      return this.#createFallback();
    }

    if (this.#cache) {
      this.#cache.set(this.#cacheKey(name), template);
    }

    return this.#fromTemplate(template) || this.#createFallback();
  }

  names() {
    return Array.from(this.#icons.keys());
  }

  /* ---- private ---- */

  #cacheKey(name) {
    return `icon:${name}`;
  }

  #createTemplate(svgMarkup) {
    // DOMParser does not execute scripts (§39).
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.documentElement;

    if (!svg || svg.nodeName !== 'svg') return null;

    const template = document.createElement('template');
    template.content.appendChild(document.importNode(svg, true));
    return template;
  }

  #fromTemplate(template) {
    if (!template || !template.content) return null;

    const wrapper = document.createElement('span');
    wrapper.className = 'ui-icon';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(template.content.cloneNode(true));
    return wrapper;
  }

  #createFallback() {
    const span = document.createElement('span');
    span.className = 'ui-icon ui-icon--fallback';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
}
