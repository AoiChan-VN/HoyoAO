import { App } from './app.js';
import { Router } from './router.js';
import { State } from './state.js';
import { EventBus } from './eventbus.js';

const REQUIRED_DOM_IDS = [
    'webgl-canvas',
    'ui-overlay',
    'app-logo',
    'gyro-toggle',
    'motion-toggle'
];

class Bootstrap {

    constructor() {

        this.app = null;

        this.validateEnvironment();

        this.eventBus = new EventBus();

        this.state = new State();

        this.router = new Router({
            state: this.state,
            eventBus: this.eventBus
        });
    }

    validateEnvironment() {

        if (!window.WebGL2RenderingContext) {
            throw new Error(
                'WebGL2 is not supported by this browser.'
            );
        }

        for (const id of REQUIRED_DOM_IDS) {

            const element = document.getElementById(id);

            if (!element) {
                throw new Error(
                    `Required DOM element missing: ${id}`
                );
            }
        }
    }

    registerGlobalHandlers() {

        window.addEventListener(
            'error',
            (event) => {

                console.error(
                    '[Global Error]',
                    event.error || event.message
                );
            },
            { passive: true }
        );

        window.addEventListener(
            'unhandledrejection',
            (event) => {

                console.error(
                    '[Unhandled Promise Rejection]',
                    event.reason
                );
            }
        );

        document.addEventListener(
            'visibilitychange',
            () => {

                this.eventBus.emit(
                    'app:visibility',
                    {
                        hidden: document.hidden
                    }
                );
            },
            { passive: true }
        );
    }

    registerAccessibility() {

        const gyroButton =
            document.getElementById('gyro-toggle');

        const motionButton =
            document.getElementById('motion-toggle');

        gyroButton.addEventListener(
            'click',
            () => {

                this.eventBus.emit(
                    'gyro:toggle-request'
                );
            }
        );

        motionButton.addEventListener(
            'click',
            () => {

                const current =
                    this.state.get(
                        'accessibility.reducedMotion'
                    );

                const next = !current;

                this.state.set(
                    'accessibility.reducedMotion',
                    next
                );

                motionButton.textContent =
                    next
                        ? 'Reduced Motion: ON'
                        : 'Reduced Motion';

                this.eventBus.emit(
                    'accessibility:reduced-motion',
                    {
                        enabled: next
                    }
                );
            }
        );
    }

    async start() {

        this.registerGlobalHandlers();

        this.registerAccessibility();

        this.router.initialize();

        this.app = new App({
            router: this.router,
            state: this.state,
            eventBus: this.eventBus
        });

        await this.app.initialize();

        this.eventBus.emit(
            'app:started',
            {
                timestamp: Date.now()
            }
        );

        console.info(
            '[Spatial Web Engine] Started'
        );
    }
}

async function boot() {

    try {

        const bootstrap =
            new Bootstrap();

        await bootstrap.start();

    } catch (error) {

        console.error(error);

        document.body.innerHTML = `
            <div
                style="
                position:fixed;
                inset:0;
                display:flex;
                justify-content:center;
                align-items:center;
                background:#05080d;
                color:#ffffff;
                font-family:Arial,sans-serif;
                padding:32px;
                text-align:center;
                "
            >
                <div>
                    <h1>Application Startup Failure</h1>
                    <p>${String(error.message)}</p>
                </div>
            </div>
        `;
    }
}

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        boot,
        {
            once: true
        }
    );

} else {

    boot();
} 
