/* ==========================================================================
   js/loaders/json-loader.js
   Native Browser Experience Engine
   Recursive Content Discovery Loader
   ========================================================================== */

import { CONFIG } from '../core/config.js';

const cache =
    new Map();

/* ==========================================================================
   FETCH JSON
   ========================================================================== */

export async function fetchJSON(
    path
) {

    if (
        CONFIG.CACHE.ENABLED &&
        cache.has(path)
    ) {

        return cache.get(
            path
        );

    }

    const response =
        await fetch(
            path,
            {
                cache: 'force-cache'
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `Failed to load JSON: ${path}`
        );

    }

    const data =
        await response.json();

    if (
        CONFIG.CACHE.ENABLED
    ) {

        cache.set(
            path,
            data
        );

    }

    return data;

}

/* ==========================================================================
   LOCALDATA DISCOVERY
   ========================================================================== */

export async function discoverContent() {

    const localData =
        await fetchJSON(
            CONFIG.DATA.INDEX
        );

    const categories = [];

    for (
        const entry of localData
    ) {

        const category =
            await loadCategory(
                entry
            );

        categories.push(
            category
        );

    }

    return categories;

}

/* ==========================================================================
   CATEGORY
   ========================================================================== */

export async function loadCategory(
    categoryEntry
) {

    const fileList =
        await fetchJSON(
            categoryEntry.folder
        );

    const files = [];

    for (
        const item of fileList
    ) {

        files.push({

            title:
                item.title,

            file:
                normalizePath(
                    item.file,
                    categoryEntry.folder
                )

        });

    }

    return {

        date:
            categoryEntry.date,

        description:
            categoryEntry.description,

        folder:
            categoryEntry.folder,

        files

    };

}

/* ==========================================================================
   RECURSIVE DISCOVERY
   ========================================================================== */

export async function discoverRecursive(
    rootIndex
) {

    const result = [];

    const visited =
        new Set();

    async function crawl(
        indexPath
    ) {

        if (
            visited.has(
                indexPath
            )
        ) {

            return;

        }

        visited.add(
            indexPath
        );

        const json =
            await fetchJSON(
                indexPath
            );

        if (
            !Array.isArray(
                json
            )
        ) {

            return;

        }

        for (
            const item of json
        ) {

            if (
                item.folder
            ) {

                await crawl(
                    item.folder
                );

                continue;

            }

            if (
                item.file
            ) {

                result.push({

                    title:
                        item.title,

                    file:
                        normalizePath(
                            item.file,
                            indexPath
                        )

                });

            }

        }

    }

    await crawl(
        rootIndex
    );

    return result;

}

/* ==========================================================================
   CATEGORY LABEL
   ========================================================================== */

export function categoryName(
    category
) {

    if (
        !category
    ) {

        return 'Unknown';

    }

    const label =
        category.description ||
        '';

    if (
        label
            .toLowerCase()
            .includes(
                'markdown'
            )
    ) {

        return 'Markdown';

    }

    if (
        label
            .toLowerCase()
            .includes(
                'pdf'
            )
    ) {

        return 'PDF';

    }

    if (
        label
            .toLowerCase()
            .includes(
                'docx'
            )
    ) {

        return 'DOCX';

    }

    return label ||
        'Category';

}

/* ==========================================================================
   FILE TYPE
   ========================================================================== */

export function getFileType(
    path
) {

    const lower =
        path.toLowerCase();

    if (
        CONFIG.FILE_TYPES
            .MARKDOWN
            .some(
                ext =>
                    lower.endsWith(
                        ext
                    )
            )
    ) {

        return 'markdown';

    }

    if (
        CONFIG.FILE_TYPES
            .PDF
            .some(
                ext =>
                    lower.endsWith(
                        ext
                    )
            )
    ) {

        return 'pdf';

    }

    if (
        CONFIG.FILE_TYPES
            .DOCX
            .some(
                ext =>
                    lower.endsWith(
                        ext
                    )
            )
    ) {

        return 'docx';

    }

    return 'unknown';

}

/* ==========================================================================
   PATH
   ========================================================================== */

export function normalizePath(
    file,
    source
) {

    if (
        file.startsWith(
            './'
        )
    ) {

        const base =
            source.substring(
                0,
                source.lastIndexOf(
                    '/'
                )
            );

        return (
            base +
            '/' +
            file.replace(
                './',
                ''
            )
        );

    }

    return file;

}

/* ==========================================================================
   CACHE
   ========================================================================== */

export function clearJSONCache() {

    cache.clear();

}

export function getJSONCacheSize() {

    return cache.size;

} 
