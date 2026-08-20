/**
 * Offline Sync Service (§24, §29, §25)
 *
 * FIX B3: a missing handler is NOT counted as a failed attempt. The
 * operation stays "pending" until an Application registers a handler for
 * that type (registerHandler re-triggers sync). This prevents persisted
 * operations from being marked failed before apps finish mounting.
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

  #queue = [];
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
    this.#partition = storage.getPartition('os:sync', ['indexeddb', 'local', 'memory']);
  }

  async init() {
    try {
      const stored = await this.#partition.get('queue');
      if (Array.isArray(stored)) this.#queue = stored;
    } catch (err) {
      this.#logger.warn('sync', 'Failed to load persisted sync queue', { error: err.message });
      this.#queue = [];
    }

    this.#unsubscribeNetwork = this.#eventBus.on('network:online', () => {
      this.sync();
    });

    this.#logger.info('sync', `Offline sync initialised (${this.#queue.length} persisted operation(s))`);
  }

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

    if (!this.#network || this.#network.isOnline()) {
      this.sync();
    }

    return { success: true, id: op.id };
  }

  async sync() {
    if (this.#isSyncing) {
      return { synced: 0, failed: 0, pending: this.getPendingCount(), reason: 'already-syncing' };
    }
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
        // FIX B3: a missing handler is NOT a failure. Keep the operation
        // pending until a handler is registered; do not count attempts.
        op.lastError = 'no-handler';
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
        if (op.attempts >= this.#maxAttempts) {
          op.status = 'failed';
        }
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

  retryOperation(id) {
    const op = this.#queue.find((o) => o.id === id);
    if (!op) return false;
    op.status = 'pending';
    op.attempts = 0;
    op.lastError = null;
    this.#persist();
    return true;
  }

  removeOperation(id) {
    const idx = this.#queue.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.#queue.splice(idx, 1);
    this.#persist();
    return true;
  }

  clearFailed() {
    this.#queue = this.#queue.filter((op) => op.status !== 'failed');
    this.#persist();
  }

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

  destroy() {
    if (this.#unsubscribeNetwork) {
      this.#unsubscribeNetwork();
      this.#unsubscribeNetwork = null;
    }
    this.#handlers.clear();
    this.#queue = [];
  }

  async #persist() {
    try {
      await this.#partition.set('queue', this.#queue);
    } catch (err) {
      this.#logger.error('sync', 'Failed to persist sync queue', { error: err.message });
    }
  }
} 
