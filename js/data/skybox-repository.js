/**
 * ==========================================================
 * Skybox Repository
 * File: js/data/skybox-repository.js
 * ==========================================================
 */

export class SkyboxRepository {

    #skyboxes;

    constructor() {

        this.#skyboxes = Object.freeze([
            Object.freeze({
                id: "skybox-001",
                name: "Mountain Sunrise",

                faces: Object.freeze({
                    front: "./assets/skybox/mountain/front.jpg",
                    back: "./assets/skybox/mountain/back.jpg",
                    left: "./assets/skybox/mountain/left.jpg",
                    right: "./assets/skybox/mountain/right.jpg",
                    top: "./assets/skybox/mountain/top.jpg",
                    bottom: "./assets/skybox/mountain/bottom.jpg"
                })
            }),

            Object.freeze({
                id: "skybox-002",
                name: "Ocean View",

                faces: Object.freeze({
                    front: "./assets/skybox/ocean/front.jpg",
                    back: "./assets/skybox/ocean/back.jpg",
                    left: "./assets/skybox/ocean/left.jpg",
                    right: "./assets/skybox/ocean/right.jpg",
                    top: "./assets/skybox/ocean/top.jpg",
                    bottom: "./assets/skybox/ocean/bottom.jpg"
                })
            }),

            Object.freeze({
                id: "skybox-003",
                name: "Night City",

                faces: Object.freeze({
                    front: "./assets/skybox/city/front.jpg",
                    back: "./assets/skybox/city/back.jpg",
                    left: "./assets/skybox/city/left.jpg",
                    right: "./assets/skybox/city/right.jpg",
                    top: "./assets/skybox/city/top.jpg",
                    bottom: "./assets/skybox/city/bottom.jpg"
                })
            })
        ]);
    }

    /**
     * ======================================================
     * Get All Skyboxes
     * ======================================================
     *
     * @returns {Array}
     */
    getAll() {
        return this.#clone(this.#skyboxes);
    }

    /**
     * ======================================================
     * Get By Id
     * ======================================================
     *
     * @param {string} id
     *
     * @returns {object|null}
     */
    getById(id) {

        this.#validateId(id);

        const skybox = this.#skyboxes.find(
            (item) => item.id === id
        );

        if (!skybox) {
            return null;
        }

        return this.#clone(skybox);
    }

    /**
     * ======================================================
     * Get First Available
     * ======================================================
     *
     * @returns {object|null}
     */
    getDefault() {

        if (this.#skyboxes.length === 0) {
            return null;
        }

        return this.#clone(
            this.#skyboxes[0]
        );
    }

    /**
     * ======================================================
     * Exists
     * ======================================================
     *
     * @param {string} id
     *
     * @returns {boolean}
     */
    exists(id) {

        this.#validateId(id);

        return this.#skyboxes.some(
            (item) => item.id === id
        );
    }

    /**
     * ======================================================
     * Count
     * ======================================================
     *
     * @returns {number}
     */
    count() {
        return this.#skyboxes.length;
    }

    /**
     * ======================================================
     * Face Validation
     * ======================================================
     *
     * @param {object} faces
     *
     * @returns {boolean}
     */
    validateFaces(faces) {

        if (
            typeof faces !== "object" ||
            faces === null
        ) {
            return false;
        }

        const requiredFaces = [
            "front",
            "back",
            "left",
            "right",
            "top",
            "bottom"
        ];

        return requiredFaces.every(
            (face) =>
                typeof faces[face] === "string" &&
                faces[face].trim().length > 0
        );
    }

    /**
     * ======================================================
     * Validation
     * ======================================================
     */

    #validateId(id) {

        if (
            typeof id !== "string" ||
            id.trim().length === 0
        ) {
            throw new TypeError(
                "SkyboxRepository: id must be a non-empty string."
            );
        }
    }

    /**
     * ======================================================
     * Clone Utility
     * ======================================================
     *
     * @param {*} value
     *
     * @returns {*}
     */
    #clone(value) {

        if (typeof structuredClone === "function") {
            return structuredClone(value);
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }
}

/**
 * ==========================================================
 * Singleton Instance
 * ==========================================================
 */

export const skyboxRepository =
    Object.freeze(
        new SkyboxRepository()
    ); 
