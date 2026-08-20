import { PermissionService } from '../../os/services/permission.js';
import { createMockEventBus } from '../helpers/mock-event-bus.js';
import { createMockLogger } from '../helpers/mock-logger.js';

const { assert, assertEqual } = globalThis.__test;

export const tests = [
  {
    name: 'registerApp grants known permissions only',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app1', ['data.read', 'fake.perm', 'network']);
      const perms = svc.getPermissions('app1');
      assert(perms.includes('data.read'));
      assert(perms.includes('network'));
      assert(!perms.includes('fake.perm'));
    },
  },
  {
    name: 'has() returns true for granted',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app2', ['storage.read']);
      assert(svc.has('app2', 'storage.read'));
      assert(!svc.has('app2', 'network'));
    },
  },
  {
    name: 'unregisterApp removes all permissions',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app3', ['data.read']);
      svc.unregisterApp('app3');
      assertEqual(svc.getPermissions('app3').length, 0);
    },
  },
  {
    name: 'grant/revoke at runtime',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app4', []);
      assert(!svc.has('app4', 'network'));
      svc.grant('app4', 'network');
      assert(svc.has('app4', 'network'));
      svc.revoke('app4', 'network');
      assert(!svc.has('app4', 'network'));
    },
  },
  {
    name: 'cannot grant unknown permission',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app5', []);
      const result = svc.grant('app5', 'totally.unknown');
      assert(!result);
    },
  },
  {
    name: 'audit log records events',
    fn() {
      const svc = new PermissionService(createMockEventBus(), createMockLogger());
      svc.registerApp('app6', ['data.read']);
      svc.has('app6', 'network'); // denied
      const log = svc.getAuditLog();
      assert(log.length >= 2); // granted + denied
      assert(log.some(e => e.action === 'denied'));
    },
  },
]; 
