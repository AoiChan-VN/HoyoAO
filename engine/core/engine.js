import { loop }              from './loop.js';
import { engineState }       from './state.js';
import { camera }            from './camera.js';
import { scene }             from './scene.js';
import { renderer }          from './renderer.js';
import { eventBus }          from '../events/event-bus.js';
import { resizeHandler }     from '../events/resize.js';
import { visibilityHandler } from '../events/visibility.js';
import { inputHandler }      from '../events/input.js';

class Engine {
    #initialized    = false;
    #unregisterLoop = null;

    init(canvas, options = {}) {
        if (this.#initialized) return true;

        resizeHandler.init();
        visibilityHandler.init();
        inputHandler.init(canvas);
        camera.init(options.camera ?? {});

        const ready = renderer.init(canvas);
        if (!ready) {
            engineState.transition('error', { message: 'Renderer init failed' });
            return false;
        }

        this.#unregisterLoop = loop.register((dt) => this.#tick(dt));
        this.#initialized = true;

        eventBus.emit('engine:initialized');
        return true;
    }

    start() {
        if (!this.#initialized) return;
        loop.start();
        engineState.transition('ready');
        eventBus.emit('engine:started');
    }

    stop() {
        if (!this.#initialized) return;
        loop.stop();
        if (engineState.isReady) {
            engineState.transition('paused');
        }
        eventBus.emit('engine:stopped');
    }

    destroy() {
        if (this.#unregisterLoop) {
            this.#unregisterLoop();
            this.#unregisterLoop = null;
        }

        loop.stop();
        renderer.destroy();
        camera.destroy();
        inputHandler.destroy();
        visibilityHandler.destroy();
        resizeHandler.destroy();
        scene.clear();

        this.#initialized = false;
        eventBus.emit('engine:destroyed');
        eventBus.clear();
    }

    #tick(dt) {
        camera.update(dt);
        scene.update(dt);
        renderer.render();
    }

    get initialized() { return this.#initialized; }
    get running()     { return loop.running; }
    get paused()      { return loop.paused; }
}

export const engine = new Engine(); 
