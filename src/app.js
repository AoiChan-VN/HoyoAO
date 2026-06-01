import { router } from "./router/router.js";
import registerRoutes from "./router/routes.js";

import {
    storage
} from "./storage/local.js";

import ThemeManager
    from "./settings/theme.js";

import LanguageManager
    from "./settings/language.js";

import {
    search
} from "./search/indexer.js";

import {
    parallax
} from "./gyroscope/parallax.js";

export class AoiApplication {

    constructor() {

        this.theme =
            new ThemeManager(
                storage
            );

        this.language =
            new LanguageManager(
                storage
            );

        this.initialized =
            false;

        this.performance = {

            start:
                performance.now(),

            boot: 0
        };
    }

    async initialize() {

        if (
            this.initialized
        ) {

            return;
        }

        try {

            this.installErrorBoundary();

            await this.initializeStorage();

            await this.initializeTheme();

            await this.initializeLanguage();

            await this.initializeSearch();

            await this.initializeParallax();

            await this.initializeRouter();

            await this.initializeServiceWorker();

            this.initializePerformance();

            this.initialized =
                true;

            document.dispatchEvent(

                new CustomEvent(
                    "aoi:ready"
                )
            );

        } catch (
            error
        ) {

            console.error(
                "[Aoi]",
                error
            );

            this.renderFatalError(
                error
            );
        }
    }

    async initializeStorage() {

        storage.remember(

            "app-installed",

            () => true,

            365 *
            24 *
            60 *
            60 *
            1000
        );
    }

    async initializeTheme() {

        await this.theme
            .initialize();
    }

    async initializeLanguage() {

        await this.language
            .initialize();
    }

    async initializeSearch() {

        await search
            .initialize();
    }

    async initializeParallax() {

        const disabled =
            parallax
                .disableLowEndDevice();

        if (
            disabled
        ) {

            return;
        }

        await parallax
            .initialize();

        parallax
            .autoRegister();
    }

    async initializeRouter() {

        await registerRoutes();

        router.link();

        router.start();
    }

    async initializeServiceWorker() {

        if (

            !(
                "serviceWorker"
                in navigator
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

        } catch (
            error
        ) {

            console.warn(

                "[SW]",

                error
            );
        }
    }

    installErrorBoundary() {

        window.addEventListener(

            "error",

            event => {

                console.error(

                    "[Global Error]",

                    event.error
                );

                this.captureError(
                    event.error
                );
            }
        );

        window.addEventListener(

            "unhandledrejection",

            event => {

                console.error(

                    "[Promise Error]",

                    event.reason
                );

                this.captureError(
                    event.reason
                );
            }
        );
    }

    captureError(
        error
    ) {

        const history =
            storage.get(
                "errors",
                []
            );

        history.unshift({

            message:
                String(
                    error?.message ||
                    error
                ),

            stack:
                error?.stack ||
                "",

            timestamp:
                Date.now()
        });

        storage.set(

            "errors",

            history.slice(
                0,
                50
            )
        );
    }

    renderFatalError(
        error
    ) {

        const root =
            document.getElementById(
                "view"
            );

        if (
            !root
        ) {

            return;
        }

        root.innerHTML = `

<section
class="fatal-error">

<h1>
Application Error
</h1>

<p>

${this.escape(
    error?.message ||
    "Unknown Error"
)}

</p>

</section>
`;
    }

    initializePerformance() {

        this.performance.boot =

            performance.now() -

            this.performance.start;

        document.dispatchEvent(

            new CustomEvent(

                "aoi:performance",

                {

                    detail: {

                        bootTime:
                            this.performance
                                .boot
                    }
                }
            )
        );

        console.info(

            `[Aoi] Boot ${this.performance.boot.toFixed(2)}ms`
        );
    }

    escape(
        value = ""
    ) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                `"`,
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#39;"
            );
    }

    destroy() {

        router.destroy();

        this.theme.destroy();

        this.language.destroy();

        parallax.destroy();

        this.initialized =
            false;
    }
}

export const app =
    new AoiApplication();

document.addEventListener(

    "DOMContentLoaded",

    () => {

        app.initialize();
    }
);

export default app; 
