import { Skybox } from './Skybox.js';
import { Camera } from './Camera.js';

export class WebGLRenderer {
    constructor(canvas, store, eventBus) {
        this.canvas = canvas;
        this.store = store;
        this.eventBus = eventBus;
        this.gl = null;
        this.skybox = null;
        this.camera = null;
        this.animationFrameId = null;
    }

    async initialize() {
        this.gl = this.canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            depth: true,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        if (!this.gl) {
            throw new Error('WebGL2 context creation failed.');
        }

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.camera = new Camera(this.canvas, this.store, this.eventBus);
        this.camera.initialize();

        this.skybox = new Skybox(this.gl, this.store);
        await this.skybox.loadTextures();

        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();

        this.startRenderLoop();
    }

    handleResize() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        const width = this.canvas.clientWidth * dpr;
        const height = this.canvas.clientHeight * dpr;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
            this.camera.updateProjection(width, height);
        }
    }

    startRenderLoop() {
        const render = (timestamp) => {
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            this.camera.update(timestamp);
            
            const viewMatrix = this.camera.getViewMatrix();
            const projectionMatrix = this.camera.getProjectionMatrix();

            this.skybox.draw(viewMatrix, projectionMatrix);

            this.animationFrameId = requestAnimationFrame(render);
        };
        this.animationFrameId = requestAnimationFrame(render);
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.camera) {
            this.camera.destroy();
        }
        if (this.skybox) {
            this.skybox.destroy();
        }
    }
}
 
