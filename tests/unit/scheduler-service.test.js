import { SchedulerService } from '../../os/services/scheduler.js';
import { createMockEventBus } from '../helpers/mock-event-bus.js';
import { createMockLogger } from '../helpers/mock-logger.js';
const { assert, assertEqual } = globalThis.__test;
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export const tests = [
  { name: 'scheduleOnce runs after delay', async fn() {
    const svc = new SchedulerService(createMockLogger(), createMockEventBus());
    let ran = false;
    svc.scheduleOnce('t1', () => { ran = true; }, 20);
    await delay(50);
    assert(ran);
    svc.destroy();
  }},
  { name: 'cancel prevents execution', async fn() {
    const svc = new SchedulerService(createMockLogger(), createMockEventBus());
    let ran = false;
    svc.scheduleOnce('t2', () => { ran = true; }, 50);
    svc.cancel('t2');
    await delay(80);
    assert(!ran);
    svc.destroy();
  }},
  { name: 'scheduleRecurring runs multiple times', async fn() {
    const svc = new SchedulerService(createMockLogger(), createMockEventBus());
    let count = 0;
    svc.scheduleRecurring('t3', () => { count++; }, 20);
    await delay(90);
    svc.cancel('t3');
    assert(count >= 3);
    svc.destroy();
  }},
  { name: 'getJobs returns job info', fn() {
    const svc = new SchedulerService(createMockLogger(), createMockEventBus());
    svc.scheduleOnce('info-test', () => {}, 9999);
    const jobs = svc.getJobs();
    assertEqual(jobs.length, 1);
    assertEqual(jobs[0].name, 'info-test');
    assertEqual(jobs[0].type, 'once');
    svc.destroy();
  }},
  { name: 'destroy clears all timers', async fn() {
    const svc = new SchedulerService(createMockLogger(), createMockEventBus());
    let ran = false;
    svc.scheduleOnce('d1', () => { ran = true; }, 30);
    svc.destroy();
    await delay(60);
    assert(!ran);
  }},
];
