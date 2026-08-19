/**
 * Scheduler Service (§25, §94, §74)
 *
 * Schedules one-shot and recurring background jobs. Recurring jobs are
 * re-armed only AFTER the previous run completes (setTimeout chain), which
 * prevents overlapping async runs — this is controlled scheduling, not
 * data polling (§94). All timers are cleaned up on destroy (§74).
 */

export class SchedulerService {
  /** @type {Map<string, object>} name → job */
  #jobs = new Map();
  #logger;
  #eventBus;
  #disposed = false;

  constructor(logger, eventBus) {
    this.#logger = logger;
    this.#eventBus = eventBus;
  }

  /* ---- scheduling API ---- */

  /**
   * Schedule a one-shot job.
   * @param {string} name unique job name
   * @param {Function} fn async work
   * @param {number} delayMs
   * @param {object} meta
   */
  scheduleOnce(name, fn, delayMs, meta = {}) {
    return this.#createJob(name, fn, { type: 'once', delay: Math.max(0, delayMs), meta });
  }

  /**
   * Schedule a recurring job (non-overlapping).
   * @param {string} name
   * @param {Function} fn
   * @param {number} intervalMs
   * @param {object} meta
   */
  scheduleRecurring(name, fn, intervalMs, meta = {}) {
    return this.#createJob(name, fn, { type: 'recurring', interval: Math.max(1, intervalMs), meta });
  }

  cancel(name) {
    const job = this.#jobs.get(name);
    if (!job) return false;
    if (job.timerId !== null) clearTimeout(job.timerId);
    job.timerId = null;
    job.status = 'cancelled';
    this.#jobs.delete(name);
    this.#eventBus.emit('scheduler:task-cancelled', { name });
    return true;
  }

  pause(name) {
    const job = this.#jobs.get(name);
    if (!job || job.status === 'cancelled') return false;
    if (job.timerId !== null) clearTimeout(job.timerId);
    job.timerId = null;
    job.status = 'paused';
    return true;
  }

  resume(name) {
    const job = this.#jobs.get(name);
    if (!job || job.status !== 'paused') return false;
    job.status = 'scheduled';
    const wait = job.config.type === 'recurring' ? job.config.interval : job.config.delay;
    job.nextRunAt = Date.now() + wait;
    this.#arm(job);
    return true;
  }

  /* ---- inspection (§48) ---- */

  getJobs() {
    return Array.from(this.#jobs.values()).map((j) => ({
      name: j.name,
      type: j.config.type,
      status: j.status,
      runCount: j.runCount,
      lastRunAt: j.lastRunAt,
      nextRunAt: j.nextRunAt,
      lastError: j.lastError,
      meta: j.config.meta,
    }));
  }

  getJob(name) {
    const j = this.#jobs.get(name);
    if (!j) return null;
    return {
      name: j.name,
      type: j.config.type,
      status: j.status,
      runCount: j.runCount,
      lastRunAt: j.lastRunAt,
      nextRunAt: j.nextRunAt,
      lastError: j.lastError,
      meta: j.config.meta,
    };
  }

  /* ---- cleanup (§74) ---- */

  destroy() {
    this.#disposed = true;
    for (const job of this.#jobs.values()) {
      if (job.timerId !== null) clearTimeout(job.timerId);
    }
    this.#jobs.clear();
  }

  /* ---- private ---- */

  #createJob(name, fn, config) {
    if (typeof name !== 'string' || name.length === 0) {
      this.#logger.warn('scheduler', 'createJob: name required');
      return null;
    }
    if (typeof fn !== 'function') {
      this.#logger.warn('scheduler', `createJob "${name}": fn must be a function`);
      return null;
    }
    if (this.#disposed) return null;

    // Replacing an existing job with the same name (§64 one authority per name).
    if (this.#jobs.has(name)) this.cancel(name);

    const wait = config.type === 'recurring' ? config.interval : config.delay;
    const job = {
      name,
      fn,
      config,
      status: 'scheduled',
      createdAt: Date.now(),
      lastRunAt: null,
      nextRunAt: Date.now() + wait,
      runCount: 0,
      lastError: null,
      timerId: null,
      running: false,
    };

    this.#jobs.set(name, job);
    this.#arm(job);
    this.#eventBus.emit('scheduler:scheduled', { name, type: config.type });
    return name;
  }

  #arm(job) {
    if (this.#disposed) return;
    const wait = Math.max(0, job.nextRunAt - Date.now());
    job.timerId = setTimeout(() => this.#run(job), wait);
  }

  async #run(job) {
    if (this.#disposed || !this.#jobs.has(job.name)) return;

    // Guard against overlapping runs (§94/§95).
    if (job.running) {
      if (job.config.type === 'recurring') {
        job.nextRunAt = Date.now() + job.config.interval;
        this.#arm(job);
      }
      return;
    }

    job.running = true;
    job.status = 'running';
    job.lastRunAt = Date.now();
    this.#eventBus.emit('scheduler:task-started', { name: job.name });

    try {
      await job.fn();
      job.runCount += 1;
      job.lastError = null;
      job.status = job.config.type === 'recurring' ? 'scheduled' : 'completed';
      this.#eventBus.emit('scheduler:task-completed', { name: job.name, runCount: job.runCount });
    } catch (err) {
      job.lastError = err && err.message ? err.message : String(err);
      job.status = job.config.type === 'recurring' ? 'scheduled' : 'failed';
      this.#eventBus.emit('scheduler:task-error', { name: job.name, error: job.lastError });
      this.#logger.error('scheduler', `Task "${job.name}" failed`, { error: job.lastError });
    } finally {
      job.running = false;
    }

    // One-shot jobs are removed once completed/failed.
    if (job.config.type === 'once' && (job.status === 'completed' || job.status === 'failed')) {
      this.#jobs.delete(job.name);
      return;
    }

    // Re-arm recurring jobs (non-overlapping chain).
    if (job.config.type === 'recurring' && job.status === 'scheduled' && !this.#disposed) {
      job.nextRunAt = Date.now() + job.config.interval;
      this.#arm(job);
    }
  }
} 
