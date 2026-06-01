import { markdown } from "../parser/markdown.js";
import { toc } from "../parser/toc.js";
import { template } from "./template.js";

export class PageRenderer {

    constructor() {

        this.root =
            document.getElementById(
                "view"
            );
    }

    async render(page) {

        if (!page) {

            this.renderError(
                "Page not found"
            );

            return;
        }

        const html =
            markdown.parse(
                page.content
            );

        const tocItems =
            markdown.getTOC();

        const layout =
            template.createPageLayout({

                title:
                    page.title,

                content:
                    html
            });

        this.root.innerHTML =
            layout;

        if (
            tocItems.length
        ) {

            toc.initialize(
                tocItems
            );
        }

        this.setupAnchors();

        this.setupImageZoom();

        this.applySeo(page);

        this.cachePage(page);
    }

    async loadPage(slug) {

        const response =
            await fetch(
                `/content/pages/${slug}.md`,
                {
                    cache:
                        "no-cache"
                }
            );

        if (
            !response.ok
        ) {

            throw new Error(
                "Page Load Failed"
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
                    `/cache/page-meta/${slug}.json`,
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

            return await response.json();

        } catch {

            return {};
        }
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

                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    `#${anchor}`;

                link.className =
                    "anchor-link";

                link.setAttribute(
                    "aria-label",
                    "Anchor Link"
                );

                link.textContent =
                    "#";

                node.appendChild(
                    link
                );
            });
    }

    setupImageZoom() {

        document
            .querySelectorAll(
                ".page-content img"
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

    applySeo(page) {

        template.updateTitle(
            page.title
        );

        template.renderMeta({

            "og:title":
                page.title,

            "og:description":
                page.description ??
                "",

            "twitter:title":
                page.title,

            "twitter:description":
                page.description ??
                ""
        });

        template.updateCanonical(
            location.href
        );

        template.renderStructuredData({

            "@context":
                "https://schema.org",

            "@type":
                "WebPage",

            name:
                page.title,

            description:
                page.description ??
                "",

            url:
                location.href
        });
    }

    async cachePage(
        page
    ) {

        try {

            if (
                !("caches" in window)
            ) {

                return;
            }

            const cache =
                await caches.open(
                    "aoi-pages"
                );

            await cache.put(

                location.pathname,

                new Response(
                    JSON.stringify(
                        page
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

                "Page Error",

                message
            );
    }

    destroy() {

        toc.destroy();
    }
}

export const pageRenderer =
    new PageRenderer();

export default PageRenderer; 
