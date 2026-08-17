/**
 * Service Registry (§25, §54)
 * 
 * Centralized registry for OS infrastructure services.
 * Prevents global spaghetti and hidden dependencies.
 * Services are registered during boot and injected where needed.
 */
export class ServiceRegistry {
  /** @type {Map<string, object>} */
  #services = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  register(name, instance) {
    if (this.#services.has(name)) {
      this.#logger.warn('services', `Service "${name}" is being overwritten.`);
    }
    this.#services.set(name, instance);
    this.#logger.debug('services', `Registered service: "${name}"`);
  }

  get(name) {
    const service = this.#services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in registry.`);
    }
    return service;
  }

  has(name) {
    return this.#services.has(name);
  }

  getAll() {
    return Array.from(this.#services.keys());
  }
} 
