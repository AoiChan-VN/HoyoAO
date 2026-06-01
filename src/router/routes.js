export class RouteRegistry {

    constructor(router) {

        this.router = router;

        this.contentIndex = [];

        this.pageIndex = [];
    }

    async initialize() {

        await this.loadIndexes();

        this.registerHomeRoute();

        this.registerArticleRoutes();

        this.registerPageRoutes();

        this.registerNotFoundRoute();
    }

    async loadIndexes() {

        const indexes = await Promise.all([

            fetch(
                "/cache/articles.index.json",
                {
                    cache: "no-cache"
                }
            ),

            fetch(
                "/cache/pages.index.json",
                {
                    cache: "no-cache"
                }
            )
        ]);

        const [
            articlesResponse,
            pagesResponse
        ] = indexes;

        this.contentIndex =
            articlesResponse.ok
                ? await articlesResponse.json()
                : [];

        this.pageIndex =
            pagesResponse.ok
                ? await pagesResponse.json()
                : [];
    }

    registerHomeRoute() {

        this.router.register(

            "/",

            async () => {

                return {

                    html: `
                        <section class="home-view">
                            <div id="home-container"></div>
                        </section>
                    `,

                    title:
                        await this.resolveSiteTitle(),

                    meta: {
                        "og:title":
                            await this.resolveSiteTitle(),

                        "og:url":
                            location.origin
                    }
                };
            }
        );
    }

    registerArticleRoutes() {

        this.router.register(

            "/article/:slug",

            async context => {

                const article =
                    this.contentIndex.find(
                        item =>
                            item.slug ===
                            context.params.slug
                    );

                if (!article) {

                    return this.notFound();
                }

                return {

                    html: `
                        <article
                            class="article-content"
                            data-slug="${this.escape(article.slug)}"
                        ></article>
                    `,

                    title:
                        article.title,

                    meta: {

                        "og:title":
                            article.title,

                        "og:description":
                            article.description ?? "",

                        "og:url":
                            `${location.origin}/article/${article.slug}`,

                        "twitter:title":
                            article.title,

                        "twitter:description":
                            article.description ?? ""
                    }
                };
            }
        );
    }

    registerPageRoutes() {

        this.router.register(

            "/page/:slug",

            async context => {

                const page =
                    this.pageIndex.find(
                        item =>
                            item.slug ===
                            context.params.slug
                    );

                if (!page) {

                    return this.notFound();
                }

                return {

                    html: `
                        <section
                            class="page-content"
                            data-slug="${this.escape(page.slug)}"
                        ></section>
                    `,

                    title:
                        page.title,

                    meta: {

                        "og:title":
                            page.title,

                        "og:description":
                            page.description ?? "",

                        "og:url":
                            `${location.origin}/page/${page.slug}`
                    }
                };
            }
        );
    }

    registerNotFoundRoute() {

        this.router.setNotFound(
            async () => {

                const response =
                    this.notFound();

                this.router.render(
                    response.html
                );

                document.title =
                    response.title;
            }
        );
    }

    notFound() {

        return {

            html: `
                <section
                    class="not-found-view"
                >
                    <h1>
                        404
                    </h1>

                    <p>
                        Resource not found.
                    </p>
                </section>
            `,

            title:
                "404 - Not Found",

            meta: {

                "og:title":
                    "404 - Not Found"
            }
        };
    }

    async resolveSiteTitle() {

        try {

            const response =
                await fetch(
                    "/data/settings/site.json",
                    {
                        cache: "no-cache"
                    }
                );

            if (!response.ok) {

                return "Website";
            }

            const settings =
                await response.json();

            return (
                settings.title ??
                "Website"
            );

        } catch {

            return "Website";
        }
    }

    generateSitemapEntries() {

        const entries = [];

        entries.push("/");

        for (
            const article
            of this.contentIndex
        ) {

            entries.push(
                `/article/${article.slug}`
            );
        }

        for (
            const page
            of this.pageIndex
        ) {

            entries.push(
                `/page/${page.slug}`
            );
        }

        return entries;
    }

    getArticles() {

        return [
            ...this.contentIndex
        ];
    }

    getPages() {

        return [
            ...this.pageIndex
        ];
    }

    escape(value = "") {

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
}

export default RouteRegistry; 
