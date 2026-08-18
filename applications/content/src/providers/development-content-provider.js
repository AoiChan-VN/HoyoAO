/**
 * DevelopmentContentProvider
 *
 * ⚠ DEVELOPMENT / SIMULATED DATA SOURCE (§45)
 * Generates SIMULATED content items for development and demonstration ONLY.
 * Never used in production. The UI labels the dataset as SIMULATED.
 *
 * Implements the ContentDataProvider contract (§56).
 */

import { ContentDataProvider } from './content-data-provider.js';

export class DevelopmentContentProvider extends ContentDataProvider {
  /** @type {Array<object>} */
  #items = [];
  /** @type {Set<Function>} */
  #listeners = new Set();

  constructor() {
    super();
    this.#items = this.#createInitialItems();
  }

  async fetchItems() {
    // Copies so consumers cannot mutate provider state (§5 boundary).
    return this.#items.map((it) => ({ ...it }));
  }

  /**
   * Content is relatively static in this simulation; subscription exists
   * for contract consistency and future mutation support.
   * @param {Function} onChange
   * @returns {Function} unsubscribe
   */
  subscribe(onChange) {
    this.#listeners.add(onChange);
    return () => {
      this.#listeners.delete(onChange);
    };
  }

  destroy() {
    this.#listeners.clear();
  }

  /* ---- private ---- */

  /**
   * Simulated content library — DEVELOPMENT data (§45).
   * These are NOT real articles/files.
   */
  #createInitialItems() {
    const now = Date.now();
    const day = 86400000;

    return [
      {
        id: 'cnt-001',
        title: 'Getting Started with WEB ADMIN OS',
        type: 'article',
        category: 'documentation',
        tags: ['guide', 'intro', 'os'],
        author: 'HoyoAO',
        status: 'published',
        mimeType: 'text/markdown',
        size: null,
        excerpt: 'An introduction to the Web OS architecture, applications, and shell.',
        createdAt: now - day * 12,
        updatedAt: now - day * 2,
      },
      {
        id: 'cnt-002',
        title: 'Application Package Specification',
        type: 'document',
        category: 'documentation',
        tags: ['spec', 'applications'],
        author: 'HoyoAO',
        status: 'published',
        mimeType: 'application/pdf',
        size: 245760,
        excerpt: 'Defines manifest structure, lifecycle, and OS ↔ application contracts.',
        createdAt: now - day * 10,
        updatedAt: now - day * 5,
      },
      {
        id: 'cnt-003',
        title: 'Architecture Overview Diagram',
        type: 'image',
        category: 'media',
        tags: ['diagram', 'architecture'],
        author: 'Design Team',
        status: 'published',
        mimeType: 'image/svg+xml',
        size: 18432,
        excerpt: 'High-level diagram of OS layers, runtime, and applications.',
        createdAt: now - day * 8,
        updatedAt: now - day * 8,
      },
      {
        id: 'cnt-004',
        title: 'Theming Best Practices',
        type: 'article',
        category: 'guides',
        tags: ['theme', 'design-tokens'],
        author: 'HoyoAO',
        status: 'published',
        mimeType: 'text/markdown',
        size: null,
        excerpt: 'How to use design tokens and keep themes centralized.',
        createdAt: now - day * 6,
        updatedAt: now - day * 1,
      },
      {
        id: 'cnt-005',
        title: 'Sample Dataset Export',
        type: 'file',
        category: 'resources',
        tags: ['dataset', 'export'],
        author: 'Data Team',
        status: 'draft',
        mimeType: 'application/json',
        size: 512000,
        excerpt: 'Exported dataset used for development demonstrations.',
        createdAt: now - day * 4,
        updatedAt: now - day * 4,
      },
      {
        id: 'cnt-006',
        title: 'Localization Workflow',
        type: 'article',
        category: 'guides',
        tags: ['localization', 'i18n'],
        author: 'HoyoAO',
        status: 'published',
        mimeType: 'text/markdown',
        size: null,
        excerpt: 'How localization layers and locale files work in the OS.',
        createdAt: now - day * 3,
        updatedAt: now - day * 3,
      },
      {
        id: 'cnt-007',
        title: 'Brand Assets Pack',
        type: 'file',
        category: 'media',
        tags: ['brand', 'assets'],
        author: 'Design Team',
        status: 'published',
        mimeType: 'application/zip',
        size: 1048576,
        excerpt: 'Centralized brand assets referenced by the asset registry.',
        createdAt: now - day * 2,
        updatedAt: now - day * 2,
      },
      {
        id: 'cnt-008',
        title: 'Deprecated: Legacy Admin Notes',
        type: 'document',
        category: 'archive',
        tags: ['legacy'],
        author: 'HoyoAO',
        status: 'archived',
        mimeType: 'text/plain',
        size: 10240,
        excerpt: 'Historical notes kept for reference only.',
        createdAt: now - day * 30,
        updatedAt: now - day * 20,
      },
    ];
  }
} 
