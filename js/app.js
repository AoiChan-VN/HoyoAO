/**
 * ============================================================================
 * File: js/app.js
 * Purpose: Application Bootstrapper & Dependency Injection Root
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from './core/config.js';
import { eventBus } from './core/event-bus.js';
import { stateManager } from './core/state-manager.js';

import { skyboxRepository } from './data/skybox-repository.js';

import { MouseInputController } from './controllers/mouse-input.js';
import { TouchInputController } from './controllers/touch-input.js';

import { SkyboxViewer } from './components/home/skybox-viewer.js';
import { OverlayUI } from './components/home/overlay-ui.js';

import { NavigationHandler } from './shared/navigation-handler.js';

class Application {
    #viewer;
    #overlay;
    
    #mouseInput;
    #touchInput;

    #navigation;

    #unsubscribeRotation;
    #unsubscribeNext;
    #unsubscribePrevious;
    #unsubscribeReset;
    #unsubscribeError;

    initialize() {
        try {
            const skyboxRoot = 
                document.getElementById(
                    'home-skybox-root'
                );

            const overlayRoot =
                document.getElementById(
                    'home-overlay-root'
                );

            if (!(skyboxRoot instanceof HTMLElement)) {
                throw new Error(
                    '[Application] #home-skybox-root not found.'
                );
            }

            if (!(overlayRoot instanceof HTMLElement)) {
                throw new Error(
                    '[Application] #home-overlay-root not found.'
                );
            }

            this.#initializeData();

            this.#initializeComponents(
                skyboxRoot,
                overlayRoot
            );

            this.#wireEvents();

            this.#restoreState();

            this.#loadInitialSkybox();

            console.info(
                `[${APP_CONFIG.APPLICATION.NAME}] Initialized`
            );
        } catch (error) {
            this.#handleFatalError(error);
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Data Layer
     * ------------------------------------------------------------------------
     */

    #initializeData() {
        skyboxRepository.loadDefaultData();

        if (skyboxRepository.isEmpty()) {
            throw new Error(
                '[Application] Skybox repository is empty.'
            );
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Components
     * ------------------------------------------------------------------------
     */

    #initializeComponents(
        skyboxRoot,
        overlayRoot
    ) {
        this.#viewer =
            new SkyboxViewer(
                skyboxRoot
            );

        this.#viewer.initialize();

        this.#viewer.setPerspective(
            APP_CONFIG.SKYBOX.PERSPECTIVE_PX
        );

        this.#overlay =
            new OverlayUI(
                overlayRoot
            );

        this.#overlay.initialize();

        this.#mouseInput =
            new MouseInputController(
                skyboxRoot
            );

        this.#mouseInput.initialize();

        this.#touchInput =
            new TouchInputController(
                skyboxRoot
            );

        this.#touchInput.initialize();

        this.#navigation =
            new NavigationHandler();

        this.#navigation.initialize();
    }

    /**
     * ------------------------------------------------------------------------
     * Event Wiring
     * ------------------------------------------------------------------------
     */

    #wireEvents() {
        this.#unsubscribeRotation =
            eventBus.subscribe(
                APP_CONFIG.EVENTS
                    .SKYBOX_ROTATION_REQUESTED,
                (payload) => {
                    this.#handleRotationRequested(
                        payload
                    );
                }
            );

        this.#unsubscribeNext =
            eventBus.subscribe(
                APP_CONFIG.EVENTS
                    .OVERLAY_NEXT_SKYBOX_REQUESTED,
                () => {
                    this.#showNextSkybox();
                }
            );

        this.#unsubscribePrevious =
            eventBus.subscribe(
                APP_CONFIG.EVENTS
                    .OVERLAY_PREVIOUS_SKYBOX_REQUESTED,
                () => {
                    this.#showPreviousSkybox();
                }
            );

        this.#unsubscribeReset =
            eventBus.subscribe(
                APP_CONFIG.EVENTS
                    .OVERLAY_RESET_VIEW_REQUESTED,
                () => {
                    stateManager.resetRotation();
                }
            );

        this.#unsubscribeError =
            eventBus.subscribe(
                APP_CONFIG.EVENTS
                    .APPLICATION_ERROR,
                (payload) => {
                    console.error(
                        '[Application Error]',
                        payload
                    );
                }
            );

        this.#windowErrorHandler =
            (event) => {
                eventBus.publish(
                    APP_CONFIG.EVENTS
                    .APPLICATION_ERROR,
                    {
                        source:
                            'window.error',
                        error:
                            event.error
                    }
                );
            };

        this.#windowUnhandledRejectionHandler =
            (event) => {
                eventBus.publish(
                    APP_CONFIG.EVENTS
                    .APPLICATION_ERROR,
                    {
                        source:
                            'window.unhandledrejection',
                        error:
                            event.reason
                    }
                );
            };

        window.addEventListener(
            'error',
            this.#windowErrorHandler
        );

        window.addEventListener(
            'unhandledrejection',
            this.#windowUnhandledRejectionHandler
        );

        /**
        * ------------------------------------------------------------------------
        * Rotation
        * ------------------------------------------------------------------------
        */
        
        #handleRotationRequested(
            payload
        ) {
            if (
                payload === null ||
                typeof payload !== 'object'
            ) {
                return;
            }

            const {
                deltaYaw,
                deltaPitch
            } = payload;

            if (
                !Number.isFinite(deltaYaw) ||
                !Number.isFinite(deltaPitch)
            ) {
                return;
            }

            stateManager.updateRotation(
                deltaYaw,
                deltaPitch
            );
        }

        /**
        * ------------------------------------------------------------------------
        * State Restore
        * ------------------------------------------------------------------------
        */

        #restoreState() {
            stateManager.restoreCurrentIndex();
        }

        /**
        * ------------------------------------------------------------------------
        * Skybox Loading
        * ------------------------------------------------------------------------
        */

        #loadInitialSkybox() {
            const currentIndex = 
                stateManager.getCurrentIndex();

            const repositorySize = 
                skyboxRepository.getAll().length;

            if (repositorySize === 0) {
                throw new Error(
                    '[Application] No skybox data available.'
                );
            }

            const safeIndex =
                Math.min(
                    Math.max(currentIndex, 0),
                    repositorySize - 1
                );

            if (safeIndex !== currentIndex) {
                stateManager.setCurrentIndex(
                    safeIndex
                );
            }

            const imageSet = 
                skyboxRepository.getByIndex(
                    safeIndex
                );

            stateManager.setCurrentImageSet(
                imageSet
            );

            stateManager.resetRotation();
        }
    
        #showNextSkybox() {
            const currentIndex =
                stateManager.getCurrentIndex();

            const nextIndex =
                skyboxRepository.getNextIndex(
                    currentIndex
                );

            const imageSet =
                skyboxRepository.getByIndex(
                    nextIndex
                ); 

            stateManager.setCurrentIndex(
                nextIndex
            );

            stateManager.setCurrentImageSet(
                imageSet
            );
        }
        
        #showPreviousSkybox() {
            const currentIndex =
                stateManager.getCurrentIndex();

            const previousIndex =
                skyboxRepository.getPreviousIndex(
                    currentIndex
                );

            const imageSet =
                skyboxRepository.getByIndex(
                    previousIndex
                );

            stateManager.setCurrentIndex(
                previousIndex
            );

            stateManager.setCurrentImageSet(
                imageSet
            );
        }

        /**
        * ------------------------------------------------------------------------
        * Fatal Error
        * ------------------------------------------------------------------------
        */

        #handleFatalError(error) {
            console.error(
                '[Application Fatal Error]',
                error
            );

            document.body.innerHTML =
                `
                <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                min-height:100vh;
                padding:24px;
                text-align:center;
                font-family:sans-serif;">
                <div>
                <h1> Application Initialization Failed </h1>
                <p> Please check browser console. </p>
                </div>
                </div>
                `;
        }

        /**
        * ------------------------------------------------------------------------
        * Diagnostics
        * ------------------------------------------------------------------------
        */

        getDiagnostics() {
            return Object.freeze({
                state:
                    stateManager.getDiagnostics(),
                repository:
                    skyboxRepository.getDiagnostics(),
                viewer:
                    this.#viewer?.getDiagnostics?.(),
                overlay:
                    this.#overlay?.getDiagnostics?.(),
                mouse:
                    this.#mouseInput?.getDiagnostics?.(),
                touch:
                    this.#touchInput?.getDiagnostics?.(),
                navigation:
                    this.#navigation?.getDiagnostics?.()
            });
        }
    }

    const application = 
    new Application();

    document.addEventListener(
        'DOMContentLoaded',
    () => {
        application.initialize();
    },
{
    once: true
}
);

export { application }; 
