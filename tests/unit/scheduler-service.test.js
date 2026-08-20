import { SchedulerService } from '../../os/services/scheduler.js';
import { createMockEventBus } from '../helpers/mock-event-bus.js';
import { createMockLogger } from '../helpers/mock-logger.js';

const { assert, assertEqual } = globalThis.__test;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const tests = [
  {
    name: 'scheduleOnce runs after delay',
    async fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      let ran = false;
      svc.scheduleOnce('t1', () => { ran = true; }, 20);
      await delay(50);
      assert(ran, 'Should have run');
      svc.destroy();
    },
  },
  {
    name: 'cancel prevents execution',
    async fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      let ran = false;
      svc.scheduleOnce('t2', () => { ran = true; }, 50);
      svc.cancel('t2');
      await delay(80);
      assert(!ran, 'Should not run after cancel');
      svc.destroy();
    },
  },
  {
    name: 'scheduleRecurring runs multiple times',
    async fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      let count = 0;
      svc.scheduleRecurring('t3', () => { count++; }, 20);
      await delay(90);
      svc.cancel('t3');
      assert(count >= 3, `Expected >= 3 runs, got ${count}`);
      svc.destroy();
    },
  },
  {
    name: 'pause and resume',
    async fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      let count = 0;
      svc.scheduleRecurring('t4', () => { count++; }, 20);
      await delay(50);
      const before = count;
      svc.pause('t4');
      await delay(60);
      assertEqual(count, before, 'Should not run while paused');
      svc.resume('t4');
      await delay(50);
      assert(count > before, 'Should run after resume');
      svc.destroy();
    },
  },
  {
    name: 'getJobs returns job info',
    fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      svc.scheduleOnce('info-test', () => {}, 9999);
      const jobs = svc.getJobs();
      assertEqual(jobs.length, 1);
      assertEqual(jobs[0].name, 'info-test');
      assertEqual(jobs[0].type, 'once');
      svc.destroy();
    },
  },
  {
    name: 'destroy clears all timers',
    async fn() {
      const svc = new SchedulerService(createMockLogger(), createMockEventBus());
      let ran = false;
      svc.scheduleOnce('d1', () => { ran = true; }, 30);
      svc.destroy();
      await delay(60);
      assert(!ran, 'Timer should be cleared after destroy');
    },
  },
]; 
