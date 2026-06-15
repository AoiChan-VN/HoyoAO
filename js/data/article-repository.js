/**
 * ==========================================================
 * Article Repository
 * File: js/data/article-repository.js
 * ==========================================================
 */

import { CONFIG } from "../core/config.js";

export class ArticleRepository {

    #articles;

    constructor() {

        this.#articles = Object.freeze([
            Object.freeze({
                id: "article-001",

                title: "Introduction to 3D Skybox Architecture",

                category: "Architecture",

                author: "System",

                createdAt: "2026-01-01T00:00:00.000Z",

                summary:
                    "Overview of the modular 3D skybox architecture and event-driven design.",

                content:
                    "This article explains how the 3D Skybox Experience platform separates concerns between repositories, components, controllers and state management.",

                tags: Object.freeze([
                    "architecture",
                    "skybox",
                    "frontend"
                ])
            }),

            Object.freeze({
                id: "article-002",

                title: "Event Bus Pattern in Vanilla JavaScript",

                category: "JavaScript",

                author: "System",

                createdAt: "2026-01-05T00:00:00.000Z",

                summary:
                    "Using publish and subscribe communication without framework dependencies.",

                content:
                    "The Event Bus acts as a mediator that decouples components and enables scalable application architecture.",

                tags: Object.freeze([
                    "event-bus",
                    "javascript",
                    "design-pattern"
                ])
            }),

            Object.freeze({
                id: "article-003",

                title: "Building Maintainable Frontend Systems",

                category: "Frontend",

                author: "System",

                createdAt: "2026-01-10T00:00:00.000Z",

                summary:
                    "Strategies for long-term maintainability and domain isolation.",

                content:
                    "Large applications benefit from strict separation of concerns, immutable state management and component-driven design.",

                tags: Object.freeze([
                    "frontend",
                    "maintainability",
                    "solid"
                ])
            })
        ]);
    }

    /**
     * ======================================================
     * Get All Articles
     * ======================================================
     *
     * @returns {Array<object>}
     */
    getAll() {
        return this.#clone(this.#articles);
    }

    /**
     * ======================================================
     * Get By Id
     * ======================================================
     *
     * @param {string} articleId
     *
     * @returns {object|null}
     */
    getById(articleId) {

        this.#validateArticleId(articleId);

        const article = this.#articles.find(
            (item) => item.id === articleId
        );

        return article
            ? this.#clone(article)
            : null;
    }

    /**
     * ======================================================
     * Search
     * ======================================================
     *
     * @param {string} keyword
     *
     * @returns {Array<object>}
     */
    search(keyword) {

        if (typeof keyword !== "string") {
            throw new TypeError(
                "ArticleRepository: keyword must be a string."
            );
        }

        const normalizedKeyword =
            keyword.trim().toLowerCase();

        if (
            normalizedKeyword.length <
            CONFIG.ARTICLES.MIN_SEARCH_LENGTH
        ) {
            return this.getAll();
        }

        return this.#articles
            .filter((article) => {

                const searchableContent = [
                    article.title,
                    article.summary,
                    article.content,
                    article.category,
                    ...article.tags
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableContent.includes(
                    normalizedKeyword
                );
            })
            .map((article) =>
                this.#clone(article)
            );
    }

    /**
     * ======================================================
     * Filter By Category
     * ======================================================
     *
     * @param {string} category
     *
     * @returns {Array<object>}
     */
    getByCategory(category) {

        if (
            typeof category !== "string" ||
            category.trim().length === 0
        ) {
            throw new TypeError(
                "ArticleRepository: category must be a non-empty string."
            );
        }

        const normalizedCategory =
            category.trim().toLowerCase();

        return this.#articles
            .filter(
                (article) =>
                    article.category.toLowerCase() ===
                    normalizedCategory
            )
            .map((article) =>
                this.#clone(article)
            );
    }

    /**
     * ======================================================
     * Get Categories
     * ======================================================
     *
     * @returns {Array<string>}
     */
    getCategories() {

        return [
            ...new Set(
                this.#articles.map(
                    (article) => article.category
                )
            )
        ];
    }

    /**
     * ======================================================
     * Exists
     * ======================================================
     *
     * @param {string} articleId
     *
     * @returns {boolean}
     */
    exists(articleId) {

        this.#validateArticleId(articleId);

        return this.#articles.some(
            (article) =>
                article.id === articleId
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
        return this.#articles.length;
    }

    /**
     * ======================================================
     * Validation
     * ======================================================
     */

    #validateArticleId(articleId) {

        if (
            typeof articleId !== "string" ||
            articleId.trim().length === 0
        ) {
            throw new TypeError(
                "ArticleRepository: articleId must be a non-empty string."
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

export const articleRepository =
    Object.freeze(
        new ArticleRepository()
    ); 
