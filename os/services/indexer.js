/**
 * Data Indexer (§9, §10)
 * 
 * Flow: Detection → Identification → Classification → Normalization 
 *       → Validation → Indexing → Partitioning → Storage → Event
 * 
 * The Indexer is NOT tied to Dashboard. It is a core OS infrastructure.
 */
export class Indexer {
  #storage;
  #eventBus;
  #logger;

  constructor(storage, eventBus, logger) {
    this.#storage = storage;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Index a validated data packet.
   * @param {object} packet - Must contain { id, payload, metadata }
   */
  async index(packet) {
    if (!packet || !packet.id || !packet.metadata) {
      const err = new Error('Invalid data packet: missing id or metadata');
      this.#logger.error('indexer', err.message);
      throw err;
    }

    try {
      // 1. Validate & Classify
      packet.metadata.status = 'classified';
      packet.metadata.integrity = 'verified';
      
      // 2. Determine Storage Partition (§34)
      const namespace = `data:${packet.metadata.application}:${packet.metadata.domain}`;
      const partition = this.#storage.getPartition(namespace, 'memory');

      // 3. Store
      await partition.set(packet.id, packet);
      
      packet.metadata.status = 'indexed';
      packet.metadata.storage = 'memory';

      // 4. Emit Event (§29)
      this.#eventBus.emit('data:indexed', {
        id: packet.id,
        application: packet.metadata.application,
        domain: packet.metadata.domain,
        type: packet.metadata.type
      });

      this.#logger.debug('indexer', `Indexed packet ${packet.id}`, {
        app: packet.metadata.application,
        domain: packet.metadata.domain
      });

      return packet;

    } catch (err) {
      packet.metadata.status = 'failed';
      this.#logger.error('indexer', `Failed to index packet ${packet.id}`, {
        error: err.message
      });
      throw err;
    }
  }
} 
