/**
 * Mock Data Provider (§45)
 * 
 * STRICTLY FOR DEVELOPMENT / TESTING.
 * DO NOT USE IN PRODUCTION.
 * Provides deterministic, fake system metrics to test the Indexer and Dashboard.
 */
import { DataProvider } from './base.js';

export class MockSystemMetricsProvider extends DataProvider {
  async fetch() {
    // §45: Clearly identified as MOCK / DEVELOPMENT data
    const mockData = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 64, // GB
      networkIn: Math.floor(Math.random() * 1000), // MB/s
      networkOut: Math.floor(Math.random() * 500), // MB/s
      activeConnections: Math.floor(Math.random() * 5000),
      timestamp: Date.now()
    };

    return {
      data: mockData,
      meta: {
        source: 'mock-provider',
        origin: 'development',
        application: 'dashboard',
        domain: 'system-metrics',
        type: 'telemetry',
        category: 'performance',
        ownership: 'system'
      }
    };
  }
} 
