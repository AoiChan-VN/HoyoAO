import { CacheService } from '../../os/services/cache.js';
import { createMockEventBus } from '../helpers/mock-event-bus.js';
import { createMockLogger } from '../helpers/mock-logger.js';

const { assert, assertEqual } = globalThis.__test;

export const tests = [
  {
    name: 'set and get',
    fn() {
      const cache = new CacheService(createMockEventBus(), createMockLogger(), { maxEntries: 10 });
      const p = cache.getPartition('test');
      p.set('k1', 'v1');
      assertEqual(p.get('k1'), 'v1');
    },
  },
  {
    name: 'has and delete',
    fn() {
      const cache = new CacheService(createMockEventBus(), createMockLogger(), { maxEntries: 10 });
      const p = cache.getPartition('test');
      p.set('k', 1);
      assert(p.has('k'));
      p.delete('k');
      assert(!p.has('k'));
    },
  },
  {
    name: 'LRU eviction when exceeding maxEntries',
    fn() {
      const bus = createMockEventBus();
      const cache = new CacheService(bus, createMockLogger(), { maxEntries: 3 });
      const p = cache.getPartition('evict');
      p.set('a', 1);
      p.set('b', 2);
      p.set('c', 3);
      p.set('d', 4); // should evict 'a'
      assert(!p.has('a'), 'a should be evicted');
      assert(p.has('b'));
      assert(p.has('d'));
      assertEqual(p.stats().size, 3);
    },
  },
  {
    name: 'get promotes to most recent (LRU)',
    fn() {
      const cache = new CacheService(createMockEventBus(), createMockLogger(), { maxEntries: 3 });
      const p = cache.getPartition('lru');
      p.set('a', 1);
      p.set('b', 2);
      p.set('c', 3);
      p.get('a'); // promote 'a' → 'b' is now oldest
      p.set('d', 4); // evicts 'b'
      assert(p.has('a'), 'a was promoted, should survive');
      assert(!p.has('b'), 'b should be evicted');
    },
  },
  {
    name: 'clear removes all entries',
    fn() {
      const cache = new CacheService(createMockEventBus(), createMockLogger(), { maxEntries: 10 });
      const p = cache.getPartition('clear');
      p.set('x', 1);
      p.set('y', 2);
      p.clear();
      assertEqual(p.stats().size, 0);
    },
  },
]; 
