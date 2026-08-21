import { ManifestValidator } from '../../runtime/manifest-validator.js';
import { createMockLogger } from '../helpers/mock-logger.js';
const { assert } = globalThis.__test;
const validator = new ManifestValidator(createMockLogger());

export const tests = [
  { name: 'valid manifest passes', fn() {
    assert(validator.validate({ id: 'test-app', name: 'Test', version: '1.0.0', entry: 'applications/test/app.js' }).valid);
  }},
  { name: 'missing id fails', fn() {
    assert(!validator.validate({ name: 'X', version: '1.0.0', entry: 'x.js' }).valid);
  }},
  { name: 'missing name fails', fn() {
    assert(!validator.validate({ id: 'x', version: '1.0.0', entry: 'x.js' }).valid);
  }},
  { name: 'missing version fails', fn() {
    assert(!validator.validate({ id: 'x', name: 'X', entry: 'x.js' }).valid);
  }},
  { name: 'missing entry fails', fn() {
    assert(!validator.validate({ id: 'x', name: 'X', version: '1.0.0' }).valid);
  }},
  { name: 'null input fails', fn() {
    assert(!validator.validate(null).valid);
  }},
  { name: 'permissions array validated', fn() {
    assert(validator.validate({ id: 'x', name: 'X', version: '1.0.0', entry: 'x.js', permissions: ['data.read', 'network'] }).valid);
  }},
];
