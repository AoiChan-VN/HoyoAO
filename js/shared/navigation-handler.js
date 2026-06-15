/**
 * ============================================================================
 * File: js/shared/navigation-handler.js
 * Purpose: Application Navigation Handler
 * Domain: Shared
 * ============================================================================
 */

import { APP_CONFIG } from '../core/config.js';
import { eventBus } from '../core/event-bus.js';

export class NavigationHandler {
    #unsubscribeNavigation;

    constructor() {
        this.#unsubscribeNavigation = null;
    }

    /**
     * ------------------------------------------------------------------------
     * Lifecycle
     * ------------------------------------------------------------------------
     */

    initialize() {
        this.#unsubscribeNavigation =
            eventBus.subscribe(
                APP_CONFIG.EVENTS.NAVIGATION_REQUESTED,
                (payload) => {
                    this.#handleNavigation(payload);
                }
            );
    }

    destroy() {
        if (typeof this.#unsubscribeNavigation === 'function') {
            this.#unsubscribeNavigation();
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Internal
     * ------------------------------------------------------------------------
     */

    #validatePayload(payload) {
        if (
            payload === null ||
            typeof payload !== 'object'
        ) {
            return false;
        }

        if (
            typeof payload.url !== 'string' ||
            payload.url.trim().length === 0
        ) {
            return false;
        }

        return true;
    }

    #handleNavigation(payload) {
        try {
            if (!this.#validatePayload(payload)) {
                throw new Error(
                    '[NavigationHandler] Invalid navigation payload.'
                );
            }

            const destinationUrl =
                payload.url.trim();

            const shouldReplaceHistory =
                Boolean(payload.replace);

            const smoothScroll =
                payload.scrollTop === true;

            if (smoothScroll) {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            }

            if (shouldReplaceHistory) {
                window.location.replace(
                    destinationUrl
                );

                return;
            }

            window.location.assign(
                destinationUrl
            );
        } catch (error) {
            eventBus.publish(
                APP_CONFIG.EVENTS.APPLICATION_ERROR,
                {
                    source: 'navigation-handler',
                    error
                }
            );
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------------
     */

    navigate(url, options = {}) {
        if (
            typeof url !== 'string' ||
            url.trim().length === 0
        ) {
            throw new TypeError(
                '[NavigationHandler] Invalid URL.'
            );
        }

        eventBus.publish(
            APP_CONFIG.EVENTS.NAVIGATION_REQUESTED,
            {
                url,
                replace:
                    options.replace === true,
                scrollTop:
                    options.scrollTop === true
            }
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            initialized:
                typeof this.#unsubscribeNavigation ===
                'function'
        });
    }
} 
