/* ==========================================================================
   js/loaders/json-loader.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';
import { loadJSON } from '../core/cache.js';

/* ==========================================================================
   PATH HELPERS
   ========================================================================== */

function normalizePath(path) {

    if (!path) {
        return '';
    }

    return path
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/');

}

function getDirectory(path) {

    const normalized =
        normalizePath(path);

    const lastSlash =
        normalized.lastIndexOf('/');

    if (lastSlash === -1) {
        return '';
    }

    return normalized.slice(
        0,
        lastSlash + 1
    );

}

function resolveRelativePath(
    basePath,
    relativePath
) {

    if (!relativePath) {
        return '';
    }

    if (
        relativePath.startsWith('/') ||
        relativePath.startsWith('http')
    ) {

        return relativePath;

    }

    const baseDir =
        getDirectory(basePath);

    return normalizePath(
        `${baseDir}${relativePath}`
    );

}

/* ==========================================================================
   LOCALDATA LOADER
   ========================================================================== */

export async function loadLocalData() {

    const data =
        await loadJSON(
            CONFIG.PATHS.LOCAL_DATA
        );

    if (!Array.isArray(data)) {

        throw new Error(
            'localdata.json must contain an array'
        );

    }

    return data;

}

/* ==========================================================================
   CATEGORY LOADER
   ========================================================================== */

export async function loadCategoryIndex(
    indexPath
) {

    const resolvedPath =
        normalizePath(indexPath);

    const data =
        await loadJSON(
            resolvedPath
        );

    if (!Array.isArray(data)) {

        throw new Error(
            `${resolvedPath} must contain an array`
        );

    }

    return data.map(
        (item) => ({

            ...item,

            file:
                resolveRelativePath(
                    resolvedPath,
                    item.file || ''
                )

        })
    );

}

/* ==========================================================================
   RECURSIVE DISCOVERY
   ========================================================================== */

export async function discoverContent() {

    const localData =
        await loadLocalData();

    const categories = [];

    for (
        const category of localData
    ) {

        if (
            !category ||
            !category.folder
        ) {
            continue;
        }

        const indexPath =
            normalizePath(
                category.folder
            );

        const files =
            await loadCategoryIndex(
                indexPath
            );

        categories.push({

            date:
                category.date || '',

            description:
                category.description || '',

            folder:
                indexPath,

            files

        });

    }

    return categories;

}

/* ==========================================================================
   RECURSIVE INDEX SUPPORT
   ========================================================================== */

export async function discoverRecursive(
    rootIndexPath,
    output = []
) {

    const items =
        await loadCategoryIndex(
            rootIndexPath
        );

    for (
        const item of items
    ) {

        const file =
            item.file || '';

        if (
            file.endsWith(
                'list.json'
            )
        ) {

            await discoverRecursive(
                file,
                output
            );

            continue;

        }

        output.push(item);

    }

    return output;

}

/* ==========================================================================
   SEARCH INDEX CREATION
   ========================================================================== */

export async function buildSearchIndex() {

    const categories =
        await discoverContent();

    const index = [];

    for (
        const category of categories
    ) {

        for (
            const file of
            category.files
        ) {

            index.push({

                title:
                    file.title || '',

                file:
                    file.file || '',

                category:
                    category.description || '',

                date:
                    category.date || ''

            });

        }

    }

    return index;

}

/* ==========================================================================
   FILE TYPE HELPERS
   ========================================================================== */

export function getFileExtension(
    path
) {

    const clean =
        path.split('?')[0];

    const index =
        clean.lastIndexOf('.');

    if (index === -1) {
        return '';
    }

    return clean
        .slice(index + 1)
        .toLowerCase();

}

export function getFileType(
    path
) {

    const extension =
        getFileExtension(path);

    switch (extension) {

        case 'md':
            return 'markdown';

        case 'pdf':
            return 'pdf';

        case 'docx':
            return 'docx';

        default:
            return 'unknown';

    }

}

/* ==========================================================================
   CATEGORY NAME HELPER
   ========================================================================== */

export function categoryName(
    category
) {

    const label =
        category.description || '';

    if (label) {
        return label;
    }

    return category.folder
        .split('/')
        .filter(Boolean)
        .pop() || 'Unknown';

} 
