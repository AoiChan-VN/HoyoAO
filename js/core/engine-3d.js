// ./js/core/engine-3d.js

export class Engine3D {
    constructor({
        canvas,
        gl,
        xrDevice
    }) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('[ENGINE] Invalid canvas.');
        }

        if (!gl) {
            throw new Error('[ENGINE] Invalid WebGL context.');
        }

        this.canvas = canvas;
        this.gl = gl;
        this.xrDevice = xrDevice;

        this.isRunning = false;

        this.animationFrameId = 0;

        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;

        this.renderables = [];
        this.updatables = [];
    }

    async initialize() {
        this.lastFrameTime = performance.now();

        this.gl.viewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        this.lastFrameTime = performance.now();

        this.animationFrameId =
            window.requestAnimationFrame(
                this.loop.bind(this)
            );
    }

    stop() {
        this.isRunning = false;

        if (this.animationFrameId) {
            window.cancelAnimationFrame(
                this.animationFrameId
            );

            this.animationFrameId = 0;
        }
    }

    loop(timestamp) {
        if (!this.isRunning) {
            return;
        }

        this.deltaTime =
            (timestamp - this.lastFrameTime) * 0.001;

        this.elapsedTime += this.deltaTime;

        this.lastFrameTime = timestamp;

        this.update(this.deltaTime);
        this.render();

        this.animationFrameId =
            window.requestAnimationFrame(
                this.loop.bind(this)
            );
    }

    update(deltaTime) {
        for (let i = 0; i < this.updatables.length; i += 1) {
            const item = this.updatables[i];

            if (
                item &&
                typeof item.update === 'function'
            ) {
                item.update(deltaTime);
            }
        }
    }

    render() {
        const gl = this.gl;

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        for (let i = 0; i < this.renderables.length; i += 1) {
            const item = this.renderables[i];

            if (
                item &&
                typeof item.render === 'function'
            ) {
                item.render(gl);
            }
        }
    }

    resize(width, height) {
        this.gl.viewport(
            0,
            0,
            width,
            height
        );
    }

    addRenderable(renderable) {
        if (
            !renderable ||
            this.renderables.includes(renderable)
        ) {
            return;
        }

        this.renderables.push(renderable);
    }

    removeRenderable(renderable) {
        const index =
            this.renderables.indexOf(renderable);

        if (index === -1) {
            return;
        }

        this.renderables.splice(index, 1);
    }

    addUpdatable(updatable) {
        if (
            !updatable ||
            this.updatables.includes(updatable)
        ) {
            return;
        }

        this.updatables.push(updatable);
    }

    removeUpdatable(updatable) {
        const index =
            this.updatables.indexOf(updatable);

        if (index === -1) {
            return;
        }

        this.updatables.splice(index, 1);
    }

    getDeltaTime() {
        return this.deltaTime;
    }

    getElapsedTime() {
        return this.elapsedTime;
    }

    getRenderableCount() {
        return this.renderables.length;
    }

    getUpdatableCount() {
        return this.updatables.length;
    }
}
