/**
 * DevelopmentFileProvider
 *
 * ⚠ DEVELOPMENT / SIMULATED DATA SOURCE (§45)
 * Generates SIMULATED virtual file metadata for development ONLY.
 * Never used in production. The UI labels the dataset as SIMULATED.
 *
 * These are VIRTUAL entries (§85) — no real filesystem is accessed.
 * Implements the FileDataProvider contract (§56).
 */

import { FileDataProvider } from './file-data-provider.js';

export class DevelopmentFileProvider extends FileDataProvider {
  /** @type {Array<object>} */
  #files = [];
  /** @type {Set<Function>} */
  #listeners = new Set();

  constructor() {
    super();
    this.#files = this.#createInitialFiles();
  }

  async fetchFiles() {
    // Copies so consumers cannot mutate provider state (§5 boundary).
    return this.#files.map((f) => ({ ...f }));
  }

  /**
   * File metadata is relatively static in this simulation; subscription
   * exists for contract consistency and future mutation support.
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
   * Simulated virtual file library — DEVELOPMENT data (§45).
   * These are NOT real files.
   */
  #createInitialFiles() {
    const now = Date.now();
    const day = 86400000;

    return [
      {
        id: 'file-001',
        name: 'architecture-overview.pdf',
        category: 'documents',
        mimeType: 'application/pdf',
        size: 2457600,
        path: '/documents/architecture-overview.pdf',
        createdAt: now - day * 40,
        modifiedAt: now - day * 3,
        status: 'available',
      },
      {
        id: 'file-002',
        name: 'os-constitution.md',
        category: 'documents',
        mimeType: 'text/markdown',
        size: 184320,
        path: '/documents/os-constitution.md',
        createdAt: now - day * 60,
        modifiedAt: now - day * 1,
        status: 'available',
      },
      {
        id: 'file-003',
        name: 'brand-logo.svg',
        category: 'images',
        mimeType: 'image/svg+xml',
        size: 8192,
        path: '/images/brand-logo.svg',
        createdAt: now - day * 90,
        modifiedAt: now - day * 30,
        status: 'available',
      },
      {
        id: 'file-004',
        name: 'dashboard-screenshot.png',
        category: 'images',
        mimeType: 'image/png',
        size: 1048576,
        path: '/images/dashboard-screenshot.png',
        createdAt: now - day * 10,
        modifiedAt: now - day * 10,
        status: 'available',
      },
      {
        id: 'file-005',
        name: 'intro-video.mp4',
        category: 'media',
        mimeType: 'video/mp4',
        size: 52428800,
        path: '/media/intro-video.mp4',
        createdAt: now - day * 20,
        modifiedAt: now - day * 20,
        status: 'offline',
      },
      {
        id: 'file-006',
        name: 'notification-sound.mp3',
        category: 'media',
        mimeType: 'audio/mpeg',
        size: 524288,
        path: '/media/notification-sound.mp3',
        createdAt: now - day * 15,
        modifiedAt: now - day * 15,
        status: 'available',
      },
      {
        id: 'file-007',
        name: 'release-v1.0.0.zip',
        category: 'archives',
        mimeType: 'application/zip',
        size: 10485760,
        path: '/archives/release-v1.0.0.zip',
        createdAt: now - day * 5,
        modifiedAt: now - day * 5,
        status: 'available',
      },
      {
        id: 'file-008',
        name: 'backup-config.json',
        category: 'other',
        mimeType: 'application/json',
        size: 4096,
        path: '/other/backup-config.json',
        createdAt: now - day * 7,
        modifiedAt: now - day * 2,
        status: 'available',
      },
      {
        id: 'file-009',
        name: 'sample-dataset.csv',
        category: 'other',
        mimeType: 'text/csv',
        size: 3145728,
        path: '/other/sample-dataset.csv',
        createdAt: now - day * 4,
        modifiedAt: now - day * 4,
        status: 'syncing',
      },
      {
        id: 'file-010',
        name: 'user-guide.pdf',
        category: 'documents',
        mimeType: 'application/pdf',
        size: 5242880,
        path: '/documents/user-guide.pdf',
        createdAt: now - day * 25,
        modifiedAt: now - day * 6,
        status: 'available',
      },
    ];
  }
} 
