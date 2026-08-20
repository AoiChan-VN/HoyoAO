import { ManifestValidator } from '../../runtime/manifest-validator.js';
import { createMockLogger } from '../helpers/mock-logger.js';

const { assert, assertEqual } = globalThis.__test;

const logger = createMockLogger();
const validator = new ManifestValidator(logger);

export const tests = [
  {
    name: 'valid manifest passes',
    fn() {
      const result = validator.validate({
        id: 'test-app',
        name: 'Test',
        version: '1.0.0',
        entry: 'applications/test/app.js',
      });
      assert(result.valid, 'Expected valid manifest');
    },
  },
  {
    name: 'missing id fails',
    fn() {
      const result = validator.validate({ name: 'X', version: '1.0.0', entry: 'x.js' });
      assert(!result.valid, 'Expected invalid');
    },
  },
  {
    name: 'missing name fails',
    fn() {
      const result = validator.validate({ id: 'x', version: '1.0.0', entry: 'x.js' });
      assert(!result.valid, 'Expected invalid');
    },
  },
  {
    name: 'missing version fails',
    fn() {
      const result = validator.validate({ id: 'x', name: 'X', entry: 'x.js' });
      assert(!result.valid, 'Expected invalid');
    },
  },
  {
    name: 'missing entry fails',
    fn() {
      const result = validator.validate({ id: 'x', name: 'X', version: '1.0.0' });
      assert(!result.valid, 'Expected invalid');
    },
  },
  {
    name: 'null input fails',
    fn() {
      const result = validator.validate(null);
      assert(!result.valid, 'Expected invalid for null');
    },
  },
  {
    name: 'permissions array validated',
    fn() {
      const result = validator.validate({
        id: 'x', name: 'X', version: '1.0.0', entry: 'x.js',
        permissions: ['data.read', 'network'],
      });
      assert(result.valid, 'Should accept valid permissions array');
    },
  },
]; 
