/**
 * ============================================================================
 * File: js/core/state-manager.js
 * Purpose: Centralized Application State Manager
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from './config.js';
import { eventBus } from './event-bus.js';

class StateManager {
    #state;

    constructor() {
        this.#state = {
            skybox: {
                yaw: APP_CONFIG.SKYBOX.INITIAL_YAW,
                pitch: APP_CONFIG.SKYBOX.INITIAL_PITCH,
                currentIndex: 0,
                currentImageSet: null
            }
        };
    }

    /**
     * ------------------------------------------------------------------------
     * Internal Helpers
     * ------------------------------------------------------------------------
     */

    #deepClone(value) {
        return structuredClone(value);
    }

    #emitStateUpdate() {
        eventBus.publish(
            APP_CONFIG.EVENTS.SKYBOX_ROTATION_UPDATED,
            this.getSkyboxState()
        );
    }

    #validateNumber(value, fieldName) {
        if (!Number.isFinite(value)) {
            throw new TypeError(
                `[StateManager] "${fieldName}" must be a finite number.`
            );
        }
    }

    #clampPitch(pitch) {
        return Math.max(
            APP_CONFIG.SKYBOX.MIN_PITCH_DEGREE,
            Math.min(
                APP_CONFIG.SKYBOX.MAX_PITCH_DEGREE,
                pitch
            )
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Read APIs
     * ------------------------------------------------------------------------
     */

    getState() {
        return this.#deepClone(this.#state);
    }

    getSkyboxState() {
        return this.#deepClone(this.#state.skybox);
    }

    getYaw() {
        return this.#state.skybox.yaw;
    }

    getPitch() {
        return this.#state.skybox.pitch;
    }

    getCurrentIndex() {
        return this.#state.skybox.currentIndex;
    }

    getCurrentImageSet() {
        return this.#deepClone(
            this.#state.skybox.currentImageSet
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Rotation APIs
     * ------------------------------------------------------------------------
     */

    setRotation(yaw, pitch) {
        this.#validateNumber(yaw, 'yaw');
        this.#validateNumber(pitch, 'pitch');

        this.#state.skybox.yaw = yaw;
        this.#state.skybox.pitch = this.#clampPitch(pitch);

        this.#emitStateUpdate();
    }

    updateRotation(deltaYaw, deltaPitch) {
        this.#validateNumber(deltaYaw, 'deltaYaw');
        this.#validateNumber(deltaPitch, 'deltaPitch');

        const nextYaw =
            this.#state.skybox.yaw + deltaYaw;

        const nextPitch =
            this.#state.skybox.pitch + deltaPitch;

        this.#state.skybox.yaw = nextYaw;
        this.#state.skybox.pitch =
            this.#clampPitch(nextPitch);

        this.#emitStateUpdate();
    }

    resetRotation() {
        this.#state.skybox.yaw =
            APP_CONFIG.SKYBOX.INITIAL_YAW;

        this.#state.skybox.pitch =
            APP_CONFIG.SKYBOX.INITIAL_PITCH;

        this.#emitStateUpdate();
    }

    /**
     * ------------------------------------------------------------------------
     * Skybox Index APIs
     * ------------------------------------------------------------------------
     */

    setCurrentIndex(index) {
        if (
            !Number.isInteger(index) ||
            index < 0
        ) {
            throw new RangeError(
                '[StateManager] Invalid skybox index.'
            );
        }

        this.#state.skybox.currentIndex = index;

        try {
            localStorage.setItem(
                APP_CONFIG.STORAGE.CURRENT_SKYBOX_INDEX,
                String(index)
            );
        } catch (error) {
            console.warn(
                '[StateManager] Failed to persist skybox index.',
                error
            );
        }
    }

    restoreCurrentIndex() {
        try {
            const storedValue = localStorage.getItem(
                APP_CONFIG.STORAGE.CURRENT_SKYBOX_INDEX
            );

            if (storedValue === null) {
                return;
            }

            const parsedValue =
                Number.parseInt(storedValue, 10);

            if (
                Number.isInteger(parsedValue) &&
                parsedValue >= 0
            ) {
                this.#state.skybox.currentIndex =
                    parsedValue;
            }
        } catch (error) {
            console.warn(
                '[StateManager] Failed to restore skybox index.',
                error
            );
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Skybox Image APIs
     * ------------------------------------------------------------------------
     */

    setCurrentImageSet(imageSet) {
        if (
            imageSet === null ||
            typeof imageSet !== 'object'
        ) {
            throw new TypeError(
                '[StateManager] Invalid image set.'
            );
        }

        this.#state.skybox.currentImageSet =
            this.#deepClone(imageSet);

        eventBus.publish(
            APP_CONFIG.EVENTS.SKYBOX_IMAGE_CHANGED,
            this.getCurrentImageSet()
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            yaw: this.#state.skybox.yaw,
            pitch: this.#state.skybox.pitch,
            currentIndex:
                this.#state.skybox.currentIndex,
            hasImageSet:
                this.#state.skybox.currentImageSet !== null
        });
    }
}

export const stateManager = new StateManager(); 
