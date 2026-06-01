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
/**
 * Aoi Route Registry
 * Production Ready
 */

import { router } from "./router.js";

import {
    articleRenderer
} from "../renderer/article.js";

import {
    pageRenderer
} from "../renderer/page.js";

import {
    template
} from "../renderer/template.js";

import {
    searchUI
} from "../search/ui.js";

export async function
registerRoutes() {

    router.add(

        "/",

        async () => {

            const response =
                await fetch(
                    "/cache/home.json"
                );

            const data =
                await response.json();

            renderHome(
                data
            );
        }
    );

    router.add(

        "/article/:slug",

        async context => {

            const article =
                await articleRenderer
                    .loadArticle(
                        context.params
                            .slug
                    );

            await articleRenderer
                .render(
                    article
                );
        }
    );

    router.add(

        "/page/:slug",

        async context => {

            const page =
                await pageRenderer
                    .loadPage(
                        context.params
                            .slug
                    );

            await pageRenderer
                .render(
                    page
                );
        }
    );

    router.add(

        "/search",

        async () => {

            const root =
                document
                    .getElementById(
                        "view"
                    );

            root.innerHTML = `

<section
class="search-page">

<header>

<h1>
Search
</h1>

</header>

<div
id="search-overlay">

<input
id="search-input"
type="search"
placeholder="Search">

<div
id="search-suggestions">
</div>

<div
id="search-results">
</div>

</div>

</section>
`;

            searchUI.initialize();
        }
    );

    router.add(

        "/settings",

        async () => {

            const root =
                document
                    .getElementById(
                        "view"
                    );

            root.innerHTML = `

<section
class="settings-page">

<h1>
Settings
</h1>

<div
id="settings-root">
</div>

</section>
`;
        }
    );

    router.add(

        "/about",

        async () => {

            const root =
                document
                    .getElementById(
                        "view"
                    );

            root.innerHTML = `

<section
class="about-page">

<h1>
About
</h1>

<p>
Aoi-Web
</p>

</section>
`;
        }
    );

    router.notFound(

        () => {

            const root =
                document
                    .getElementById(
                        "view"
                    );

            root.innerHTML =
                template.renderError(

                    "404",

                    "Page Not Found"
                );
        }
    );
}

function renderHome(
    data = {}
) {

    const root =
        document.getElementById(
            "view"
        );

    const articles =
        (
            data.articles ||
            []
        )

        .map(article => {

            return `

<article
class="article-card">

<h2>

<a href="/article/${article.slug}">

${escapeHtml(
    article.title
)}

</a>

</h2>

<p>

${escapeHtml(
    article.description ||
    ""
)}

</p>

</article>
`;
        })

        .join("");

    root.innerHTML = `

<section
class="home-page">

<header>

<h1>

${escapeHtml(
    data.title ||
    "Home"
)}

</h1>

</header>

<div
class="article-grid">

${articles}

</div>

</section>
`;
}

function escapeHtml(
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

export default
registerRoutes;
