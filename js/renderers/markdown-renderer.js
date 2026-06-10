/* ==========================================================================
   js/renderers/markdown-renderer.js
   Native Browser Experience Engine
   ========================================================================== */

export class MarkdownRenderer {

    constructor() {

        this.container = null;

    }

    async render(
        markdownData,
        mountPoint
    ) {

        this.container =
            document.createElement(
                'div'
            );

        this.container.id =
            'markdown-viewer';

        const html =
            this.parseMarkdown(
                markdownData.content
            );

        this.container.innerHTML =
            html;

        mountPoint.appendChild(
            this.container
        );

        this.bindLinks();

    }

    /* ===================================================================== */
    /* MARKDOWN PARSER
       Native Parser
    /* ===================================================================== */

    parseMarkdown(
        markdown
    ) {

        let html = markdown;

        html =
            this.escapeUnsafeHTML(
                html
            );

        html =
            this.parseCodeBlocks(
                html
            );

        html =
            this.parseTables(
                html
            );

        html =
            this.parseHeadings(
                html
            );

        html =
            this.parseBlockquotes(
                html
            );

        html =
            this.parseLists(
                html
            );

        html =
            this.parseLinks(
                html
            );

        html =
            this.parseInlineCode(
                html
            );

        html =
            this.parseBold(
                html
            );

        html =
            this.parseItalic(
                html
            );

        html =
            this.parseParagraphs(
                html
            );

        return html;

    }

    /* ===================================================================== */
    /* SANITIZE
    /* ===================================================================== */

    escapeUnsafeHTML(
        text
    ) {

        return text

            .replace(
                /&/g,
                '&amp;'
            )

            .replace(
                /</g,
                '&lt;'
            )

            .replace(
                />/g,
                '&gt;'
            );

    }

    /* ===================================================================== */
    /* HEADINGS
    /* ===================================================================== */

    parseHeadings(
        text
    ) {

        return text

            .replace(
                /^###### (.*)$/gm,
                '<h6>$1</h6>'
            )

            .replace(
                /^##### (.*)$/gm,
                '<h5>$1</h5>'
            )

            .replace(
                /^#### (.*)$/gm,
                '<h4>$1</h4>'
            )

            .replace(
                /^### (.*)$/gm,
                '<h3>$1</h3>'
            )

            .replace(
                /^## (.*)$/gm,
                '<h2>$1</h2>'
            )

            .replace(
                /^# (.*)$/gm,
                '<h1>$1</h1>'
            );

    }

    /* ===================================================================== */
    /* CODE BLOCKS
    /* ===================================================================== */

    parseCodeBlocks(
        text
    ) {

        return text.replace(

            /```([\s\S]*?)```/g,

            (
                match,
                code
            ) =>

                `<pre><code>${code.trim()}</code></pre>`

        );

    }

    /* ===================================================================== */
    /* INLINE CODE
    /* ===================================================================== */

    parseInlineCode(
        text
    ) {

        return text.replace(

            /`([^`]+)`/g,

            '<code>$1</code>'

        );

    }

    /* ===================================================================== */
    /* BOLD
    /* ===================================================================== */

    parseBold(
        text
    ) {

        return text.replace(

            /\*\*(.*?)\*\*/g,

            '<strong>$1</strong>'

        );

    }

    /* ===================================================================== */
    /* ITALIC
    /* ===================================================================== */

    parseItalic(
        text
    ) {

        return text.replace(

            /\*(.*?)\*/g,

            '<em>$1</em>'

        );

    }

    /* ===================================================================== */
    /* LINKS
    /* ===================================================================== */

    parseLinks(
        text
    ) {

        return text.replace(

            /\[(.*?)\]\((.*?)\)/g,

            (
                match,
                label,
                url
            ) =>

                `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`

        );

    }

    /* ===================================================================== */
    /* BLOCKQUOTES
    /* ===================================================================== */

    parseBlockquotes(
        text
    ) {

        return text.replace(

            /^> (.*)$/gm,

            '<blockquote>$1</blockquote>'

        );

    }

    /* ===================================================================== */
    /* LISTS
    /* ===================================================================== */

    parseLists(
        text
    ) {

        const lines =
            text.split('\n');

        const output = [];

        let inList = false;

        for (
            const line of lines
        ) {

            const isListItem =
                /^[-*+] /.test(
                    line
                );

            if (
                isListItem &&
                !inList
            ) {

                output.push('<ul>');
                inList = true;

            }

            if (
                !isListItem &&
                inList
            ) {

                output.push('</ul>');
                inList = false;

            }

            if (isListItem) {

                output.push(

                    `<li>${line.replace(
                        /^[-*+] /,
                        ''
                    )}</li>`

                );

            }
            else {

                output.push(
                    line
                );

            }

        }

        if (inList) {

            output.push('</ul>');

        }

        return output.join(
            '\n'
        );

    }

    /* ===================================================================== */
    /* TABLES
    /* ===================================================================== */

    parseTables(
        text
    ) {

        const lines =
            text.split('\n');

        let html = '';

        let i = 0;

        while (
            i < lines.length
        ) {

            const line =
                lines[i];

            const next =
                lines[i + 1];

            const isTableHeader =
                line.includes('|') &&
                next &&
                /^(\|\s*-+\s*)+\|?$/
                .test(
                    next
                );

            if (
                !isTableHeader
            ) {

                html +=
                    line + '\n';

                i++;
                continue;

            }

            const headers =
                line
                .split('|')
                .map(
                    (value) =>
                        value.trim()
                )
                .filter(Boolean);

            html += '<table>';
            html += '<thead><tr>';

            for (
                const header of
                headers
            ) {

                html +=
                    `<th>${header}</th>`;

            }

            html +=
                '</tr></thead><tbody>';

            i += 2;

            while (
                i < lines.length &&
                lines[i].includes('|')
            ) {

                const cells =
                    lines[i]
                    .split('|')
                    .map(
                        (
                            value
                        ) =>
                            value.trim()
                    )
                    .filter(Boolean);

                html += '<tr>';

                for (
                    const cell of
                    cells
                ) {

                    html +=
                        `<td>${cell}</td>`;

                }

                html += '</tr>';

                i++;

            }

            html +=
                '</tbody></table>';

        }

        return html;

    }

    /* ===================================================================== */
    /* PARAGRAPHS
    /* ===================================================================== */

    parseParagraphs(
        text
    ) {

        const blockTags =
            /<(h\d|ul|li|pre|table|thead|tbody|tr|td|th|blockquote)/i;

        return text

            .split('\n')

            .map(
                (
                    line
                ) => {

                    const trimmed =
                        line.trim();

                    if (
                        !trimmed
                    ) {
                        return '';
                    }

                    if (
                        blockTags.test(
                            trimmed
                        )
                    ) {
                        return trimmed;
                    }

                    return `<p>${trimmed}</p>`;

                }
            )

            .join('\n');

    }

    /* ===================================================================== */
    /* LINKS
    /* ===================================================================== */

    bindLinks() {

        if (
            !this.container
        ) {
            return;
        }

        const links =
            this.container
            .querySelectorAll(
                'a'
            );

        links.forEach(
            (
                link
            ) => {

                link.addEventListener(
                    'click',
                    () => {}
                );

            }
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
