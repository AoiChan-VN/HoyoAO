/**
 * Asset Registry (§20, §35, §64)
 *
 * Single source of truth for asset URLs (logo, favicon, images, fonts, etc.).
 * Consumers resolve assets BY NAME — never by hardcoded physical path (§35).
 * Changing a logo only requires updating the asset manifest (§20).
 */
export class AssetRegistry {
  /** @type {Map<string, {url:string, type?:string, description?:string}>} */
  #assets = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Register a single asset.
   * @param {string} name
   * @param {{url:string, type?:string, description?:string}} asset
   */
  register(name, asset) {
    if (!name || !asset || typeof asset.url !== 'string') {
      this.#logger.warn('assets', `Invalid asset registration: "${name}"`);
      return;
    }
    this.#assets.set(name, { ...asset });
  }

  /**
   * Register many assets from a manifest { name: { url, ... } }.
   * @param {object} manifest
   */
  registerMany(manifest) {
    if (!manifest || typeof manifest !== 'object') return;
    for (const [name, asset] of Object.entries(manifest)) {
      this.register(name, asset);
    }
    this.#logger.info('assets', `Registered assets (total: ${this.#assets.size})`);
  }

  has(name) {
    return this.#assets.has(name);
  }

  /** @returns {{url:string, type?:string}|null} full asset record */
  get(name) {
    const asset = this.#assets.get(name);
    return asset ? { ...asset } : null;
  }

  /**
   * Resolve an asset name to its URL.
   * @param {string} name
   * @returns {string|null}
   */
  resolve(name) {
    const asset = this.#assets.get(name);
    return asset ? asset.url : null;
  }

  /** @returns {string[]} registered asset names */
  names() {
    return Array.from(this.#assets.keys());
  }
} 
