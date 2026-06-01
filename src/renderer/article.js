import { markdown } from "../parser/markdown.js";
import { toc } from "../parser/toc.js";
import { template } from "./template.js";

export class ArticleRenderer {

    constructor() {

        this.root =
            document.getElementById(
                "view"
            );

        this.progressBar =
            document.getElementById(
                "reading-progress-bar"
            );

        this.progressHandler =
            this.updateReadingProgress
                .bind(this);
    }

    async render(article) {

        if (!article) {

            this.renderError(
                "Article not found"
            );

            return;
        }

        const html =
            markdown.parse(
                article.content
            );

        const tocItems =
            markdown.getTOC();

        const layout =
            template.createArticleLayout({

                title:
                    article.title,

                content:
                    html,

                breadcrumb:
                    template.renderBreadcrumb([
                        {
                            label:
                                "Home",

                            href:
                                "/"
                        },
                        {
                            label:
                                article.title,

                            href:
                                location.pathname
                        }
                    ])
            });

        this.root.innerHTML =
            layout;

        toc.initialize(
            tocItems
        );

        this.setupCodeCopy();

        this.setupAnchors();

        this.setupImageZoom();

        this.setupReadingProgress();

        this.applySeo(article);

        this.cacheArticle(
            article
        );
    }

    async loadArticle(slug) {

        const response =
            await fetch(
                `/content/articles/${slug}.md`,
                {
                    cache:
                        "no-cache"
                }
            );

        if (
            !response.ok
        ) {

            throw new Error(
                "Article Load Failed"
            );
        }

        const content =
            await response.text();

        const metadata =
            await this.loadMetadata(
                slug
            );

        return {

            ...metadata,

            content
        };
    }

    async loadMetadata(
        slug
    ) {

        try {

            const response =
                await fetch(
                    `/cache/article-meta/${slug}.json`,
                    {
                        cache:
                            "no-cache"
                    }
                );

            if (
                !response.ok
            ) {

                return {};
            }

            return response.json();

        } catch {

            return {};
        }
    }

    setupReadingProgress() {

        this.destroyReadingProgress();

        window.addEventListener(

            "scroll",

            this.progressHandler,

            {
                passive: true
            }
        );

        this.updateReadingProgress();
    }

    updateReadingProgress() {

        if (
            !this.progressBar
        ) {

            return;
        }

        const scrollTop =
            window.scrollY;

        const documentHeight =
            document.documentElement
                .scrollHeight -
            window.innerHeight;

        const progress =
            documentHeight <= 0
                ? 0
                : (
                    scrollTop /
                    documentHeight
                ) * 100;

        this.progressBar.style.width =
            `${Math.min(
                100,
                Math.max(
                    0,
                    progress
                )
            )}%`;
    }

    destroyReadingProgress() {

        window.removeEventListener(

            "scroll",

            this.progressHandler
        );
    }

    setupCodeCopy() {

        const blocks =
            document.querySelectorAll(
                "pre"
            );

        blocks.forEach(
            block => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "copy-code-button";

                button.textContent =
                    "Copy";

                button.addEventListener(

                    "click",

                    async () => {

                        const code =
                            block.innerText;

                        try {

                            await navigator
                                .clipboard
                                .writeText(
                                    code
                                );

                            button.textContent =
                                "Copied";

                            setTimeout(
                                () => {

                                    button.textContent =
                                        "Copy";

                                },
                                1500
                            );

                        } catch {}
                    }
                );

                block.prepend(
                    button
                );
            }
        );
    }

    setupAnchors() {

        document
            .querySelectorAll(
                "[data-anchor]"
            )

            .forEach(node => {

                const anchor =
                    node.dataset
                        .anchor;

                const button =
                    document.createElement(
                        "a"
                    );

                button.href =
                    `#${anchor}`;

                button.className =
                    "anchor-link";

                button.setAttribute(
                    "aria-label",
                    "Copy section link"
                );

                button.textContent =
                    "#";

                node.appendChild(
                    button
                );
            });
    }

    setupImageZoom() {

        document
            .querySelectorAll(
                ".article-body img"
            )

            .forEach(image => {

                image.addEventListener(

                    "click",

                    () => {

                        this.openImage(
                            image.src,
                            image.alt
                        );
                    },

                    {
                        passive: true
                    }
                );
            });
    }

    openImage(
        src,
        alt
    ) {

        const modal =
            document.getElementById(
                "modal-root"
            );

        if (!modal) {

            return;
        }

        modal.innerHTML = `
<div
class="image-zoom-overlay">

<img
src="${src}"
alt="${alt}">

</div>
`;

        modal.style.pointerEvents =
            "auto";

        modal.addEventListener(

            "click",

            () => {

                modal.innerHTML =
                    "";

                modal.style.pointerEvents =
                    "none";

            },

            {
                once: true
            }
        );
    }

    applySeo(article) {

        template.updateTitle(
            article.title
        );

        template.renderMeta({

            "og:title":
                article.title,

            "og:description":
                article.description ??
                "",

            "twitter:title":
                article.title,

            "twitter:description":
                article.description ??
                ""
        });

        template.updateCanonical(
            location.href
        );

        template.renderStructuredData({

            "@context":
                "https://schema.org",

            "@type":
                "Article",

            headline:
                article.title,

            description:
                article.description ??
                "",

            url:
                location.href
        });
    }

    async cacheArticle(
        article
    ) {

        try {

            if (
                !("caches" in window)
            ) {

                return;
            }

            const cache =
                await caches.open(
                    "aoi-articles"
                );

            await cache.put(

                location.pathname,

                new Response(
                    JSON.stringify(
                        article
                    )
                )
            );

        } catch {}
    }

    renderError(
        message
    ) {

        this.root.innerHTML =
            template.renderError(
                "Article Error",
                message
            );
    }

    destroy() {

        this.destroyReadingProgress();

        toc.destroy();
    }
}

export const articleRenderer =
    new ArticleRenderer();

export default ArticleRenderer; 
