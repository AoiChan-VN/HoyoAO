/**
 * OS Kernel — Boot Orchestrator
 *
 * Responsibilities (§7):
 *   Boot → Load config → Init Core → Init Runtime
 *   → Discover Apps → Mount Shell → Start requested App
 *   → Handle fatal boot errors
 *
 * This module is the SINGLE entry point of the Web OS.
 * It does NOT contain application business logic.
 */

import { ConfigService } from './config.js';
import { EventBus } from './events.js';
import { Logger } from './logger.js';
import { ApplicationRegistry } from '../runtime/registry.js';
import { ApplicationLifecycle } from '../runtime/lifecycle.js';
import { Router } from '../runtime/router.js';
import { Shell } from '../shell/shell.js';

export class Kernel {
  /** @type {'UNINITIALIZED'|'BOOTING'|'RUNNING'|'FAILED'} */
  #bootState = 'UNINITIALIZED';

  #config;
  #eventBus;
  #logger;
  #registry;
  #lifecycle;
  #router;
  #shell;
  #brand;

  constructor() {
    this.#eventBus = new EventBus();
    this.#logger = new Logger(this.#eventBus);
    this.#config = new ConfigService(this.#logger);
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC API                                                         */
  /* ------------------------------------------------------------------ */

  async boot() {
    try {
      this.#bootState = 'BOOTING';
      this.#logger.info('boot', 'WEB ADMIN OS — boot sequence initiated');

      /* Phase 1 — Configuration */
      await this.#config.load('os.config.json');
      this.#logger.setLevel(this.#config.get('os.logLevel', 'info'));
      this.#logger.info('boot', 'Configuration loaded');

      /* Phase 2 — Branding */
      await this.#loadBranding();

      /* Phase 3 — Runtime */
      this.#registry = new ApplicationRegistry(this.#logger);
      this.#lifecycle = new ApplicationLifecycle(
        this.#registry, this.#logger, this.#eventBus,
      );
      this.#router = new Router(this.#logger, this.#eventBus);
      this.#logger.info('boot', 'Runtime initialised');

      /* Phase 4 — Application discovery */
      await this.#discoverApplications();

      /* Phase 5 — Mount Shell */
      const root = document.getElementById('os-root');
      if (!root) throw new Error('Fatal: #os-root element not found');

      this.#shell = new Shell({
        container: root,
        config: this.#config,
        registry: this.#registry,
        eventBus: this.#eventBus,
        logger: this.#logger,
        brand: this.#brand,
      });
      await this.#shell.mount();
      this.#logger.info('boot', 'Shell mounted');

      /* Phase 6 — Start default Application */
      await this.#startDefaultApplication();

      /* Phase 7 — Done */
      this.#bootState = 'RUNNING';
      this.#logger.info('boot', 'WEB ADMIN OS — boot sequence completed');
      this.#eventBus.emit('os:booted', { timestamp: Date.now() });

    } catch (error) {
      this.#bootState = 'FAILED';
      this.#logger.fatal('boot', 'OS boot failed', {
        error: error.message,
        stack: error.stack,
      });
      this.#renderFatalError(error);
    }
  }

  getBootState() {
    return this.#bootState;
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Branding                                                 */
  /* ------------------------------------------------------------------ */

  async #loadBranding() {
    try {
      const res = await fetch('platform/brand.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#brand = await res.json();
      this.#logger.info('boot', 'Branding loaded');
    } catch (err) {
      this.#logger.warn('boot', 'Branding unavailable — using defaults', {
        error: err.message,
      });
      this.#brand = {
        name: 'WEB ADMIN OS',
        owner: 'HoyoAO',
        copyright: '© 2026 HoyoAO. All Rights Reserved',
        logo: { src: '', alt: 'WEB ADMIN OS' },
        links: { support: '#', community: '#', status: '#' },
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Application discovery                                    */
  /* ------------------------------------------------------------------ */

  async #discoverApplications() {
    const paths = this.#config.get('applications.manifests', []);
    let count = 0;

    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (!res.ok) {
          this.#logger.warn('boot', `Manifest not found: ${path}`);
          continue;
        }
        const manifest = await res.json();
        this.#registry.register(manifest);
        count++;
      } catch (err) {
        this.#logger.warn('boot', `Manifest load error: ${path}`, {
          error: err.message,
        });
      }
    }

    this.#logger.info('boot', `Discovery complete — ${count} app(s) registered`);
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Start default Application                                */
  /* ------------------------------------------------------------------ */

  async #startDefaultApplication() {
    const appId = this.#config.get('boot.defaultApplication', '');
    if (!appId || !this.#registry.has(appId)) {
      this.#logger.info('boot', 'No default application to start');
      return;
    }

    try {
      const appModule = await this.#lifecycle.start(
        appId,
        this.#shell.getContentArea(),
      );
      this.#logger.info('boot', `Default application "${appId}" started`);
    } catch (err) {
      this.#logger.warn('boot', `Default app "${appId}" failed to start`, {
        error: err.message,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE — Fatal error rendering                                    */
  /* ------------------------------------------------------------------ */

  #renderFatalError(error) {
    const root = document.getElementById('os-root');
    if (!root) return;

    root.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'os-fatal-error';

    const h = document.createElement('h1');
    h.textContent = '⚠ OS Boot Failure';

    const msg = document.createElement('p');
    msg.textContent = error.message;

    const pre = document.createElement('pre');
    pre.textContent = error.stack || '';

    box.append(h, msg, pre);
    root.appendChild(box);
  }
}

/* -------------------------------------------------------------------- */
/*  AUTO-BOOT                                                            */
/* -------------------------------------------------------------------- */

const kernel = new Kernel();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => kernel.boot());
} else {
  kernel.boot();
} 
