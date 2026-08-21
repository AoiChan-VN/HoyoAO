import { tests as manifestTests } from './unit/manifest-validator.test.js';
import { tests as schemaTests } from './unit/schema-validator.test.js';
import { tests as routeTests } from './unit/route-registry.test.js';
import { tests as permissionTests } from './unit/permission-service.test.js';
import { tests as searchTests } from './unit/search-service.test.js';
import { tests as cacheTests } from './unit/cache-service.test.js';
import { tests as schedulerTests } from './unit/scheduler-service.test.js';

const suites = [
  { name: 'ManifestValidator', tests: manifestTests },
  { name: 'SchemaValidator', tests: schemaTests },
  { name: 'RouteRegistry', tests: routeTests },
  { name: 'PermissionService', tests: permissionTests },
  { name: 'SearchService', tests: searchTests },
  { name: 'CacheService', tests: cacheTests },
  { name: 'SchedulerService', tests: schedulerTests },
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
globalThis.__test = { assert, assertEqual };

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  HoyoAO — Test Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const suite of suites) {
    console.log(`\n▶ ${suite.name}`);
    for (const t of suite.tests) {
      try {
        await t.fn();
        passed++;
        console.log(`  ✓ ${t.name}`);
      } catch (err) {
        failed++;
        console.error(`  ✗ ${t.name}`);
        console.error(`    ${err.message}`);
      }
    }
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (typeof process !== 'undefined' && failed > 0) process.exit(1);
}
run();
