export default class Engine {

    constructor({
        registry,
        renderer,
        camera,
        physics
    }) {

        this.registry = registry;
        this.renderer = renderer;
        this.camera = camera;
        this.physics = physics;

        this.running = false;

        this.lastTime = 0;

        this.systems = [];
    }

    addSystem(system) {

        this.systems.push(system);
    }

    start() {

        if (this.running) return;

        this.running = true;

        requestAnimationFrame(
            this.loop.bind(this)
        );
    }

    stop() {

        this.running = false;
    }

    loop(time) {

        if (!this.running) return;

        const dt =
            Math.min(
                (time - this.lastTime) / 1000,
                0.032
            );

        this.lastTime = time;

        this.camera.update(dt);

        for (const entity of this.registry.getAll()) {

            this.physics.update(
                entity,
                dt
            );
        }

        for (const system of this.systems) {

            if (system.update) {

                system.update(dt);
            }
        }

        this.renderer.render(
            this.registry
        );

        requestAnimationFrame(
            this.loop.bind(this)
        );
    }
} 
