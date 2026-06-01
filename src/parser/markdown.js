import { sanitizer } from "./sanitizer.js";

export class MarkdownParser {

    constructor() {

        this.toc = [];
    }

    parse(markdown = "") {

        this.toc = [];

        let html = String(markdown)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

        html = this.parseCodeBlocks(html);

        html = this.parseHorizontalRules(html);

        html = this.parseHeadings(html);

        html = this.parseBlockquotes(html);

        html = this.parseTaskLists(html);

        html = this.parseLists(html);

        html = this.parseParagraphs(html);

        html = this.parseInline(html);

        return sanitizer.sanitize(html);
    }

    parseCodeBlocks(content) {

        return content.replace(

            /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,

            (_, language, code) => {

                const escaped =
                    sanitizer.escapeText(
                        code.trimEnd()
                    );

                const lang =
                    sanitizer.escapeText(
                        language || ""
                    );

                return `
<pre>
<code data-language="${lang}">
${escaped}
</code>
</pre>
`;
            }
        );
    }

    parseHorizontalRules(content) {

        return content.replace(
            /^\s*([-*_]){3,}\s*$/gm,
            "<hr>"
        );
    }

    parseHeadings(content) {

        return content.replace(

            /^(#{1,6})\s+(.+)$/gm,

            (_, hashes, text) => {

                const level =
                    hashes.length;

                const clean =
                    text.trim();

                const anchor =
                    this.slugify(clean);

                this.toc.push({

                    level,

                    text: clean,

                    anchor
                });

                return `
<h${level}
id="${anchor}"
data-anchor="${anchor}"
data-level="${level}">
${clean}
</h${level}>
`;
            }
        );
    }

    parseBlockquotes(content) {

        return content.replace(

            /^>\s?(.*)$/gm,

            (_, quote) => {

                return `
<blockquote>
${quote}
</blockquote>
`;
            }
        );
    }

    parseTaskLists(content) {

        return content.replace(

            /^\s*[-*]\s+\[(x|X| )\]\s+(.*)$/gm,

            (_, state, text) => {

                const checked =
                    state.toLowerCase() === "x";

                return `
<li
role="checkbox"
aria-checked="${checked}">
${checked ? "☑" : "☐"}
${text}
</li>
`;
            }
        );
    }

    parseLists(content) {

        const lines =
            content.split("\n");

        const output = [];

        let inList = false;

        for (const line of lines) {

            const unordered =
                /^\s*[-*]\s+(.+)$/.exec(line);

            const ordered =
                /^\s*\d+\.\s+(.+)$/.exec(line);

            if (unordered) {

                if (!inList) {

                    output.push("<ul>");

                    inList = true;
                }

                output.push(
                    `<li>${unordered[1]}</li>`
                );

                continue;
            }

            if (ordered) {

                if (!inList) {

                    output.push("<ol>");

                    inList = true;
                }

                output.push(
                    `<li>${ordered[1]}</li>`
                );

                continue;
            }

            if (inList) {

                output.push("</ul>");

                inList = false;
            }

            output.push(line);
        }

        if (inList) {

            output.push("</ul>");
        }

        return output.join("\n");
    }

    parseParagraphs(content) {

        const blocks =
            content.split(/\n{2,}/);

        return blocks
            .map(block => {

                const trimmed =
                    block.trim();

                if (!trimmed) {

                    return "";
                }

                if (
                    trimmed.startsWith("<")
                ) {

                    return trimmed;
                }

                return `<p>${trimmed}</p>`;
            })
            .join("\n");
    }

    parseInline(content) {

        content =
            content.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );

        content =
            content.replace(
                /\*(.*?)\*/g,
                "<em>$1</em>"
            );

        content =
            content.replace(
                /__(.*?)__/g,
                "<u>$1</u>"
            );

        content =
            content.replace(
                /~~(.*?)~~/g,
                "<s>$1</s>"
            );

        content =
            content.replace(
                /==(.*?)==/g,
                "<mark>$1</mark>"
            );

        content =
            content.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );

        content =
            content.replace(

                /!\[(.*?)\]\((.*?)\)/g,

                (
                    _,
                    alt,
                    src
                ) => {

                    return `
<img
src="${src}"
alt="${alt}"
loading="lazy">
`;
                }
            );

        content =
            content.replace(

                /\[(.*?)\]\((.*?)\)/g,

                (
                    _,
                    label,
                    href
                ) => {

                    return `
<a href="${href}">
${label}
</a>
`;
                }
            );

        return content;
    }

    slugify(text) {

        return text

            .toLowerCase()

            .normalize("NFD")

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .replace(
                /[^a-z0-9\s-]/g,
                ""
            )

            .trim()

            .replace(
                /\s+/g,
                "-"
            );
    }

    getTOC() {

        return [
            ...this.toc
        ];
    }
}

export const markdown =
    new MarkdownParser();

export default MarkdownParser; 
