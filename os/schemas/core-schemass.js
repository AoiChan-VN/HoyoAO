/**
 * Core OS Schemas (§64, §9, §35)
 *
 * Authoritative schemas for OS-level data structures. Registered with the
 * SchemaService at boot. Applications may register their own schemas in
 * addition to these.
 */

export const CORE_SCHEMAS = [
  {
    id: 'os:data-metadata',
    version: 1,
    description: 'Metadata attached to every indexed data object (§9).',
    type: 'object',
    allowUnknown: true,
    fields: {
      source: { type: 'string', required: true },
      origin: { type: 'string', required: true },
      application: { type: 'string', required: true },
      domain: { type: 'string', required: true },
      type: { type: 'string', required: true },
      category: { type: 'string' },
      timestamp: { type: 'number', required: true },
      lifecycle: { type: 'string' },
      ownership: { type: 'string' },
      storage: { type: 'string' },
      status: { type: 'string' },
      version: { type: 'string' },
      identity: { type: 'any' },
      relationships: { type: 'array', items: { type: 'any' } },
      integrity: { type: 'any' },
    },
  },
  {
    id: 'os:resource-descriptor',
    version: 1,
    description: 'Resource descriptor managed by the Resource System (§35).',
    type: 'object',
    allowUnknown: true,
    fields: {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      version: { type: 'string' },
      owner: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      installation: { type: 'string', enum: ['installed', 'not-installed'] },
      activation: { type: 'string', enum: ['active', 'inactive'] },
    },
  },
  {
    id: 'os:sync-operation',
    version: 1,
    description: 'Operation queued by the Offline Sync Service (§24).',
    type: 'object',
    allowUnknown: true,
    fields: {
      id: { type: 'string', required: true },
      type: { type: 'string', required: true },
      payload: { type: 'any' },
      createdAt: { type: 'number', required: true },
      attempts: { type: 'number', min: 0 },
      status: { type: 'string', enum: ['pending', 'failed', 'synced'] },
    },
  },
]; 
