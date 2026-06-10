/* ==========================================================================
   js/loaders/content-loader.js
   Native Browser Experience Engine
   Markdown + PDF + DOCX Native Loader
   ========================================================================== */

import {
    getFileType
} from './json-loader.js';

const contentCache =
    new Map();

/* ==========================================================================
   LOAD CONTENT
   ========================================================================== */

export async function loadContent(
    path
) {

    if (
        contentCache.has(
            path
        )
    ) {

        return contentCache.get(
            path
        );

    }

    const type =
        getFileType(
            path
        );

    let result;

    switch (type) {

        case 'markdown':

            result =
                await loadMarkdown(
                    path
                );

            break;

        case 'pdf':

            result =
                await loadPDF(
                    path
                );

            break;

        case 'docx':

            result =
                await loadDOCX(
                    path
                );

            break;

        default:

            throw new Error(
                `Unsupported file type: ${path}`
            );

    }

    contentCache.set(
        path,
        result
    );

    return result;

}

/* ==========================================================================
   MARKDOWN
   ========================================================================== */

export async function loadMarkdown(
    path
) {

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
            `Markdown load failed: ${path}`
        );

    }

    const content =
        await response.text();

    return {

        type:
            'markdown',

        path,

        content

    };

}

/* ==========================================================================
   PDF
   ========================================================================== */

export async function loadPDF(
    path
) {

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
            `PDF load failed: ${path}`
        );

    }

    return {

        type:
            'pdf',

        path,

        url:
            path

    };

}

/* ==========================================================================
   DOCX
   ========================================================================== */

export async function loadDOCX(
    path
) {

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
            `DOCX load failed: ${path}`
        );

    }

    const arrayBuffer =
        await response.arrayBuffer();

    return {

        type:
            'docx',

        path,

        arrayBuffer

    };

}

/* ==========================================================================
   DOWNLOAD
   ========================================================================== */

export function downloadFile(
    url,
    filename
) {

    const anchor =
        document.createElement(
            'a'
        );

    anchor.href =
        url;

    anchor.download =
        filename ||
        '';

    anchor.rel =
        'noopener';

    document.body
        .appendChild(
            anchor
        );

    anchor.click();

    anchor.remove();

}

/* ==========================================================================
   DOCX XML EXTRACTION
   ========================================================================== */

export async function extractDOCXText(
    arrayBuffer
) {

    const zip =
        await parseZip(
            arrayBuffer
        );

    const documentXML =
        zip[
            'word/document.xml'
        ];

    if (
        !documentXML
    ) {

        throw new Error(
            'document.xml not found'
        );

    }

    return decodeText(
        documentXML
    );

}

/* ==========================================================================
   ZIP PARSER
   Pure Native ZIP Reader
   Supports DOCX containers
   ========================================================================== */

async function parseZip(
    buffer
) {

    const files = {};

    const view =
        new DataView(
            buffer
        );

    let offset = 0;

    const LOCAL_FILE_HEADER =
        0x04034b50;

    while (
        offset <
        view.byteLength
    ) {

        const signature =
            view.getUint32(
                offset,
                true
            );

        if (
            signature !==
            LOCAL_FILE_HEADER
        ) {

            break;

        }

        const compression =
            view.getUint16(
                offset + 8,
                true
            );

        const compressedSize =
            view.getUint32(
                offset + 18,
                true
            );

        const fileNameLength =
            view.getUint16(
                offset + 26,
                true
            );

        const extraLength =
            view.getUint16(
                offset + 28,
                true
            );

        const fileNameStart =
            offset + 30;

        const fileNameEnd =
            fileNameStart +
            fileNameLength;

        const fileName =
            decodeText(

                buffer.slice(
                    fileNameStart,
                    fileNameEnd
                )

            );

        const dataStart =
            fileNameEnd +
            extraLength;

        const dataEnd =
            dataStart +
            compressedSize;

        const fileData =
            buffer.slice(
                dataStart,
                dataEnd
            );

        if (
            compression === 0
        ) {

            files[
                fileName
            ] = fileData;

        }

        offset =
            dataEnd;

    }

    return files;

}

/* ==========================================================================
   TEXT DECODER
   ========================================================================== */

function decodeText(
    buffer
) {

    return new TextDecoder(
        'utf-8'
    ).decode(
        buffer
    );

}

/* ==========================================================================
   CACHE
   ========================================================================== */

export function clearContentCache() {

    contentCache.clear();

}

export function getContentCacheSize() {

    return contentCache.size;

} 
