/**
 * Offline Sync Service (§24, §29, §25)
 *
 * Queues operations that require network while offline, persists the queue
 * across reloads, and synchronizes when connectivity returns. Triggered by
 * the "network:online" event (§29) — never by polling (§94).
 *
 * OS provides the queue + dispatch infrastructure only. Sync HANDLERS are
 * registered by Applications (§100 — business logic stays out of OS Core).
 */

let opCounter = 0;
function generateOperationId() {
  opCounter += 1;
  return `op-${Date.now()}-${opCounter}`;
}

export class OfflineSyncService {
  #storage;
  #network;
  #eventBus;
  #logger;
  #partition;

  /** @type {Array<object>} pending + failed operations */
  #queue = [];
  /** @type {Map<string, Function>} operation type → handler */
  #handlers = new Map();

  #isSyncing = false;
  #lastSyncAt = null;
  #maxAttempts;
  #unsubscribeNetwork = null;

  constructor({ storage, network, eventBus, logger, options = {} }) {
    this.#storage = storage;
    this.#network = network;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#maxAttempts = options.maxAttempts || 5;
    // Persistent queue so offline operations survive reload (§24).
    this.#partition = storage.getPartition('os:sync', ['indexeddb', 'local', 'memory']);
  }

  /**
   * Load persisted queue and subscribe to connectivity events.
   */
  async init() {
    try {
      const stored = await this.#partition.get('queue');
      if (Array.isArray(stored)) this.#queue = stored;
    } catch (err) {
      this.#logger.warn('sync', 'Failed to load persisted sync queue', { error: err.message });
      this.#queue = [];
    }

    // Auto-sync when connectivity returns (§29 event-driven, §94 no polling).
    this.#unsubscribeNetwork = this.#eventBus.on('network:online', () => {
      this.sync();
    });

    this.#logger.info('sync', `Offline sync initialised (${this.#queue.length} persisted operation(s))`);
  }

  /* ------------------------------------------------------------------ */
  /*  Handler registration (called by Applications §100)                 */
  /* ------------------------------------------------------------------ */

  /**
   * Register a sync handler for an operation type.
   * @param {string} type
   * @param {Function} handler - async (payload, operation) => void
   */
  registerHandler(type, handler) {
    if (typeof type !== 'string' || typeof handler !== 'function') {
      this.#logger.warn('sync', 'registerHandler: invalid arguments');
      return;
    }
    this.#handlers.set(type, handler);

    // Re-attempt pending operations of this type now that a handler exists.
    const hasPending = this.#queue.some((op) => op.type === type && op.status === 'pending');
    const online = !this.#network || this.#network.isOnline();
    if (hasPending && online) {
      this.sync();
    }
  }

  unregisterHandler(type) {
    this.#handlers.delete(type);
  }

  /* ------------------------------------------------------------------ */
  /*  Enqueue                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Enqueue an operation. Syncs immediately if online; otherwise persists
   * for later synchronization.
   * @param {{type:string, payload?:*, id?:string}} operation
   */
  async enqueue(operation) {
    if (!operation || typeof operation.type !== 'string') {
      this.#logger.warn('sync', 'enqueue: operation.type is required');
      return { success: false, reason: 'invalid-operation' };
    }

    const op = {
      id: operation.id || generateOperationId(),
      type: operation.type,
      payload: operation.payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending',
      lastError: null,
    };

    this.#queue.push(op);
    await this.#persist();
    this.#eventBus.emit('sync:queued', { id: op.id, type: op.type, pending: this.getPendingCount() });

    // Optimistic immediate sync when online.
    if (!this.#network || this.#network.isOnline()) {
      this.sync();
    }

    return { success: true, id: op.id };
  }

  /* ------------------------------------------------------------------ */
  /*  Sync                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Process pending operations. Safe to call repeatedly (guarded).
   * @returns {Promise<{synced:number, failed:number, pending:number, reason?:string}>}
   */
  async sync() {
    if (this.#isSyncing) return { synced: 0, failed: 0, pending: this.getPendingCount(), reason: 'already-syncing' };
    if (this.#network && !this.#network.isOnline()) {
      return { synced: 0, failed: 0, pending: this.getPendingCount(), reason: 'offline' };
    }

    const pending = this.#queue.filter((op) => op.status === 'pending');
    if (pending.length === 0) {
      return { synced: 0, failed: 0, pending: 0, reason: 'empty' };
    }

    this.#isSyncing = true;
    this.#eventBus.emit('sync:started', { pending: pending.length });

    let synced = 0;

    for (const op of pending) {
      const handler = this.#handlers.get(op.type);

      if (!handler) {
        op.attempts += 1;
        op.lastError = 'no-handler';
        if (op.attempts >= this.#maxAttempts) op.status = 'failed';
        this.#eventBus.emit('sync:progress', { id: op.id, type: op.type, ok: false, error: 'no-handler' });
        continue;
      }

      try {
        await handler(op.payload, op);
        op.status = 'synced';
        synced += 1;
        this.#eventBus.emit('sync:progress', { id: op.id, type: op.type, ok: true });
      } catch (err) {
        op.attempts += 1;
        op.lastError = err && err.message ? err.message : String(err);
        if (op.attempts >= this.#maxAttempts) op.status = 'failed';
        this.#eventBus.emit('sync:progress', { id: op.id, type: op.type, ok: false, error: op.lastError });
      }
    }

    // Drop synced operations; keep pending (retryable) + failed (inspectable).
    this.#queue = this.#queue.filter((op) => op.status !== 'synced');
    await this.#persist();

    this.#lastSyncAt = Date.now();
    this.#isSyncing = false;

    const failed = this.getFailedCount();
    const remaining = this.getPendingCount();
    this.#eventBus.emit('sync:completed', { synced, failed, pending: remaining });

    if (failed > 0) {
      this.#logger.warn('sync', `Sync completed with ${failed} failed operation(s)`);
      this.#eventBus.emit('sync:error', { failed });
    } else {
      this.#logger.info('sync', `Sync completed (${synced} synced, ${remaining} pending)`);
    }

    return { synced, failed, pending: remaining };
  }

  /* ------------------------------------------------------------------ */
  /*  Queue inspection / management                                      */
  /* ------------------------------------------------------------------ */

  getPending() {
    return this.#queue.filter((op) => op.status === 'pending').map((op) => ({ ...op }));
  }

  getFailed() {
    return this.#queue.filter((op) => op.status === 'failed').map((op) => ({ ...op }));
  }

  getPendingCount() {
    return this.#queue.filter((op) => op.status === 'pending').length;
  }

  getFailedCount() {
    return this.#queue.filter((op) => op.status === 'failed').length;
  }

  /** Reset a failed/pending operation for retry. */
  retryOperation(id) {
    const op = this.#queue.find((o) => o.id === id);
    if (!op) return false;
    op.status = 'pending';
    op.attempts = 0;
    op.lastError = null;
    this.#persist();
    return true;
  }

  /** Remove an operation from the queue. */
  removeOperation(id) {
    const idx = this.#queue.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.#queue.splice(idx, 1);
    this.#persist();
    return true;
  }

  /** Discard all failed operations. */
  clearFailed() {
    this.#queue = this.#queue.filter((op) => op.status !== 'failed');
    this.#persist();
  }

  /** Overall status for observability (§48). */
  getStatus() {
    return {
      online: this.#network ? this.#network.isOnline() : true,
      syncing: this.#isSyncing,
      pending: this.getPendingCount(),
      failed: this.getFailedCount(),
      lastSyncAt: this.#lastSyncAt,
      handlers: Array.from(this.#handlers.keys()),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Cleanup (§74)                                                      */
  /* ------------------------------------------------------------------ */

  destroy() {
    if (this.#unsubscribeNetwork) {
      this.#unsubscribeNetwork();
      this.#unsubscribeNetwork = null;
    }
    this.#handlers.clear();
    this.#queue = [];
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  async #persist() {
    try {
      await this.#partition.set('queue', this.#queue);
    } catch (err) {
      // Persistence failure must not lose in-memory queue (§75), but log it.
      this.#logger.error('sync', 'Failed to persist sync queue', { error: err.message });
    }
  }
} 
