import { Renderer } from '../engine/renderer.js';
import { Camera } from '../engine/camera.js';
import { World } from '../engine/world.js';
import { Dashboard } from '../modules/dashboard/dashboard.js';

export class App {

    constructor({
        router,
        state,
        eventBus
    }) {

        if (!router) {
            throw new Error(
                'App requires router.'
            );
        }

        if (!state) {
            throw new Error(
                'App requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'App requires eventBus.'
            );
        }

        this.router = router;
        this.state = state;
        this.eventBus = eventBus;

        this.renderer = null;
        this.camera = null;
        this.world = null;
        this.dashboard = null;

        this.running = false;

        this.lastFrameTime = 0;

        this.boundLoop =
            this.loop.bind(this);
    }

    async initialize() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        if (!canvas) {

            throw new Error(
                'Canvas not found.'
            );
        }

        this.renderer =
            new Renderer({
                canvas,
                state: this.state,
                eventBus: this.eventBus
            });

        await this.renderer.initialize();

        this.camera =
            new Camera({
                state: this.state,
                eventBus: this.eventBus
            });

        await this.camera.initialize();

        this.world =
            new World({
                renderer: this.renderer,
                camera: this.camera,
                state: this.state,
                eventBus: this.eventBus
            });

        await this.world.initialize();

        this.dashboard =
            new Dashboard({
                world: this.world,
                state: this.state,
                eventBus: this.eventBus
            });

        await this.dashboard.initialize();

        this.registerEvents();

        this.state.merge({
            app: {
                ready: true,
                startedAt: Date.now()
            }
        });

        this.running = true;

        requestAnimationFrame(
            this.boundLoop
        );
    }

    registerEvents() {

        this.eventBus.on(
            'app:visibility',
            ({ hidden }) => {

                if (hidden) {

                    this.pause();

                } else {

                    this.resume();
                }
            }
        );

        this.eventBus.on(
            'router:change',
            ({ current }) => {

                this.handleRoute(
                    current
                );
            }
        );

        window.addEventListener(
            'resize',
            () => {

                this.handleResize();
            },
            {
                passive: true
            }
        );
    }

    handleRoute(route) {

        if (!route) {
            return;
        }

        this.eventBus.emit(
            'world:navigate',
            {
                route: route.name
            }
        );
    }

    handleResize() {

        if (
            this.renderer &&
            typeof this.renderer.resize === 'function'
        ) {

            this.renderer.resize();
        }

        if (
            this.camera &&
            typeof this.camera.resize === 'function'
        ) {

            this.camera.resize();
        }

        this.eventBus.emit(
            'viewport:resize',
            {
                width: window.innerWidth,
                height: window.innerHeight
            }
        );
    }

    loop(timestamp) {

        if (!this.running) {
            return;
        }

        const deltaTime =
            (timestamp -
                this.lastFrameTime) / 1000;

        this.lastFrameTime =
            timestamp;

        if (
            this.camera &&
            typeof this.camera.update === 'function'
        ) {

            this.camera.update(
                deltaTime
            );
        }

        if (
            this.world &&
            typeof this.world.update === 'function'
        ) {

            this.world.update(
                deltaTime
            );
        }

        if (
            this.dashboard &&
            typeof this.dashboard.update === 'function'
        ) {

            this.dashboard.update(
                deltaTime
            );
        }

        if (
            this.renderer &&
            typeof this.renderer.render === 'function'
        ) {

            this.renderer.render(
                deltaTime
            );
        }

        requestAnimationFrame(
            this.boundLoop
        );
    }

    pause() {

        this.running = false;

        this.eventBus.emit(
            'app:paused',
            {
                timestamp: Date.now()
            }
        );
    }

    resume() {

        if (this.running) {
            return;
        }

        this.running = true;

        this.lastFrameTime =
            performance.now();

        this.eventBus.emit(
            'app:resumed',
            {
                timestamp: Date.now()
            }
        );

        requestAnimationFrame(
            this.boundLoop
        );
    }

    destroy() {

        this.running = false;

        if (
            this.dashboard &&
            typeof this.dashboard.destroy === 'function'
        ) {

            this.dashboard.destroy();
        }

        if (
            this.world &&
            typeof this.world.destroy === 'function'
        ) {

            this.world.destroy();
        }

        if (
            this.camera &&
            typeof this.camera.destroy === 'function'
        ) {

            this.camera.destroy();
        }

        if (
            this.renderer &&
            typeof this.renderer.destroy === 'function'
        ) {

            this.renderer.destroy();
        }

        this.eventBus.emit(
            'app:destroyed'
        );
    }
} 
