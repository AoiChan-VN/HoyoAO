export class Sanitizer {

    static ALLOWED_TAGS = new Set([

        "article",
        "section",
        "header",
        "footer",
        "nav",
        "aside",

        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",

        "p",
        "span",
        "strong",
        "em",
        "u",
        "mark",
        "s",

        "blockquote",
        "hr",

        "ul",
        "ol",
        "li",

        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",

        "pre",
        "code",

        "img",
        "a",

        "sup",
        "sub",

        "br",

        "div"
    ]);

    static GLOBAL_ATTRIBUTES = new Set([

        "id",
        "class",
        "title",
        "lang",
        "dir",

        "aria-label",
        "aria-hidden",
        "aria-current",

        "role",

        "data-anchor",
        "data-footnote",
        "data-level"
    ]);

    static TAG_ATTRIBUTES = {

        a: new Set([
            "href",
            "target",
            "rel"
        ]),

        img: new Set([
            "src",
            "alt",
            "width",
            "height",
            "loading",
            "decoding"
        ]),

        th: new Set([
            "colspan",
            "rowspan"
        ]),

        td: new Set([
            "colspan",
            "rowspan"
        ])
    };

    static DANGEROUS_PROTOCOLS = [

        "javascript:",
        "vbscript:",
        "data:text/html",
        "data:application",
        "file:",
        "blob:"
    ];

    static DANGEROUS_ATTRIBUTES = [

        "style",
        "srcset",

        "onload",
        "onclick",
        "onerror",
        "onmouseover",
        "onmouseenter",
        "onmouseleave",
        "onfocus",
        "onblur",
        "onkeydown",
        "onkeyup",
        "onchange",
        "onsubmit",
        "onwheel",
        "ontouchstart",
        "ontouchmove",
        "ontouchend"
    ];

    sanitize(html = "") {

        if (
            typeof html !== "string"
        ) {

            return "";
        }

        const parser =
            new DOMParser();

        const documentFragment =
            parser.parseFromString(
                html,
                "text/html"
            );

        this.walk(
            documentFragment.body
        );

        return documentFragment
            .body
            .innerHTML;
    }

    walk(node) {

        const children = [
            ...node.children
        ];

        for (
            const child
            of children
        ) {

            this.sanitizeElement(
                child
            );

            this.walk(child);
        }
    }

    sanitizeElement(element) {

        const tag =
            element.tagName
                .toLowerCase();

        if (
            !Sanitizer.ALLOWED_TAGS.has(
                tag
            )
        ) {

            this.unwrap(element);

            return;
        }

        this.cleanAttributes(
            element,
            tag
        );
    }

    cleanAttributes(
        element,
        tag
    ) {

        const attributes =
            [
                ...element.attributes
            ];

        for (
            const attribute
            of attributes
        ) {

            const name =
                attribute.name
                    .toLowerCase();

            const value =
                attribute.value;

            if (
                Sanitizer
                    .DANGEROUS_ATTRIBUTES
                    .includes(name)
            ) {

                element.removeAttribute(
                    attribute.name
                );

                continue;
            }

            const allowed =
                this.isAllowedAttribute(
                    tag,
                    name
                );

            if (!allowed) {

                element.removeAttribute(
                    attribute.name
                );

                continue;
            }

            if (
                name === "href" ||
                name === "src"
            ) {

                if (
                    !this.isSafeUrl(
                        value
                    )
                ) {

                    element.removeAttribute(
                        attribute.name
                    );

                    continue;
                }
            }
        }

        if (
            tag === "a"
        ) {

            element.setAttribute(
                "rel",
                "noopener noreferrer nofollow"
            );
        }

        if (
            tag === "img"
        ) {

            element.setAttribute(
                "loading",
                "lazy"
            );

            element.setAttribute(
                "decoding",
                "async"
            );
        }
    }

    isAllowedAttribute(
        tag,
        name
    ) {

        if (
            Sanitizer
                .GLOBAL_ATTRIBUTES
                .has(name)
        ) {

            return true;
        }

        const tagRules =
            Sanitizer
                .TAG_ATTRIBUTES[
                    tag
                ];

        if (
            !tagRules
        ) {

            return false;
        }

        return tagRules.has(
            name
        );
    }

    isSafeUrl(
        value
    ) {

        if (
            !value
        ) {

            return false;
        }

        const normalized =
            value
                .trim()
                .toLowerCase();

        for (
            const protocol
            of Sanitizer
                .DANGEROUS_PROTOCOLS
        ) {

            if (
                normalized.startsWith(
                    protocol
                )
            ) {

                return false;
            }
        }

        return true;
    }

    unwrap(element) {

        const parent =
            element.parentNode;

        if (
            !parent
        ) {

            return;
        }

        while (
            element.firstChild
        ) {

            parent.insertBefore(
                element.firstChild,
                element
            );
        }

        parent.removeChild(
            element
        );
    }

    escapeText(
        text = ""
    ) {

        return String(text)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                `"`,
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#39;"
            );
    }

    stripHtml(
        html = ""
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.innerHTML = html;

        return (
            div.textContent ||
            div.innerText ||
            ""
        );
    }

    validateHtml(
        html = ""
    ) {

        const cleaned =
            this.sanitize(
                html
            );

        return (
            cleaned === html
        );
    }
}

export const sanitizer =
    new Sanitizer();

export default Sanitizer; 
