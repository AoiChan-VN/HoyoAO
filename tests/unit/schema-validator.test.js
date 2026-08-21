import { validateData } from '../../runtime/schema-validator.js';
const { assert } = globalThis.__test;

export const tests = [
  { name: 'validates required string field', fn() {
    const schema = { fields: { name: { type: 'string', required: true } } };
    assert(validateData(schema, { name: 'hello' }).valid);
  }},
  { name: 'fails on missing required field', fn() {
    const schema = { fields: { name: { type: 'string', required: true } } };
    assert(!validateData(schema, {}).valid);
  }},
  { name: 'validates number type', fn() {
    const schema = { fields: { age: { type: 'number' } } };
    assert(validateData(schema, { age: 25 }).valid);
    assert(!validateData(schema, { age: 'hello' }).valid);
  }},
  { name: 'validates boolean type', fn() {
    const schema = { fields: { active: { type: 'boolean' } } };
    assert(validateData(schema, { active: true }).valid);
    assert(!validateData(schema, { active: 'yes' }).valid);
  }},
  { name: 'optional field accepts undefined', fn() {
    const schema = { fields: { note: { type: 'string', required: false } } };
    assert(validateData(schema, {}).valid);
  }},
];
