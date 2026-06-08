export class Router {

    constructor({
        state,
        eventBus
    }) {

        if (!state) {
            throw new Error(
                'Router requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'Router requires eventBus.'
            );
        }

        this.state = state;
        this.eventBus = eventBus;

        this.routes = new Map();

        this.beforeHooks = [];

        this.afterHooks = [];

        this.currentRoute = null;

        this.boundHashChange =
            this.handleHashChange.bind(this);
    }

    initialize() {

        this.registerDefaultRoutes();

        window.addEventListener(
            'hashchange',
            this.boundHashChange,
            {
                passive: true
            }
        );

        if (
            !window.location.hash
        ) {

            window.location.hash =
                '#/dashboard';

            return;
        }

        this.resolve(
            window.location.hash
        );
    }

    registerDefaultRoutes() {

        this.addRoute(
            '#/dashboard',
            {
                name: 'dashboard'
            }
        );

        this.addRoute(
            '#/posts',
            {
                name: 'posts'
            }
        );

        this.addRoute(
            '#/viewer',
            {
                name: 'viewer'
            }
        );

        this.addRoute(
            '#/search',
            {
                name: 'search'
            }
        );

        this.addRoute(
            '#/settings',
            {
                name: 'settings'
            }
        );
    }

    addRoute(
        path,
        metadata = {}
    ) {

        if (
            typeof path !== 'string'
        ) {
            throw new TypeError(
                'Route path must be string.'
            );
        }

        this.routes.set(
            path,
            {
                path,
                ...metadata
            }
        );
    }

    removeRoute(path) {

        this.routes.delete(path);
    }

    hasRoute(path) {

        return this.routes.has(path);
    }

    navigate(path) {

        if (
            typeof path !== 'string'
        ) {
            return;
        }

        if (
            window.location.hash === path
        ) {

            this.resolve(path);

            return;
        }

        window.location.hash =
            path;
    }

    replace(path) {

        if (
            typeof path !== 'string'
        ) {
            return;
        }

        const url =
            `${window.location.pathname}${window.location.search}${path}`;

        window.history.replaceState(
            null,
            '',
            url
        );

        this.resolve(path);
    }

    handleHashChange() {

        this.resolve(
            window.location.hash
        );
    }

    async resolve(path) {

        const normalized =
            this.normalize(path);

        const route =
            this.routes.get(normalized);

        if (!route) {

            this.eventBus.emit(
                'router:not-found',
                {
                    path: normalized
                }
            );

            this.navigate(
                '#/dashboard'
            );

            return;
        }

        const previous =
            this.currentRoute;

        const context = {
            from: previous,
            to: route
        };

        const allowed =
            await this.executeBeforeHooks(
                context
            );

        if (!allowed) {
            return;
        }

        this.currentRoute =
            route;

        this.state.set(
            'router.previousRoute',
            previous
                ? previous.path
                : null
        );

        this.state.set(
            'router.currentRoute',
            route.path
        );

        this.eventBus.emit(
            'router:change',
            {
                previous,
                current: route
            }
        );

        this.eventBus.emit(
            `route:${route.name}`,
            route
        );

        await this.executeAfterHooks(
            context
        );
    }

    normalize(path) {

        if (
            !path ||
            typeof path !== 'string'
        ) {

            return '#/dashboard';
        }

        let normalized =
            path.trim();

        if (
            !normalized.startsWith('#/')
        ) {

            normalized =
                '#/' +
                normalized
                    .replace(/^#/, '')
                    .replace(/^\//, '');
        }

        return normalized;
    }

    beforeEach(callback) {

        if (
            typeof callback !== 'function'
        ) {

            throw new TypeError(
                'beforeEach callback must be function.'
            );
        }

        this.beforeHooks.push(
            callback
        );

        return () => {

            const index =
                this.beforeHooks.indexOf(
                    callback
                );

            if (
                index !== -1
            ) {

                this.beforeHooks.splice(
                    index,
                    1
                );
            }
        };
    }

    afterEach(callback) {

        if (
            typeof callback !== 'function'
        ) {

            throw new TypeError(
                'afterEach callback must be function.'
            );
        }

        this.afterHooks.push(
            callback
        );

        return () => {

            const index =
                this.afterHooks.indexOf(
                    callback
                );

            if (
                index !== -1
            ) {

                this.afterHooks.splice(
                    index,
                    1
                );
            }
        };
    }

    async executeBeforeHooks(
        context
    ) {

        for (
            const hook
            of this.beforeHooks
        ) {

            try {

                const result =
                    await hook(
                        context
                    );

                if (
                    result === false
                ) {

                    this.eventBus.emit(
                        'router:blocked',
                        context
                    );

                    return false;
                }

            } catch (error) {

                console.error(
                    '[Router] Before Hook Error',
                    error
                );

                return false;
            }
        }

        return true;
    }

    async executeAfterHooks(
        context
    ) {

        for (
            const hook
            of this.afterHooks
        ) {

            try {

                await hook(
                    context
                );

            } catch (error) {

                console.error(
                    '[Router] After Hook Error',
                    error
                );
            }
        }
    }

    getCurrentRoute() {

        return this.currentRoute;
    }

    getRoutes() {

        return Array.from(
            this.routes.values()
        );
    }

    destroy() {

        window.removeEventListener(
            'hashchange',
            this.boundHashChange
        );

        this.routes.clear();

        this.beforeHooks.length = 0;

        this.afterHooks.length = 0;

        this.currentRoute = null;
    }
} 
