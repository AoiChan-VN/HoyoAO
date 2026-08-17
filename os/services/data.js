/**
 * Data Service (§8, §11, §56)
 * 
 * Central ingestion point. Receives raw data from Providers,
 * wraps it in a Data Packet with strict metadata (§9), 
 * and forwards to the Indexer.
 */
export class DataService {
  #indexer;
  #eventBus;
  #logger;

  constructor(indexer, eventBus, logger) {
    this.#indexer = indexer;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Ingest raw data from a source.
   * @param {*} rawData 
   * @param {object} sourceMeta - Metadata describing the source (§9)
   */
  async ingest(rawData, sourceMeta = {}) {
    this.#eventBus.emit('data:received', { source: sourceMeta.source });

    // Construct Data Packet with mandatory metadata (§9)
    const packet = {
      id: crypto.randomUUID(),
      payload: rawData,
      metadata: {
        source: sourceMeta.source || 'unknown',
        origin: sourceMeta.origin || 'unknown',
        application: sourceMeta.application || 'os',
        domain: sourceMeta.domain || 'unclassified',
        type: sourceMeta.type || 'unknown',
        category: sourceMeta.category || 'unclassified',
        timestamp: Date.now(),
        lifecycle: 'active',
        ownership: sourceMeta.ownership || 'system',
        storage: 'pending',
        status: 'ingested',
        version: sourceMeta.version || '1.0.0',
        identity: sourceMeta.identity || null,
        relationships: sourceMeta.relationships || [],
        integrity: 'pending'
      }
    };

    try {
      const indexedPacket = await this.#indexer.index(packet);
      this.#eventBus.emit('data:ingested', { id: indexedPacket.id });
      return indexedPacket;
    } catch (err) {
      this.#logger.error('data', 'Ingestion failed', { error: err.message });
      throw err;
    }
  }
} 
