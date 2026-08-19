/**
 * Schema Service (§25, §64, §83)
 *
 * Single source of truth for data schemas (§64). Registers schemas from the
 * OS and Applications, and validates data at boundaries (§83) using the pure
 * SchemaValidator engine.
 */

import { validateData } from '../../runtime/schema-validator.js';

export class SchemaService {
  /** @type {Map<string, object>} schemaId → schema */
  #schemas = new Map();
  #logger;
  #eventBus;

  constructor(logger, eventBus) {
    this.#logger = logger;
    this.#eventBus = eventBus;
  }

  /**
   * Register a schema.
   * @param {object} schema - { id, version?, description?, type, fields, ... }
   */
  registerSchema(schema) {
    if (!schema || typeof schema.id !== 'string' || schema.id.length === 0) {
      this.#logger.warn('schema', 'registerSchema: schema.id is required');
      return { success: false, reason: 'invalid-schema' };
    }
    if (this.#schemas.has(schema.id)) {
      this.#logger.warn('schema', `Schema "${schema.id}" already registered — overwriting`);
    }

    this.#schemas.set(schema.id, { ...schema, version: schema.version || 1 });
    this.#eventBus.emit('schema:registered', { id: schema.id });
    this.#logger.info('schema', `Registered schema "${schema.id}"`);
    return { success: true, id: schema.id };
  }

  registerMany(schemas) {
    if (!Array.isArray(schemas)) return;
    for (const s of schemas) this.registerSchema(s);
  }

  getSchema(id) {
    const s = this.#schemas.get(id);
    return s ? { ...s } : null;
  }

  hasSchema(id) {
    return this.#schemas.has(id);
  }

  unregisterSchema(id) {
    return this.#schemas.delete(id);
  }

  /** Summary list for observability (§48). */
  listSchemas() {
    return Array.from(this.#schemas.values()).map((s) => ({
      id: s.id,
      version: s.version,
      description: s.description || '',
    }));
  }

  /**
   * Validate data against a registered schema (§83 boundary validation).
   * @param {string} schemaId
   * @param {*} data
   */
  validate(schemaId, data) {
    const schema = this.#schemas.get(schemaId);
    if (!schema) {
      return {
        valid: false,
        errors: [{ path: '(root)', message: `Schema "${schemaId}" not found` }],
        warnings: [],
      };
    }
    return validateData(schema, data);
  }

  /**
   * Validate data against an inline schema (no registration required).
   * @param {object} schema
   * @param {*} data
   */
  validateWith(schema, data) {
    return validateData(schema, data);
  }
} 
