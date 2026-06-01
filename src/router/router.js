export class Router {

    constructor() {

        this.routes = [];

        this.middlewares = [];

        this.notFoundHandler =
            null;

        this.currentRoute =
            null;

        this.scrollPositions =
            new Map();

        this.started =
            false;

        this.boundPopState =
            this.handlePopState
                .bind(this);
    }

    start() {

        if (
            this.started
        ) {

            return;
        }

        this.started = true;

        window.addEventListener(

            "popstate",

            this.boundPopState
        );

        this.resolve(
            location.pathname
        );
    }

    stop() {

        window.removeEventListener(

            "popstate",

            this.boundPopState
        );

        this.started = false;
    }

    add(
        path,
        handler,
        options = {}
    ) {

        this.routes.push({

            path,

            handler,

            lazy:
                options.lazy ??
                false,

            middleware:
                options.middleware ??
                []
        });

        return this;
    }

    use(
        middleware
    ) {

        if (
            typeof middleware ===
            "function"
        ) {

            this.middlewares.push(
                middleware
            );
        }

        return this;
    }

    notFound(
        handler
    ) {

        this.notFoundHandler =
            handler;

        return this;
    }

    async navigate(
        path,
        state = {}
    ) {

        this.saveScroll();

        history.pushState(

            state,

            "",

            path
        );

        await this.resolve(
            path
        );
    }

    async replace(
        path,
        state = {}
    ) {

        history.replaceState(

            state,

            "",

            path
        );

        await this.resolve(
            path
        );
    }

    async handlePopState() {

        await this.resolve(
            location.pathname
        );

        this.restoreScroll();
    }

    async resolve(
        path
    ) {

        const match =
            this.match(
                path
            );

        if (
            !match
        ) {

            return this.handle404(
                path
            );
        }

        const context = {

            path,

            params:
                match.params,

            route:
                match.route
        };

        const allowed =
            await this.runMiddlewares(
                context
            );

        if (
            !allowed
        ) {

            return;
        }

        this.currentRoute =
            context;

        document.dispatchEvent(

            new CustomEvent(

                "aoi:route-change",

                {
                    detail:
                        context
                }
            )
        );

        try {

            if (
                match.route.lazy
            ) {

                const module =
                    await match.route
                        .handler();

                if (
                    typeof module.default ===
                    "function"
                ) {

                    await module.default(
                        context
                    );
                }

            } else {

                await match.route
                    .handler(
                        context
                    );
            }

        } catch (
            error
        ) {

            console.error(
                "[Router]",
                error
            );

            this.handle404(
                path
            );
        }

        window.scrollTo(
            0,
            0
        );
    }

    match(
        path
    ) {

        for (
            const route
            of this.routes
        ) {

            const params =
                {};

            const pattern =
                route.path

                    .replace(
                        /\//g,
                        "\\/"
                    )

                    .replace(

                        /:([a-zA-Z0-9_]+)/g,

                        (
                            _,
                            key
                        ) => {

                            params[
                                key
                            ] = null;

                            return "([^\\/]+)";
                        }
                    );

            const regex =
                new RegExp(
                    `^${pattern}$`
                );

            const result =
                path.match(
                    regex
                );

            if (
                !result
            ) {

                continue;
            }

            let index = 1;

            const finalParams =
                {};

            for (
                const key
                of Object.keys(
                    params
                )
            ) {

                finalParams[
                    key
                ] =
                    decodeURIComponent(
                        result[
                            index++
                        ]
                    );
            }

            return {

                route,

                params:
                    finalParams
            };
        }

        return null;
    }

    async runMiddlewares(
        context
    ) {

        const stack = [

            ...this.middlewares,

            ...(
                context.route
                    .middleware ||
                []
            )
        ];

        for (
            const middleware
            of stack
        ) {

            const result =
                await middleware(
                    context
                );

            if (
                result === false
            ) {

                return false;
            }
        }

        return true;
    }

    handle404(
        path
    ) {

        document.dispatchEvent(

            new CustomEvent(

                "aoi:route-404",

                {

                    detail: {

                        path
                    }
                }
            )
        );

        if (
            this.notFoundHandler
        ) {

            return this
                .notFoundHandler(
                    path
                );
        }
    }

    saveScroll() {

        this.scrollPositions.set(

            location.pathname,

            {

                x:
                    window.scrollX,

                y:
                    window.scrollY
            }
        );
    }

    restoreScroll() {

        const position =
            this.scrollPositions.get(
                location.pathname
            );

        if (
            !position
        ) {

            return;
        }

        requestAnimationFrame(
            () => {

                window.scrollTo(

                    position.x,

                    position.y
                );
            }
        );
    }

    link(
        selector = "a"
    ) {

        document.addEventListener(

            "click",

            event => {

                const target =
                    event.target.closest(
                        selector
                    );

                if (
                    !target
                ) {

                    return;
                }

                const href =
                    target.getAttribute(
                        "href"
                    );

                if (
                    !href ||
                    href.startsWith(
                        "http"
                    ) ||
                    href.startsWith(
                        "#"
                    ) ||
                    target.target ===
                    "_blank"
                ) {

                    return;
                }

                event.preventDefault();

                this.navigate(
                    href
                );
            }
        );
    }

    current() {

        return this.currentRoute;
    }

    emit(
        event,
        detail = {}
    ) {

        document.dispatchEvent(

            new CustomEvent(

                event,

                {
                    detail
                }
            )
        );
    }

    destroy() {

        this.stop();

        this.routes = [];

        this.middlewares = [];

        this.scrollPositions
            .clear();

        this.currentRoute =
            null;
    }
}

export const router =
    new Router();

export default Router; 
