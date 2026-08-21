import { SearchService } from '../../os/services/search.js';
import { createMockEventBus } from '../helpers/mock-event-bus.js';
import { createMockLogger } from '../helpers/mock-logger.js';
const { assert, assertEqual } = globalThis.__test;

export const tests = [
  { name: 'indexItem and query by title', fn() {
    const svc = new SearchService(createMockLogger(), createMockEventBus());
    svc.registerSource('test');
    svc.indexItem({ id: '1', source: 'test', type: 'doc', title: 'Hello World' });
    const results = svc.query('hello');
    assertEqual(results.length, 1);
    assertEqual(results[0].title, 'Hello World');
  }},
  { name: 'query by tags', fn() {
    const svc = new SearchService(createMockLogger(), createMockEventBus());
    svc.registerSource('test');
    svc.indexItem({ id: '2', source: 'test', type: 'x', title: 'Item', tags: ['alpha', 'beta'] });
    assertEqual(svc.query('alpha').length, 1);
  }},
  { name: 'empty query returns empty', fn() {
    const svc = new SearchService(createMockLogger(), createMockEventBus());
    svc.registerSource('test');
    svc.indexItem({ id: '3', source: 'test', type: 'x', title: 'Something' });
    assertEqual(svc.query('').length, 0);
  }},
  { name: 'filter by source', fn() {
    const svc = new SearchService(createMockLogger(), createMockEventBus());
    svc.registerSource('a');
    svc.registerSource('b');
    svc.indexItem({ id: '4', source: 'a', type: 'x', title: 'Shared' });
    svc.indexItem({ id: '5', source: 'b', type: 'x', title: 'Shared' });
    const results = svc.query('shared', { source: 'a' });
    assertEqual(results.length, 1);
    assertEqual(results[0].source, 'a');
  }},
  { name: 'scoring: title > tags > body', fn() {
    const svc = new SearchService(createMockLogger(), createMockEventBus());
    svc.registerSource('test');
    svc.indexItem({ id: 'a', source: 'test', type: 'x', title: 'keyword', body: '', tags: [] });
    svc.indexItem({ id: 'b', source: 'test', type: 'x', title: '', body: 'keyword', tags: [] });
    svc.indexItem({ id: 'c', source: 'test', type: 'x', title: '', body: '', tags: ['keyword'] });
    const results = svc.query('keyword');
    assertEqual(results[0].id, 'a');
    assertEqual(results[1].id, 'c');
    assertEqual(results[2].id, 'b');
  }},
];
