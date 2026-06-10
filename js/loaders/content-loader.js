/* ==========================================================================
   js/loaders/content-loader.js
   Native Browser Experience Engine
   ========================================================================== */

import {
    loadText,
    loadBlob,
    loadObjectURL
} from '../core/cache.js';

import {
    getFileType
} from './json-loader.js';

/* ==========================================================================
   CONTENT LOADERS
   ========================================================================== */

export async function loadContent(
    filePath
) {

    const type =
        getFileType(
            filePath
        );

    switch (type) {

        case 'markdown':
            return loadMarkdown(
                filePath
            );

        case 'pdf':
            return loadPDF(
                filePath
            );

        case 'docx':
            return loadDOCX(
                filePath
            );

        default:

            throw new Error(
                `Unsupported file type: ${filePath}`
            );

    }

}

/* ==========================================================================
   MARKDOWN
   ========================================================================== */

export async function loadMarkdown(
    filePath
) {

    const content =
        await loadText(
            filePath
        );

    return {

        type: 'markdown',

        path: filePath,

        content

    };

}

/* ==========================================================================
   PDF
   ========================================================================== */

export async function loadPDF(
    filePath
) {

    const objectURL =
        await loadObjectURL(
            filePath
        );

    return {

        type: 'pdf',

        path: filePath,

        url: objectURL

    };

}

/* ==========================================================================
   DOCX
   ========================================================================== */

export async function loadDOCX(
    filePath
) {

    const blob =
        await loadBlob(
            filePath
        );

    const arrayBuffer =
        await blob.arrayBuffer();

    return {

        type: 'docx',

        path: filePath,

        blob,

        arrayBuffer

    };

}

/* ==========================================================================
   FILE DOWNLOAD
   ========================================================================== */

export async function downloadFile(
    filePath,
    fileName = ''
) {

    const blob =
        await loadBlob(
            filePath
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const anchor =
        document.createElement(
            'a'
        );

    anchor.href = url;

    anchor.download =
        fileName ||
        filePath
            .split('/')
            .pop() ||
        'download';

    document.body.appendChild(
        anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
        url
    );

}

/* ==========================================================================
   FILE INFO
   ========================================================================== */

export async function getFileInfo(
    filePath
) {

    const blob =
        await loadBlob(
            filePath
        );

    return {

        path: filePath,

        type:
            getFileType(
                filePath
            ),

        size:
            blob.size,

        mime:
            blob.type ||
            'application/octet-stream'

    };

}

/* ==========================================================================
   DOCX XML EXTRACTION
   ========================================================================== */

async function inflateRawDeflate(
    compressedData
) {

    if (
        typeof DecompressionStream ===
        'undefined'
    ) {

        throw new Error(
            'DecompressionStream API unavailable'
        );

    }

    const stream =
        new Blob([
            compressedData
        ])
        .stream()
        .pipeThrough(
            new DecompressionStream(
                'deflate-raw'
            )
        );

    const response =
        new Response(
            stream
        );

    return response.arrayBuffer();

}

function readUint16(
    view,
    offset
) {

    return view.getUint16(
        offset,
        true
    );

}

function readUint32(
    view,
    offset
) {

    return view.getUint32(
        offset,
        true
    );

}

/* ==========================================================================
   DOCX PARSER
   Native ZIP Reader
   ========================================================================== */

export async function extractDOCXText(
    arrayBuffer
) {

    const bytes =
        new Uint8Array(
            arrayBuffer
        );

    const view =
        new DataView(
            arrayBuffer
        );

    const files =
        [];

    let offset = 0;

    while (
        offset <
        bytes.length - 30
    ) {

        const signature =
            readUint32(
                view,
                offset
            );

        if (
            signature !==
            0x04034b50
        ) {

            offset++;
            continue;

        }

        const compression =
            readUint16(
                view,
                offset + 8
            );

        const compressedSize =
            readUint32(
                view,
                offset + 18
            );

        const fileNameLength =
            readUint16(
                view,
                offset + 26
            );

        const extraLength =
            readUint16(
                view,
                offset + 28
            );

        const nameStart =
            offset + 30;

        const nameEnd =
            nameStart +
            fileNameLength;

        const fileName =
            new TextDecoder()
            .decode(
                bytes.slice(
                    nameStart,
                    nameEnd
                )
            );

        const dataStart =
            nameEnd +
            extraLength;

        const dataEnd =
            dataStart +
            compressedSize;

        files.push({

            fileName,

            compression,

            data:
                bytes.slice(
                    dataStart,
                    dataEnd
                )

        });

        offset = dataEnd;

    }

    const documentXML =
        files.find(
            (file) =>
                file.fileName ===
                'word/document.xml'
        );

    if (!documentXML) {

        throw new Error(
            'word/document.xml not found'
        );

    }

    let xmlBuffer;

    if (
        documentXML.compression === 0
    ) {

        xmlBuffer =
            documentXML.data.buffer.slice(
                documentXML.data.byteOffset,
                documentXML.data.byteOffset +
                documentXML.data.byteLength
            );

    }
    else if (
        documentXML.compression === 8
    ) {

        xmlBuffer =
            await inflateRawDeflate(
                documentXML.data
            );

    }
    else {

        throw new Error(
            `Unsupported DOCX compression: ${documentXML.compression}`
        );

    }

    const xmlText =
        new TextDecoder()
        .decode(
            xmlBuffer
        );

    return xmlText;

} 
