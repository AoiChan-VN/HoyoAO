/* ==========================================================================
   js/search/search-engine.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class SearchEngine {

    constructor(
        categories = []
    ) {

        this.categories =
            categories;

        this.index = [];

        this.buildIndex();

    }

    /* ===================================================================== */
    /* INDEX BUILDING */
    /* ===================================================================== */

    buildIndex() {

        this.index.length = 0;

        for (
            const category of
            this.categories
        ) {

            const categoryLabel =
                category.description || '';

            const categoryDate =
                category.date || '';

            for (
                const file of
                category.files
            ) {

                const fileName =
                    file.file
                    ?.split('/')
                    .pop() || '';

                this.index.push({

                    title:
                        file.title || '',

                    file:
                        file.file || '',

                    fileName,

                    category:
                        categoryLabel,

                    date:
                        categoryDate,

                    source:
                        file,

                    searchText:
                        [
                            file.title,
                            file.file,
                            fileName,
                            categoryLabel,
                            categoryDate
                        ]
                        .join(' ')
                        .toLowerCase()

                });

            }

        }

    }

    /* ===================================================================== */
    /* SEARCH */
    /* ===================================================================== */

    search(
        query
    ) {

        const normalized =
            query
            .trim()
            .toLowerCase();

        if (
            normalized.length <
            CONFIG.SEARCH
                .MIN_QUERY_LENGTH
        ) {

            return [];

        }

        const tokens =
            normalized
            .split(/\s+/)
            .filter(Boolean);

        const scoredResults = [];

        for (
            const item of
            this.index
        ) {

            let score = 0;

            for (
                const token of tokens
            ) {

                if (
                    item.title
                    .toLowerCase()
                    .startsWith(
                        token
                    )
                ) {

                    score += 100;
                    continue;

                }

                if (
                    item.title
                    .toLowerCase()
                    .includes(
                        token
                    )
                ) {

                    score += 50;

                }

                if (
                    item.fileName
                    .toLowerCase()
                    .includes(
                        token
                    )
                ) {

                    score += 25;

                }

                if (
                    item.category
                    .toLowerCase()
                    .includes(
                        token
                    )
                ) {

                    score += 15;

                }

                if (
                    item.searchText
                    .includes(
                        token
                    )
                ) {

                    score += 5;

                }

            }

            if (score > 0) {

                scoredResults.push({

                    score,

                    file:
                        item.source

                });

            }

        }

        scoredResults.sort(
            (
                a,
                b
            ) =>
                b.score -
                a.score
        );

        return scoredResults
            .slice(
                0,
                CONFIG.SEARCH
                    .MAX_RESULTS
            )
            .map(
                (
                    result
                ) =>
                    result.file
            );

    }

    /* ===================================================================== */
    /* CATEGORY SEARCH */
    /* ===================================================================== */

    searchCategories(
        query
    ) {

        const keyword =
            query
            .trim()
            .toLowerCase();

        return this.categories
            .filter(
                (
                    category
                ) =>

                    (
                        category
                        .description ||
                        ''
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )
            );

    }

    /* ===================================================================== */
    /* FILE SEARCH */
    /* ===================================================================== */

    searchFiles(
        query
    ) {

        return this.search(
            query
        );

    }

    /* ===================================================================== */
    /* EXACT MATCH */
    /* ===================================================================== */

    findExact(
        title
    ) {

        const normalized =
            title
            .trim()
            .toLowerCase();

        const found =
            this.index.find(
                (
                    item
                ) =>

                    item.title
                    .toLowerCase() ===
                    normalized
            );

        return found
            ? found.source
            : null;

    }

    /* ===================================================================== */
    /* METADATA SEARCH */
    /* ===================================================================== */

    searchMetadata(
        query
    ) {

        const keyword =
            query
            .trim()
            .toLowerCase();

        return this.index

            .filter(
                (
                    item
                ) =>

                    item.category
                    .toLowerCase()
                    .includes(
                        keyword
                    ) ||

                    item.date
                    .toLowerCase()
                    .includes(
                        keyword
                    )
            )

            .map(
                (
                    item
                ) =>
                    item.source
            );

    }

    /* ===================================================================== */
    /* REBUILD */
    /* ===================================================================== */

    rebuild(
        categories
    ) {

        this.categories =
            categories;

        this.buildIndex();

    }

    /* ===================================================================== */
    /* STATS */
    /* ===================================================================== */

    getStats() {

        return {

            categories:
                this.categories.length,

            indexedFiles:
                this.index.length

        };

    }

} 
