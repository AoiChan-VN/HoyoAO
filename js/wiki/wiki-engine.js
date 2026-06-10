/* ==========================================================================
   js/wiki/wiki-engine.js
   Native Browser Experience Engine
   ========================================================================== */

import {
    discoverContent,
    categoryName,
    getFileType
} from '../loaders/json-loader.js';

import {
    loadContent,
    downloadFile
} from '../loaders/content-loader.js';

import {
    MarkdownRenderer
} from '../renderers/markdown-renderer.js';

import {
    PDFRenderer
} from '../renderers/pdf-renderer.js';

import {
    DOCXRenderer
} from '../renderers/docx-renderer.js';

import {
    SearchEngine
} from '../search/search-engine.js';

export class WikiEngine {

    constructor() {

        this.categories = [];

        this.currentCategory = null;
        this.currentFile = null;

        this.searchEngine = null;

        this.markdownRenderer =
            new MarkdownRenderer();

        this.pdfRenderer =
            new PDFRenderer();

        this.docxRenderer =
            new DOCXRenderer();

        this.categoryList =
            document.getElementById(
                'category-list'
            );

        this.fileList =
            document.getElementById(
                'file-list'
            );

        this.viewerContent =
            document.getElementById(
                'viewer-content'
            );

        this.viewerFilename =
            document.getElementById(
                'viewer-filename'
            );

        this.viewerCategory =
            document.getElementById(
                'viewer-category'
            );

        this.searchInput =
            document.getElementById(
                'wiki-search-input'
            );

        this.downloadButton =
            document.getElementById(
                'download-file'
            );

    }

    /* ===================================================================== */
    /* INIT */
    /* ===================================================================== */

    async init() {

        this.categories =
            await discoverContent();

        this.searchEngine =
            new SearchEngine(
                this.categories
            );

        this.bindEvents();

        this.renderCategories();

        if (
            this.categories.length > 0
        ) {

            this.selectCategory(
                this.categories[0]
            );

        }

    }

    bindEvents() {

        if (
            this.searchInput
        ) {

            this.searchInput
                .addEventListener(
                    'input',
                    (event) => {

                        this.performSearch(
                            event.target.value
                        );

                    },
                    {
                        passive: true
                    }
                );

        }

        if (
            this.downloadButton
        ) {

            this.downloadButton
                .addEventListener(
                    'click',
                    () => {

                        if (
                            !this.currentFile
                        ) {
                            return;
                        }

                        downloadFile(
                            this.currentFile.file,
                            this.currentFile.title
                        );

                    }
                );

        }

    }

    /* ===================================================================== */
    /* CATEGORY UI */
    /* ===================================================================== */

    renderCategories() {

        this.categoryList.innerHTML = '';

        for (
            const category of
            this.categories
        ) {

            const button =
                document.createElement(
                    'button'
                );

            button.className =
                'category-item';

            button.innerHTML =
                `
                <span class="category-name">
                    ${categoryName(category)}
                </span>

                <span class="category-count">
                    ${category.files.length}
                </span>
                `;

            button.addEventListener(
                'click',
                () => {

                    this.selectCategory(
                        category
                    );

                }
            );

            this.categoryList
                .appendChild(
                    button
                );

        }

    }

    selectCategory(
        category
    ) {

        this.currentCategory =
            category;

        const buttons =
            this.categoryList
            .querySelectorAll(
                '.category-item'
            );

        buttons.forEach(
            (
                element,
                index
            ) => {

                element.classList.toggle(
                    'active',
                    this.categories[
                        index
                    ] === category
                );

            }
        );

        this.renderFiles(
            category.files
        );

    }

    /* ===================================================================== */
    /* FILE LIST */
    /* ===================================================================== */

    renderFiles(
        files
    ) {

        this.fileList.innerHTML = '';

        for (
            const file of files
        ) {

            const button =
                document.createElement(
                    'button'
                );

            button.className =
                'file-item';

            button.innerHTML =
                `
                <span class="file-title">
                    ${file.title}
                </span>

                <span class="file-name">
                    ${file.file}
                </span>
                `;

            button.addEventListener(
                'click',
                () => {

                    this.openFile(
                        file
                    );

                }
            );

            this.fileList
                .appendChild(
                    button
                );

        }

    }

    /* ===================================================================== */
    /* FILE OPEN */
    /* ===================================================================== */

    async openFile(
        file
    ) {

        this.currentFile =
            file;

        this.highlightFile(
            file
        );

        this.viewerFilename.textContent =
            file.title;

        this.viewerCategory.textContent =
            categoryName(
                this.currentCategory
            );

        const content =
            await loadContent(
                file.file
            );

        await this.renderContent(
            content
        );

    }

    highlightFile(
        file
    ) {

        const nodes =
            this.fileList
            .querySelectorAll(
                '.file-item'
            );

        nodes.forEach(
            (
                node,
                index
            ) => {

                node.classList.toggle(
                    'active',

                    this.currentCategory
                    .files[index] ===
                    file
                );

            }
        );

    }

    /* ===================================================================== */
    /* VIEWER */
    /* ===================================================================== */

    async renderContent(
        content
    ) {

        const type =
            content.type;

        this.viewerContent.innerHTML =
            '';

        switch (type) {

            case 'markdown':

                await this
                    .markdownRenderer
                    .render(
                        content,
                        this.viewerContent
                    );

                break;

            case 'pdf':

                await this
                    .pdfRenderer
                    .render(
                        content,
                        this.viewerContent
                    );

                break;

            case 'docx':

                await this
                    .docxRenderer
                    .render(
                        content,
                        this.viewerContent
                    );

                break;

            default:

                this.viewerContent
                    .textContent =
                    'Unsupported content type';

        }

    }

    /* ===================================================================== */
    /* SEARCH */
    /* ===================================================================== */

    performSearch(
        query
    ) {

        const value =
            query.trim();

        if (
            value.length === 0
        ) {

            if (
                this.currentCategory
            ) {

                this.renderFiles(
                    this.currentCategory
                    .files
                );

            }

            return;

        }

        const results =
            this.searchEngine
            .search(
                value
            );

        this.renderFiles(
            results
        );

    }

    /* ===================================================================== */
    /* HELPERS */
    /* ===================================================================== */

    getCurrentFileType() {

        if (
            !this.currentFile
        ) {

            return null;

        }

        return getFileType(
            this.currentFile.file
        );

    }

    /* ===================================================================== */
    /* DESTROY */
    /* ===================================================================== */

    destroy() {

        this.categories = [];
        this.currentCategory = null;
        this.currentFile = null;

        this.viewerContent.innerHTML = '';

    }

} 
