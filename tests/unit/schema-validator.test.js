import { SchemaValidator } from '../../runtime/schema-validator.js';

const { assert, assertEqual } = globalThis.__test;

const validator = new SchemaValidator();

export const tests = [
  {
    name: 'validates required string field',
    fn() {
      const schema = {
        fields: { name: { type: 'string', required: true } },
      };
      const result = validator.validate(schema, { name: 'hello' });
      assert(result.valid, 'Expected valid');
    },
  },
  {
    name: 'fails on missing required field',
    fn() {
      const schema = {
        fields: { name: { type: 'string', required: true } },
      };
      const result = validator.validate(schema, {});
      assert(!result.valid, 'Expected invalid');
    },
  },
  {
    name: 'validates number type',
    fn() {
      const schema = {
        fields: { age: { type: 'number' } },
      };
      const ok = validator.validate(schema, { age: 25 });
      const bad = validator.validate(schema, { age: 'hello' });
      assert(ok.valid, 'Number should be valid');
      assert(!bad.valid, 'String should fail number check');
    },
  },
  {
    name: 'validates boolean type',
    fn() {
      const schema = {
        fields: { active: { type: 'boolean' } },
      };
      const ok = validator.validate(schema, { active: true });
      const bad = validator.validate(schema, { active: 'yes' });
      assert(ok.valid, 'Boolean true is valid');
      assert(!bad.valid, 'String should fail boolean check');
    },
  },
  {
    name: 'optional field accepts undefined',
    fn() {
      const schema = {
        fields: { note: { type: 'string', required: false } },
      };
      const result = validator.validate(schema, {});
      assert(result.valid, 'Optional missing field is fine');
    },
  },
]; 
