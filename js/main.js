/* ==========================================================================
   js/main.js
   Native Browser Experience Engine
   Application Bootstrap
   ========================================================================== */

import { CONFIG } from './core/config.js';

import {
    ExperienceEngine
} from './experience/experience-engine.js';

import {
    WikiEngine
} from './wiki/wiki-engine.js';

class Application {

    constructor() {

        this.experience = null;
        this.wiki = null;

        this.page =
            this.detectPage();

        this.loadingScreen =
            document.getElementById(
                'loading-screen'
            );

        this.themeToggle =
            document.getElementById(
                'theme-toggle'
            );

        this.bindGlobalEvents();

    }

    /* ===================================================================== */
    /* PAGE DETECTION
    /* ===================================================================== */

    detectPage() {

        const path =
            window.location.pathname
                .toLowerCase();

        if (
            path.endsWith(
                'wiki.html'
            )
        ) {

            return 'wiki';

        }

        return 'experience';

    }

    /* ===================================================================== */
    /* BOOT
    /* ===================================================================== */

    async init() {

        try {

            this.showLoading();

            await this.restoreTheme();

            if (
                this.page ===
                'experience'
            ) {

                await this.initExperience();

            }
            else {

                await this.initWiki();

            }

            this.hideLoading();

        }
        catch (error) {

            console.error(
                '[Application]',
                error
            );

            this.showFatalError(
                error
            );

        }

    }

    /* ===================================================================== */
    /* EXPERIENCE MODE
    /* ===================================================================== */

    async initExperience() {

        this.experience =
            new ExperienceEngine();

        await this.experience
            .init();

        const hdri =
            document.body
                .dataset
                .hdri;

        if (hdri) {

            await this.experience
                .loadHDRI(
                    hdri
                );

        }

        const gyroButton =
            document.getElementById(
                'enable-gyro'
            );

        if (gyroButton) {

            gyroButton
                .addEventListener(
                    'click',
                    async () => {

                        const granted =
                            await this
                            .experience
                            .enableGyroscope();

                        gyroButton.textContent =
                            granted
                                ? 'Gyroscope Enabled'
                                : 'Permission Denied';

                    }
                );

        }

    }

    /* ===================================================================== */
    /* WIKI MODE
    /* ===================================================================== */

    async initWiki() {

        this.wiki =
            new WikiEngine();

        await this.wiki
            .init();

    }

    /* ===================================================================== */
    /* THEME
    /* ===================================================================== */

    bindGlobalEvents() {

        if (
            this.themeToggle
        ) {

            this.themeToggle
                .addEventListener(
                    'click',
                    () => {

                        this.toggleTheme();

                    }
                );

        }

        window.addEventListener(
            'beforeunload',
            () => {

                this.destroy();

            }
        );

    }

    async restoreTheme() {

        const savedTheme =
            localStorage.getItem(
                CONFIG.STORAGE
                    .THEME_KEY
            );

        const theme =
            savedTheme ||
            CONFIG.UI
                .DEFAULT_THEME;

        document.documentElement
            .setAttribute(
                'data-theme',
                theme
            );

    }

    toggleTheme() {

        const current =
            document.documentElement
                .getAttribute(
                    'data-theme'
                ) || 'dark';

        const next =
            current === 'dark'
                ? 'light'
                : 'dark';

        document.documentElement
            .setAttribute(
                'data-theme',
                next
            );

        localStorage.setItem(

            CONFIG.STORAGE
                .THEME_KEY,

            next

        );

    }

    /* ===================================================================== */
    /* LOADING
    /* ===================================================================== */

    showLoading() {

        if (
            !this.loadingScreen
        ) {
            return;
        }

        this.loadingScreen
            .classList.remove(
                'hidden'
            );

    }

    hideLoading() {

        if (
            !this.loadingScreen
        ) {
            return;
        }

        requestAnimationFrame(
            () => {

                this.loadingScreen
                    .classList.add(
                        'hidden'
                    );

            }
        );

    }

    /* ===================================================================== */
    /* ERROR
    /* ===================================================================== */

    showFatalError(
        error
    ) {

        console.error(
            error
        );

        const root =
            document.getElementById(
                'app'
            );

        if (!root) {
            return;
        }

        root.innerHTML =
            `
            <section class="fatal-error">

                <h1>
                    Application Error
                </h1>

                <p>
                    ${
                        error?.message ||
                        'Unknown Error'
                    }
                </p>

            </section>
            `;

    }

    /* ===================================================================== */
    /* DESTROY
    /* ===================================================================== */

    destroy() {

        if (
            this.experience
        ) {

            this.experience
                .destroy();

            this.experience =
                null;

        }

        if (
            this.wiki
        ) {

            this.wiki.destroy();

            this.wiki = null;

        }

    }

}

/* ==========================================================================
   STARTUP
   ========================================================================== */

const app =
    new Application();

window.app =
    app;

window.addEventListener(
    'DOMContentLoaded',
    async () => {

        await app.init();

    },
    {
        passive: true
    }
); 
