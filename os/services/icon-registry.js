/**
 * Icon Registry (§20, §64)
 *
 * Single source of truth for icons. Components reference icons BY NAME,
 * never by hardcoded SVG/path (§20).
 *
 * Security (§39): SVG markup is parsed with DOMParser (image/svg+xml),
 * which does NOT execute scripts — safer than innerHTML.
 */
export class IconRegistry {
  /** @type {Map<string, string>} name → svg markup */
  #icons = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Register a single icon.
   * @param {string} name
   * @param {string} svgMarkup - full <svg>...</svg> string
   */
  register(name, svgMarkup) {
    if (!name || typeof svgMarkup !== 'string' || !svgMarkup.includes('<svg')) {
      this.#logger.warn('icons', `Invalid icon registration: "${name}"`);
      return;
    }
    this.#icons.set(name, svgMarkup);
  }

  /**
   * Register many icons from a { name: svg } map.
   * @param {object} definitions
   */
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

  /** @returns {string|null} raw svg markup */
  get(name) {
    return this.#icons.get(name) || null;
  }

  /**
   * Resolve an icon name into a DOM element.
   * Returns a <span class="ui-icon"> containing the parsed SVG.
   * Falls back to an empty icon if not found (§58 — do not throw).
   * @param {string} name
   * @returns {HTMLElement}
   */
  resolve(name) {
    const svgMarkup = this.#icons.get(name);
    if (!svgMarkup) {
      this.#logger.warn('icons', `Icon "${name}" not found — using fallback`);
      return this.#createFallback();
    }
    return this.#createIconElement(svgMarkup);
  }

  /** @returns {string[]} registered icon names */
  names() {
    return Array.from(this.#icons.keys());
  }

  /* ---- private ---- */

  #createIconElement(svgMarkup) {
    const wrapper = document.createElement('span');
    wrapper.className = 'ui-icon';
    wrapper.setAttribute('aria-hidden', 'true');

    // DOMParser does not execute scripts (§39).
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.documentElement;

    if (svg && svg.nodeName === 'svg') {
      wrapper.appendChild(document.importNode(svg, true));
    } else {
      this.#logger.warn('icons', 'Parsed SVG was invalid — using fallback');
      return this.#createFallback();
    }

    return wrapper;
  }

  #createFallback() {
    const span = document.createElement('span');
    span.className = 'ui-icon ui-icon--fallback';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
} 
