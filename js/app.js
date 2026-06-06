// ./js/app.js

import { WebGLContext } from './core/webgl-context.js';
import { Engine3D } from './core/engine-3d.js';
import { XRDevice } from './core/xr-device.js';

const canvas = document.getElementById('xr-canvas');
const loader = document.getElementById('xr-loader');

if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('[APP] Canvas #xr-canvas not found.');
}

class Application {
    constructor() {
        this.canvas = canvas;
        this.glContext = null;
        this.xrDevice = null;
        this.engine = null;
        this.isRunning = false;
    }

    async initialize() {
        this.glContext = new WebGLContext(this.canvas);

        await this.glContext.initialize();

        this.xrDevice = new XRDevice();

        await this.xrDevice.initialize();

        this.engine = new Engine3D({
            canvas: this.canvas,
            gl: this.glContext.getContext(),
            xrDevice: this.xrDevice
        });

        await this.engine.initialize();

        this.resize();

        window.addEventListener(
            'resize',
            () => this.resize(),
            { passive: true }
        );

        this.hideLoader();
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.engine) {
            this.engine.resize(width, height);
        }
    }

    hideLoader() {
        if (!loader) {
            return;
        }

        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';

        window.setTimeout(() => {
            loader.remove();
        }, 300);
    }

    start() {
        if (!this.engine) {
            throw new Error('[APP] Engine3D has not been initialized.');
        }

        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.engine.start();
    }
}

async function bootstrap() {
    try {
        const app = new Application();

        await app.initialize();

        app.start();

        window.xrApplication = app;
    } catch (error) {
        console.error(error);

        if (loader) {
            loader.innerHTML = `
                <div id="xr-loader-content">
                    <div id="xr-loader-text">
                        XR Startup Failed
                    </div>
                </div>
            `;
        }
    }
}

bootstrap();
