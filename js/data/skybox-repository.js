/**
 * ============================================================================
 * File: js/data/skybox-repository.js
 * Purpose: Skybox Data Repository
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from '../core/config.js';

class SkyboxRepository {
    #skyboxes;

    constructor() {
        this.#skyboxes = [];
    }

    /**
     * ------------------------------------------------------------------------
     * Validation
     * ------------------------------------------------------------------------
     */

    #isValidUrl(value) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return false;
        }

        try {
            const url = new URL(value, window.location.origin);

            return (
                url.protocol === 'http:' ||
                url.protocol === 'https:' ||
                url.protocol === 'file:'
            );
        } catch {
            return false;
        }
    }

    #validateFace(faceName, value) {
        if (!this.#isValidUrl(value)) {
            throw new TypeError(
                `[SkyboxRepository] Invalid URL for face "${faceName}".`
            );
        }
    }

    #validateImageSet(imageSet) {
        if (
            imageSet === null ||
            typeof imageSet !== 'object'
        ) {
            throw new TypeError(
                '[SkyboxRepository] Image set must be an object.'
            );
        }

        const requiredFaces = [
            'front',
            'back',
            'left',
            'right',
            'top',
            'bottom'
        ];

        for (const face of requiredFaces) {
            if (!(face in imageSet)) {
                throw new Error(
                    `[SkyboxRepository] Missing skybox face "${face}".`
                );
            }

            this.#validateFace(face, imageSet[face]);
        }
    }

    #clone(value) {
        return structuredClone(value);
    }

    /**
     * ------------------------------------------------------------------------
     * Repository Management
     * ------------------------------------------------------------------------
     */

    add(imageSet) {
        this.#validateImageSet(imageSet);

        if (
            this.#skyboxes.length >=
            APP_CONFIG.REPOSITORY.SKYBOX_IMAGE_LIMIT
        ) {
            throw new RangeError(
                `[SkyboxRepository] Maximum skybox limit exceeded (${APP_CONFIG.REPOSITORY.SKYBOX_IMAGE_LIMIT}).`
            );
        }

        this.#skyboxes.push(
            Object.freeze(this.#clone(imageSet))
        );
    }

    addMany(imageSets) {
        if (!Array.isArray(imageSets)) {
            throw new TypeError(
                '[SkyboxRepository] Expected array of image sets.'
            );
        }

        for (const imageSet of imageSets) {
            this.add(imageSet);
        }
    }

    clear() {
        this.#skyboxes.length = 0;
    }

    /**
     * ------------------------------------------------------------------------
     * Read APIs
     * ------------------------------------------------------------------------
     */

    getAll() {
        return this.#clone(this.#skyboxes);
    }

    getCount() {
        return this.#skyboxes.length;
    }

    isEmpty() {
        return this.#skyboxes.length === 0;
    }

    getByIndex(index) {
        if (!Number.isInteger(index)) {
            throw new TypeError(
                '[SkyboxRepository] Index must be an integer.'
            );
        }

        if (
            index < 0 ||
            index >= this.#skyboxes.length
        ) {
            throw new RangeError(
                '[SkyboxRepository] Index out of range.'
            );
        }

        return this.#clone(
            this.#skyboxes[index]
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Navigation APIs
     * ------------------------------------------------------------------------
     */

    getNextIndex(currentIndex) {
        if (this.isEmpty()) {
            return 0;
        }

        return (
            (currentIndex + 1) %
            this.#skyboxes.length
        );
    }

    getPreviousIndex(currentIndex) {
        if (this.isEmpty()) {
            return 0;
        }

        return (
            (currentIndex - 1 + this.#skyboxes.length) %
            this.#skyboxes.length
        );
    }

    getNext(currentIndex) {
        return this.getByIndex(
            this.getNextIndex(currentIndex)
        );
    }

    getPrevious(currentIndex) {
        return this.getByIndex(
            this.getPreviousIndex(currentIndex)
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Seed Data
     * ------------------------------------------------------------------------
     */

    loadDefaultData() {
        this.clear();

        this.addMany([
            {
                front: './assets/skybox/sky-01/front.webp',
                back: './assets/skybox/sky-01/back.webp',
                left: './assets/skybox/sky-01/left.webp',
                right: './assets/skybox/sky-01/right.webp',
                top: './assets/skybox/sky-01/top.webp',
                bottom: './assets/skybox/sky-01/bottom.webp'
            },
            {
                front: './assets/skybox/sky-02/front.webp',
                back: './assets/skybox/sky-02/back.webp',
                left: './assets/skybox/sky-02/left.webp',
                right: './assets/skybox/sky-02/right.webp',
                top: './assets/skybox/sky-02/top.webp',
                bottom: './assets/skybox/sky-02/bottom.webp'
            }
        ]);
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            totalSkyboxes: this.#skyboxes.length,
            repositoryLimit:
                APP_CONFIG.REPOSITORY.SKYBOX_IMAGE_LIMIT,
            isEmpty: this.isEmpty()
        });
    }
}

export const skyboxRepository =
    new SkyboxRepository(); 
