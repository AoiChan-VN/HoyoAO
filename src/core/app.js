import { Storage } from "../storage/local.js";
import { IndexedStorage } from "../storage/indexeddb.js";

import { ThemeManager } from "../settings/theme.js";
import { LanguageManager } from "../settings/language.js";

import { Router } from "../router/router.js";

import { SearchEngine } from "../search/indexer.js";

import { OrientationController } from "../gyroscope/orientation.js";
import { MotionController } from "../gyroscope/motion.js";
import { PointerFallback } from "../gyroscope/fallback.js";

import { ParallaxEngine } from "../animation/parallax.js";

class Application {

    constructor() {

        this.started = false;

        this.modules = new Map();

        this.abortController =
            new AbortController();

        this.performanceMetrics = {

            bootStart:
                performance.now(),

            bootEnd: 0,

            memory: null
        };

        this.handleFatalError =
            this.handleFatalError.bind(this);

        this.handleUnhandledRejection =
            this.handleUnhandledRejection.bind(this);
    }

    async start() {

        if (this.started) {
            return;
        }

        try {

            this.attachGlobalHandlers();

            await this.initializeStorage();

            await this.initializeSettings();

            await this.initializeRouter();

            await this.initializeSearch();

            await this.initializeMotion();

            await this.initializeParallax();

            await this.registerServiceWorker();

            this.startMonitoring();

            this.started = true;

            this.performanceMetrics.bootEnd =
                performance.now();

            console.info(
                "[Aoi]",
                "Application Started",
                this.performanceMetrics
            );

        } catch (error) {

            this.handleFatalError(error);
        }
    }

    attachGlobalHandlers() {

        window.addEventListener(
            "error",
            this.handleFatalError,
            {
                passive: true
            }
        );

        window.addEventListener(
            "unhandledrejection",
            this.handleUnhandledRejection,
            {
                passive: true
            }
        );
    }

    async initializeStorage() {

        const local =
            new Storage();

        const indexed =
            new IndexedStorage();

        await indexed.initialize();

        this.modules.set(
            "storage",
            local
        );

        this.modules.set(
            "indexeddb",
            indexed
        );
    }

    async initializeSettings() {

        const storage =
            this.modules.get(
                "storage"
            );

        const theme =
            new ThemeManager(
                storage
            );

        const language =
            new LanguageManager(
                storage
            );

        await theme.initialize();

        await language.initialize();

        this.modules.set(
            "theme",
            theme
        );

        this.modules.set(
            "language",
            language
        );
    }

    async initializeRouter() {

        const router =
            new Router();

        await router.initialize();

        this.modules.set(
            "router",
            router
        );
    }

    async initializeSearch() {

        const search =
            new SearchEngine();

        await search.initialize();

        this.modules.set(
            "search",
            search
        );
    }

    async initializeMotion() {

        const orientation =
            new OrientationController();

        const motion =
            new MotionController();

        const fallback =
            new PointerFallback();

        const orientationSupported =
            await orientation.initialize();

        const motionSupported =
            await motion.initialize();

        if (
            !orientationSupported ||
            !motionSupported
        ) {

            await fallback.initialize();

            this.modules.set(
                "pointer-fallback",
                fallback
            );
        }

        this.modules.set(
            "orientation",
            orientation
        );

        this.modules.set(
            "motion",
            motion
        );
    }

    async initializeParallax() {

        const parallax =
            new ParallaxEngine({

                orientation:
                    this.modules.get(
                        "orientation"
                    ),

                motion:
                    this.modules.get(
                        "motion"
                    ),

                fallback:
                    this.modules.get(
                        "pointer-fallback"
                    )
            });

        await parallax.initialize();

        this.modules.set(
            "parallax",
            parallax
        );
    }

    async registerServiceWorker() {

        if (
            !(
                "serviceWorker" in navigator
            )
        ) {

            return;
        }

        try {

            await navigator
                .serviceWorker
                .register(
                    "/sw.js",
                    {
                        scope: "/"
                    }
                );

        } catch (error) {

            console.error(
                "[Aoi]",
                "ServiceWorker Registration Failed",
                error
            );
        }
    }

    startMonitoring() {

        this.trackMemory();

        this.trackPerformance();

        this.trackVisibility();

        this.trackConnectivity();
    }

    trackMemory() {

        if (
            !performance.memory
        ) {
            return;
        }

        const update = () => {

            this.performanceMetrics.memory = {

                used:
                    performance.memory.usedJSHeapSize,

                total:
                    performance.memory.totalJSHeapSize,

                limit:
                    performance.memory.jsHeapSizeLimit
            };
        };

        update();

        setInterval(
            update,
            30000
        );
    }

    trackPerformance() {

        const observer =
            new PerformanceObserver(
                list => {

                    for (
                        const entry
                        of list.getEntries()
                    ) {

                        if (
                            entry.duration > 50
                        ) {

                            console.warn(
                                "[Aoi]",
                                "Long Task",
                                entry
                            );
                        }
                    }
                }
            );

        observer.observe({

            entryTypes: [
                "longtask"
            ]
        });
    }

    trackVisibility() {

        document.addEventListener(
            "visibilitychange",
            () => {

                const hidden =
                    document.hidden;

                const parallax =
                    this.modules.get(
                        "parallax"
                    );

                if (!parallax) {
                    return;
                }

                if (hidden) {
                    parallax.pause();
                } else {
                    parallax.resume();
                }
            },
            {
                passive: true
            }
        );
    }

    trackConnectivity() {

        window.addEventListener(
            "online",
            () => {

                console.info(
                    "[Aoi]",
                    "Online"
                );
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "offline",
            () => {

                console.warn(
                    "[Aoi]",
                    "Offline"
                );
            },
            {
                passive: true
            }
        );
    }

    handleUnhandledRejection(
        event
    ) {

        console.error(
            "[Aoi]",
            "Unhandled Promise Rejection",
            event.reason
        );
    }

    handleFatalError(
        error
    ) {

        console.error(
            "[Aoi]",
            "Fatal Error",
            error
        );

        const root =
            document.getElementById(
                "view"
            );

        if (!root) {
            return;
        }

        root.innerHTML = `
            <section
                class="fatal-error"
                role="alert"
            >
                <h1>
                    Application Error
                </h1>

                <p>
                    An unexpected error occurred.
                </p>
            </section>
        `;
    }
}

/**
 * Bootstrap
 */

const app =
    new Application();

document.addEventListener(
    "DOMContentLoaded",
    () => {

        app.start();
    },
    {
        once: true
    }
);

export default app; 
