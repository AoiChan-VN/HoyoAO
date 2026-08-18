/**
 * Development Telemetry Service
 *
 * ⚠ DEVELOPMENT / SIMULATED DATA SOURCE (§45)
 * Generates SIMULATED telemetry for development & demonstration ONLY.
 * NEVER active unless os.mode === "development".
 *
 * Every packet is tagged origin: "development-simulation" so consumers
 * (Dashboard, etc.) can distinguish it from real data (§45).
 *
 * It feeds the REAL pipeline:
 *   Telemetry → DataService.ingest() → Indexer → Storage → EventBus
 */
export class DevelopmentTelemetryService {
  #dataService;
  #logger;
  #timer = null;
  #intervalMs;
  #running = false;

  constructor(dataService, logger, options = {}) {
    this.#dataService = dataService;
    this.#logger = logger;
    this.#intervalMs = options.intervalMs || 2000;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#logger.warn(
      'telemetry',
      'DEVELOPMENT telemetry started — all data is SIMULATED (§45)',
    );

    // First emission after a short delay so subscribers are settled.
    setTimeout(() => {
      if (!this.#running) return;
      this.#emit();
      this.#timer = setInterval(() => this.#emit(), this.#intervalMs);
    }, 500);
  }

  stop() {
    this.#running = false;
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#logger.info('telemetry', 'DEVELOPMENT telemetry stopped');
  }

  /* ---- private ---- */

  #emit() {
    const kinds = ['system-metrics', 'network-event', 'app-event'];
    const kind = kinds[this.#rand(0, kinds.length - 1)];
    const generated = this.#generateByKind(kind);

    this.#dataService.ingest(generated.payload, {
      source: 'dev-telemetry',
      origin: 'development-simulation', // §45 clearly simulated
      application: 'os',
      domain: generated.domain,
      type: generated.type,
      category: generated.category,
      ownership: 'system',
    });
  }

  #generateByKind(kind) {
    switch (kind) {
      case 'system-metrics':
        return {
          domain: 'system-metrics',
          type: 'telemetry',
          category: 'performance',
          payload: {
            cpuUsage: this.#rand(0, 100),
            memoryUsedMB: this.#rand(512, 8192),
            diskReadKBs: this.#rand(0, 3000),
            diskWriteKBs: this.#rand(0, 2000),
            timestamp: Date.now(),
          },
        };
      case 'network-event':
        return {
          domain: 'network-event',
          type: 'traffic',
          category: 'network',
          payload: {
            inboundKBs: this.#rand(0, 5000),
            outboundKBs: this.#rand(0, 2500),
            activeConnections: this.#rand(1, 500),
            latencyMs: this.#rand(1, 200),
            timestamp: Date.now(),
          },
        };
      case 'app-event':
        return {
          domain: 'app-event',
          type: 'lifecycle',
          category: 'runtime',
          payload: {
            event: ['started', 'stopped', 'heartbeat'][this.#rand(0, 2)],
            application: ['dashboard', 'server', 'web'][this.#rand(0, 2)],
            timestamp: Date.now(),
          },
        };
      default:
        return { domain: 'unclassified', type: 'unknown', category: 'unclassified', payload: {} };
    }
  }

  #rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
} 
