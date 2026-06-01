export class TemplateRenderer {

    constructor() {

        this.navigationRoot =
            document.getElementById(
                "navigation"
            );

        this.footerRoot =
            document.getElementById(
                "site-footer"
            );
    }

    renderNavigation(
        navigation = []
    ) {

        if (
            !this.navigationRoot
        ) {

            return;
        }

        const items =
            navigation
                .map(item => {

                    return `
<li class="nav-item">

<a
href="${this.escapeAttribute(item.href)}"
class="nav-link">

${this.escape(item.label)}

</a>

</li>
`;
                })
                .join("");

        this.navigationRoot.innerHTML = `
<div class="nav-brand">
    <a href="/">
        ${this.escape(
            document.title
        )}
    </a>
</div>

<ul class="nav-list">
    ${items}
</ul>
`;
    }

    renderFooter(
        data = {}
    ) {

        if (
            !this.footerRoot
        ) {

            return;
        }

        const year =
            new Date()
                .getFullYear();

        this.footerRoot.innerHTML = `
<div class="footer-inner">

<p>
${this.escape(
    data.copyright ??
    `© ${year}`
)}
</p>

</div>
`;
    }

    renderBreadcrumb(
        items = []
    ) {

        if (
            !items.length
        ) {

            return "";
        }

        const html =
            items
                .map(item => {

                    return `
<li>

<a
href="${this.escapeAttribute(item.href)}">

${this.escape(item.label)}

</a>

</li>
`;
                })
                .join("");

        return `
<nav
class="breadcrumb"
aria-label="Breadcrumb">

<ol>

${html}

</ol>

</nav>
`;
    }

    renderLoading(
        message =
            "Loading..."
    ) {

        return `
<section
class="loading-state"
aria-busy="true">

<div class="loading-spinner">
</div>

<p>
${this.escape(message)}
</p>

</section>
`;
    }

    renderEmpty(
        title =
            "No Content",
        message =
            "Nothing available."
    ) {

        return `
<section
class="empty-state">

<h2>
${this.escape(title)}
</h2>

<p>
${this.escape(message)}
</p>

</section>
`;
    }

    renderError(
        title =
            "Error",
        message =
            "Unexpected error."
    ) {

        return `
<section
class="error-state"
role="alert">

<h2>
${this.escape(title)}
</h2>

<p>
${this.escape(message)}
</p>

</section>
`;
    }

    renderMeta(
        meta = {}
    ) {

        Object.entries(
            meta
        ).forEach(

            (
                [key, value]
            ) => {

                const target =
                    document.querySelector(
                        `[data-dynamic-meta="${key}"]`
                    );

                if (
                    target
                ) {

                    target.setAttribute(
                        "content",
                        String(value)
                    );
                }
            }
        );
    }

    updateTitle(
        title
    ) {

        if (
            !title
        ) {

            return;
        }

        document.title =
            String(title);
    }

    updateCanonical(
        url
    ) {

        const canonical =
            document.getElementById(
                "canonical-link"
            );

        if (
            !canonical
        ) {

            return;
        }

        canonical.href =
            url;
    }

    renderStructuredData(
        data
    ) {

        const node =
            document.getElementById(
                "structured-data"
            );

        if (
            !node
        ) {

            return;
        }

        node.textContent =
            JSON.stringify(
                data,
                null,
                2
            );
    }

    createArticleLayout(
        options = {}
    ) {

        return `
<article
class="article-layout">

${options.breadcrumb ?? ""}

<header
class="article-header">

<h1>
${this.escape(
    options.title ?? ""
)}
</h1>

</header>

<section
class="article-body">

${options.content ?? ""}

</section>

</article>
`;
    }

    createPageLayout(
        options = {}
    ) {

        return `
<section
class="page-layout">

<header>

<h1>
${this.escape(
    options.title ?? ""
)}
</h1>

</header>

<div
class="page-content">

${options.content ?? ""}

</div>

</section>
`;
    }

    createSearchLayout(
        query,
        results = []
    ) {

        const items =
            results
                .map(item => {

                    return `
<li>

<a
href="${this.escapeAttribute(
    item.url
)}">

${this.escape(
    item.title
)}

</a>

</li>
`;
                })
                .join("");

        return `
<section
class="search-results">

<h2>

Search:
${this.escape(query)}

</h2>

<ul>

${items}

</ul>

</section>
`;
    }

    escape(
        value = ""
    ) {

        return String(value)

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

    escapeAttribute(
        value = ""
    ) {

        return this.escape(
            value
        );
    }
}

export const template =
    new TemplateRenderer();

export default TemplateRenderer; 
