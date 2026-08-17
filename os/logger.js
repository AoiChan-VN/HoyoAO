/**
 * Logging / Diagnostics Service (§47)
 *
 * Categories: boot, runtime, application, data, storage,
 *             network, security, resource, performance, error
 * Levels:     debug < info < warn < error < fatal
 *
 * Emits "log:entry" on the EventBus for observability (§48).
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

export class Logger {
  #eventBus;
  #level = 'debug';
  #categoryFilter = null; // null = all categories

  constructor(eventBus) {
    this.#eventBus = eventBus;
  }

  setLevel(level) {
    if (LEVELS[level] !== undefined) this.#level = level;
  }

  /** Restrict output to specific categories. */
  filterCategories(categories) {
    this.#categoryFilter = new Set(categories);
  }

  /* ---- convenience methods ---- */
  debug(cat, msg, ctx) { this.#log('debug', cat, msg, ctx); }
  info(cat, msg, ctx)  { this.#log('info', cat, msg, ctx); }
  warn(cat, msg, ctx)  { this.#log('warn', cat, msg, ctx); }
  error(cat, msg, ctx) { this.#log('error', cat, msg, ctx); }
  fatal(cat, msg, ctx) { this.#log('fatal', cat, msg, ctx); }

  /* ---- core ---- */
  #log(level, category, message, context = {}) {
    if (LEVELS[level] < LEVELS[this.#level]) return;
    if (this.#categoryFilter && !this.#categoryFilter.has(category)) return;

    const entry = {
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    const prefix = `[${category.toUpperCase()}]`;
    const consoleFn =
      level === 'debug' ? console.debug :
      level === 'info'  ? console.info  :
      level === 'warn'  ? console.warn  : console.error;

    consoleFn(prefix, message, context);

    // Observability (§48)
    this.#eventBus.emit('log:entry', entry);
  }
} 
