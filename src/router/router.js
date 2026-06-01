export class Router {

    constructor() {

        this.routes = [];

        this.currentRoute = null;

        this.root =
            document.getElementById(
                "view"
            );

        this.beforeHooks = [];

        this.afterHooks = [];

        this.notFoundHandler =
            null;

        this.abortController =
            new AbortController();
    }

    async initialize() {

        this.attachListeners();

        await this.resolve(
            location.pathname,
            {
                replace: true
            }
        );
    }

    attachListeners() {

        window.addEventListener(
            "popstate",
            () => {

                this.resolve(
                    location.pathname,
                    {
                        replace: true
                    }
                );
            },
            {
                passive: true
            }
        );

        document.addEventListener(
            "click",
            event => {

                const anchor =
                    event.target.closest(
                        "a[href]"
                    );

                if (!anchor) {
                    return;
                }

                const href =
                    anchor.getAttribute(
                        "href"
                    );

                if (!href) {
                    return;
                }

                if (
                    href.startsWith(
                        "http"
                    )
                ) {

                    return;
                }

                if (
                    href.startsWith(
                        "#"
                    )
                ) {

                    return;
                }

                event.preventDefault();

                this.navigate(href);

            },
            {
                passive: false
            }
        );
    }

    register(
        pattern,
        handler,
        options = {}
    ) {

        this.routes.push({

            pattern,

            handler,

            options,

            compiled:
                this.compile(
                    pattern
                )
        });
    }

    compile(pattern) {

        const keys = [];

        const regex =
            pattern
                .replace(
                    /\/:([^/]+)/g,
                    (_, key) => {

                        keys.push(key);

                        return "/([^/]+)";
                    }
                );

        return {

            regex:
                new RegExp(
                    `^${regex}$`
                ),

            keys
        };
    }

    match(pathname) {

        for (
            const route
            of this.routes
        ) {

            const result =
                pathname.match(
                    route.compiled.regex
                );

            if (!result) {
                continue;
            }

            const params = {};

            route.compiled.keys.forEach(
                (
                    key,
                    index
                ) => {

                    params[key] =
                        decodeURIComponent(
                            result[
                                index + 1
                            ]
                        );
                }
            );

            return {

                route,

                params
            };
        }

        return null;
    }

    async navigate(
        path,
        options = {}
    ) {

        const replace =
            options.replace ??
            false;

        if (replace) {

            history.replaceState(
                {},
                "",
                path
            );

        } else {

            history.pushState(
                {},
                "",
                path
            );
        }

        await this.resolve(
            path,
            options
        );
    }

    async resolve(
        path,
        options = {}
    ) {

        try {

            const match =
                this.match(path);

            if (!match) {

                return this.render404();
            }

            const context = {

                path,

                params:
                    match.params,

                route:
                    match.route,

                metadata: {}
            };

            for (
                const hook
                of this.beforeHooks
            ) {

                const allowed =
                    await hook(
                        context
                    );

                if (
                    allowed === false
                ) {

                    return;
                }
            }

            const result =
                await match.route.handler(
                    context
                );

            this.currentRoute =
                context;

            if (
                result?.html
            ) {

                this.render(
                    result.html
                );
            }

            if (
                result?.title
            ) {

                this.updateTitle(
                    result.title
                );
            }

            if (
                result?.meta
            ) {

                this.updateMeta(
                    result.meta
                );
            }

            if (
                options.scroll !== false
            ) {

                this.restoreScroll();
            }

            for (
                const hook
                of this.afterHooks
            ) {

                await hook(
                    context,
                    result
                );
            }

        } catch (error) {

            console.error(
                "[Router]",
                error
            );

            this.renderError(
                error
            );
        }
    }

    render(html) {

        if (
            !this.root
        ) {
            return;
        }

        this.root.innerHTML =
            html;

        this.root.focus?.();
    }

    render404() {

        if (
            this.notFoundHandler
        ) {

            return this.notFoundHandler();
        }

        this.render(`
            <section class="not-found">
                <h1>404</h1>
                <p>Page not found.</p>
            </section>
        `);

        document.title =
            "404";
    }

    renderError(error) {

        this.render(`
            <section class="route-error">
                <h1>Error</h1>
                <p>
                    ${
                        error?.message ??
                        "Unknown Error"
                    }
                </p>
            </section>
        `);
    }

    updateTitle(title) {

        document.title =
            title;
    }

    updateMeta(meta) {

        Object.entries(meta)
            .forEach(
                (
                    [name, value]
                ) => {

                    const element =
                        document.querySelector(
                            `[data-dynamic-meta="${name}"]`
                        );

                    if (
                        element
                    ) {

                        element.setAttribute(
                            "content",
                            value
                        );
                    }
                }
            );
    }

    restoreScroll() {

        requestAnimationFrame(
            () => {

                window.scrollTo({

                    top: 0,

                    left: 0,

                    behavior:
                        "instant"
                });
            }
        );
    }

    beforeEach(fn) {

        this.beforeHooks.push(
            fn
        );
    }

    afterEach(fn) {

        this.afterHooks.push(
            fn
        );
    }

    setNotFound(fn) {

        this.notFoundHandler =
            fn;
    }

    prefetch(path) {

        const link =
            document.createElement(
                "link"
            );

        link.rel =
            "prefetch";

        link.href =
            path;

        document.head.appendChild(
            link
        );
    }

    getCurrentRoute() {

        return this.currentRoute;
    }

    isActive(path) {

        return (
            location.pathname ===
            path
        );
    }

    reload() {

        return this.resolve(
            location.pathname,
            {
                replace: true
            }
        );
    }

    destroy() {

        this.abortController.abort();

        this.routes.length = 0;

        this.beforeHooks.length = 0;

        this.afterHooks.length = 0;

        this.currentRoute = null;
    }
}

export default Router; 
