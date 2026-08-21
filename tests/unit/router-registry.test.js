import { RouteRegistry } from '../../runtime/route-registry.js';
import { createMockLogger } from '../helpers/mock-logger.js';
const { assert, assertEqual } = globalThis.__test;

export const tests = [
  { name: 'register and resolve route', fn() {
    const reg = new RouteRegistry(createMockLogger());
    reg.register({ path: '/os/settings', scope: 'os', kind: 'os' });
    const route = reg.resolve('/os/settings');
    assert(route !== null);
    assertEqual(route.scope, 'os');
  }},
  { name: 'rejects invalid route', fn() {
    const reg = new RouteRegistry(createMockLogger());
    reg.register(null);
    reg.register({ path: '/x' });
    assertEqual(reg.getAll().length, 0);
  }},
  { name: 'getOSRoutes filters correctly', fn() {
    const reg = new RouteRegistry(createMockLogger());
    reg.register({ path: '/os/a', scope: 'os', kind: 'os', order: 2 });
    reg.register({ path: '/os/b', scope: 'os', kind: 'os', order: 1 });
    reg.register({ path: '/apps/x', scope: 'x', kind: 'application' });
    const os = reg.getOSRoutes();
    assertEqual(os.length, 2);
    assertEqual(os[0].path, '/os/b');
  }},
  { name: 'getApplicationRoutes filters correctly', fn() {
    const reg = new RouteRegistry(createMockLogger());
    reg.register({ path: '/os/a', scope: 'os', kind: 'os' });
    reg.register({ path: '/apps/dash', scope: 'dashboard', kind: 'application' });
    const apps = reg.getApplicationRoutes();
    assertEqual(apps.length, 1);
    assertEqual(apps[0].scope, 'dashboard');
  }},
  { name: 'unregister removes route', fn() {
    const reg = new RouteRegistry(createMockLogger());
    reg.register({ path: '/os/x', scope: 'os', kind: 'os' });
    assert(reg.has('/os/x'));
    reg.unregister('/os/x');
    assert(!reg.has('/os/x'));
  }},
];
