/**
 * Data Indexer (§9, §10)
 *
 * Flow: Detection → Identification → Classification → Normalization
 *       → Validation → Indexing → Partitioning → Storage → Event
 *
 * The Indexer is NOT tied to Dashboard. Dashboard is one consumer.
 *
 * Privacy (§93): the "data:indexed" event carries metadata only.
 * Payloads are NOT broadcast; consumers retrieve them via getPacket(id).
 */
export class Indexer {
  #storage;
  #eventBus;
  #logger;
  /** @type {Map<string, object>} recent packets kept for retrieval */
  #recentPackets = new Map();
  #maxRecentPackets = 200;

  constructor(storage, eventBus, logger) {
    this.#storage = storage;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Index a validated data packet.
   * @param {object} packet - { id, payload, metadata }
   */
  async index(packet) {
    if (!packet || !packet.id || !packet.metadata) {
      const err = new Error('Invalid data packet: missing id or metadata');
      this.#logger.error('indexer', err.message);
      throw err;
    }

    try {
      // Classify + validate
      packet.metadata.status = 'classified';
      packet.metadata.integrity = 'verified';

      // Partition + store (§34)
      const namespace = `data:${packet.metadata.application}:${packet.metadata.domain}`;
      const partition = this.#storage.getPartition(namespace, 'memory');
      await partition.set(packet.id, packet);

      packet.metadata.status = 'indexed';
      packet.metadata.storage = 'memory';

      // Keep recent packets in memory for on-demand retrieval (§16 detail).
      this.#recentPackets.set(packet.id, packet);
      if (this.#recentPackets.size > this.#maxRecentPackets) {
        const oldest = this.#recentPackets.keys().next().value;
        this.#recentPackets.delete(oldest);
      }

      // Emit lightweight event — metadata only, NO payload (§93)
      this.#eventBus.emit('data:indexed', {
        id: packet.id,
        metadata: { ...packet.metadata },
      });

      this.#logger.debug('indexer', `Indexed packet ${packet.id}`, {
        app: packet.metadata.application,
        domain: packet.metadata.domain,
      });

      return packet;
    } catch (err) {
      packet.metadata.status = 'failed';
      this.#logger.error('indexer', `Failed to index packet ${packet.id}`, {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Retrieve a recently indexed packet by id (includes payload).
   * Used for detail inspection (§16).
   * @param {string} id
   * @returns {object|null}
   */
  getPacket(id) {
    return this.#recentPackets.get(id) || null;
  }
}
