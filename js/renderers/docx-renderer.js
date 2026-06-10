/* ==========================================================================
   js/renderers/docx-renderer.js
   Native Browser Experience Engine
   Native DOCX Viewer (No Libraries)
   ========================================================================== */

import {
    extractDOCXText
} from '../loaders/content-loader.js';

export class DOCXRenderer {

    constructor() {

        this.container = null;

    }

    async render(
        docxData,
        mountPoint
    ) {

        this.container =
            document.createElement(
                'div'
            );

        this.container.id =
            'docx-viewer';

        try {

            const xml =
                await extractDOCXText(
                    docxData.arrayBuffer
                );

            const html =
                this.convertXMLToHTML(
                    xml
                );

            this.container.innerHTML =
                html;

        }
        catch (error) {

            console.error(
                '[DOCX Renderer]',
                error
            );

            this.container.innerHTML =
                `
                <div class="empty-viewer-content">

                    <h2>
                        DOCX Preview Unavailable
                    </h2>

                    <p>
                        This document cannot be rendered by the native viewer.
                    </p>

                    <p>
                        Download the file to open it with Microsoft Word,
                        LibreOffice or another DOCX-compatible editor.
                    </p>

                </div>
                `;

        }

        mountPoint.appendChild(
            this.container
        );

    }

    /* ===================================================================== */
    /* XML → HTML
    /* ===================================================================== */

    convertXMLToHTML(
        xml
    ) {

        const parser =
            new DOMParser();

        const xmlDocument =
            parser.parseFromString(
                xml,
                'application/xml'
            );

        const paragraphs =
            [
                ...xmlDocument.querySelectorAll(
                    'w\\:p, p'
                )
            ];

        if (
            paragraphs.length === 0
        ) {

            return `
            <div class="empty-viewer-content">

                <h2>
                    Empty Document
                </h2>

                <p>
                    No readable content found.
                </p>

            </div>
            `;

        }

        const output = [];

        for (
            const paragraph of
            paragraphs
        ) {

            const html =
                this.parseParagraph(
                    paragraph
                );

            if (
                html.trim()
                    .length > 0
            ) {

                output.push(
                    html
                );

            }

        }

        return output.join(
            '\n'
        );

    }

    /* ===================================================================== */
    /* PARAGRAPH
    /* ===================================================================== */

    parseParagraph(
        paragraph
    ) {

        const runs =
            [
                ...paragraph.querySelectorAll(
                    'w\\:r, r'
                )
            ];

        if (
            runs.length === 0
        ) {

            const directText =
                this.extractText(
                    paragraph
                );

            return directText
                ? `<p>${directText}</p>`
                : '';

        }

        const fragments = [];

        for (
            const run of runs
        ) {

            fragments.push(

                this.parseRun(
                    run
                )

            );

        }

        const content =
            fragments.join('');

        if (
            content.trim()
                .length === 0
        ) {

            return '';

        }

        const headingLevel =
            this.detectHeading(
                paragraph
            );

        if (
            headingLevel
        ) {

            return `
            <h${headingLevel}>
                ${content}
            </h${headingLevel}>
            `;

        }

        return `
        <p>
            ${content}
        </p>
        `;

    }

    /* ===================================================================== */
    /* RUN
    /* ===================================================================== */

    parseRun(
        run
    ) {

        const text =
            this.extractText(
                run
            );

        if (
            !text
        ) {

            return '';
        }

        let output = text;

        const bold =
            run.querySelector(
                'w\\:b, b'
            );

        const italic =
            run.querySelector(
                'w\\:i, i'
            );

        const underline =
            run.querySelector(
                'w\\:u, u'
            );

        if (bold) {

            output =
                `<strong>${output}</strong>`;

        }

        if (italic) {

            output =
                `<em>${output}</em>`;

        }

        if (underline) {

            output =
                `<u>${output}</u>`;

        }

        return output;

    }

    /* ===================================================================== */
    /* TEXT EXTRACTION
    /* ===================================================================== */

    extractText(
        node
    ) {

        const texts =
            [
                ...node.querySelectorAll(
                    'w\\:t, t'
                )
            ];

        if (
            texts.length === 0
        ) {

            return '';
        }

        return texts
            .map(
                (
                    item
                ) =>
                    item.textContent
            )
            .join('');

    }

    /* ===================================================================== */
    /* HEADING DETECTION
    /* ===================================================================== */

    detectHeading(
        paragraph
    ) {

        const style =
            paragraph.querySelector(
                'w\\:pStyle, pStyle'
            );

        if (
            !style
        ) {

            return null;

        }

        const value =
            style.getAttribute(
                'w:val'
            ) ||
            style.getAttribute(
                'val'
            ) ||
            '';

        const match =
            value.match(
                /Heading([1-6])/i
            );

        if (
            !match
        ) {

            return null;

        }

        return Number(
            match[1]
        );

    }

    /* ===================================================================== */
    /* DESTROY
    /* ===================================================================== */

    destroy() {

        if (
            this.container
        ) {

            this.container.remove();

        }

        this.container = null;

    }

} 
