import { eventBus } from '../events/event-bus.js';

const MAX_DELTA = 1 / 15;
const FPS_SAMPLE_SIZE = 60;
const STATS_INTERVAL = 0.25;

export class Clock {
    #running = false;
    #lastTime = 0;
    #deltaTime = 0;
    #elapsedTime = 0;
    #frameCount = 0;
    #fpsSamples = new Float32Array(FPS_SAMPLE_SIZE);
    #fpsSampleIndex = 0;
    #fpsSampleCount = 0;
    #fpsSum = 0;
    #fps = 0;
    #statsAccumulator = 0;

    start() {
        if (this.#running) return;
        this.#running = true;
        this.#lastTime = performance.now();
        this.#deltaTime = 0;
    }

    stop() {
        this.#running = false;
    }

    reset() {
        this.#lastTime = performance.now();
        this.#deltaTime = 0;
        this.#elapsedTime = 0;
        this.#frameCount = 0;
        this.#fpsSampleIndex = 0;
        this.#fpsSampleCount = 0;
        this.#fpsSum = 0;
        this.#fps = 0;
        this.#statsAccumulator = 0;
        this.#fpsSamples.fill(0);
    }

    tick() {
        if (!this.#running) return 0;

        const now = performance.now();
        let delta = (now - this.#lastTime) / 1000;
        this.#lastTime = now;

        if (delta < 0) delta = 0;
        if (delta > MAX_DELTA) delta = MAX_DELTA;

        this.#deltaTime = delta;
        this.#elapsedTime += delta;
        this.#frameCount++;

        this.#recordFps(delta);
        this.#accumulateStats();

        return delta;
    }

    #recordFps(delta) {
        if (delta <= 0) return;

        if (this.#fpsSampleCount < FPS_SAMPLE_SIZE) {
            this.#fpsSampleCount++;
        } else {
            this.#fpsSum -= this.#fpsSamples[this.#fpsSampleIndex];
        }

        this.#fpsSamples[this.#fpsSampleIndex] = delta;
        this.#fpsSum += delta;
        this.#fpsSampleIndex = (this.#fpsSampleIndex + 1) % FPS_SAMPLE_SIZE;

        this.#fps = this.#fpsSum > 0 ? this.#fpsSampleCount / this.#fpsSum : 0;
    }

    #accumulateStats() {
        this.#statsAccumulator += this.#deltaTime;
        if (this.#statsAccumulator < STATS_INTERVAL) return;

        this.#statsAccumulator = 0;

        eventBus.emit('timing:stats', {
            fps:         this.#fps,
            deltaTime:   this.#deltaTime,
            elapsedTime: this.#elapsedTime,
            frameCount:  this.#frameCount,
        });
    }

    get running()     { return this.#running; }
    get deltaTime()   { return this.#deltaTime; }
    get elapsedTime() { return this.#elapsedTime; }
    get frameCount()  { return this.#frameCount; }
    get fps()         { return this.#fps; }
}

export const clock = new Clock(); 
