export class State {

    constructor(initialState = {}) {

        this.store = {
            app: {
                ready: false,
                startedAt: null
            },

            router: {
                currentRoute: '#/dashboard',
                previousRoute: null
            },

            accessibility: {
                reducedMotion: false
            },

            camera: {
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },

                rotation: {
                    pitch: 0,
                    yaw: 0,
                    roll: 0
                }
            },

            world: {
                loaded: false,
                objectCount: 0
            },

            dashboard: {
                selectedPanel: null
            },

            content: {
                index: [],
                loaded: false
            },

            ...initialState
        };

        this.subscribers = new Map();

        this.globalSubscribers = new Set();
    }

    get(path = null) {

        if (
            path === null ||
            path === undefined ||
            path === ''
        ) {
            return this.clone(this.store);
        }

        const keys = path.split('.');

        let current = this.store;

        for (const key of keys) {

            if (
                current === null ||
                current === undefined
            ) {
                return undefined;
            }

            current = current[key];
        }

        return this.clone(current);
    }

    set(path, value) {

        if (
            typeof path !== 'string' ||
            path.length === 0
        ) {
            throw new Error(
                'State path must be a non-empty string.'
            );
        }

        const keys = path.split('.');

        const previousState =
            this.clone(this.store);

        let current = this.store;

        for (
            let i = 0;
            i < keys.length - 1;
            i++
        ) {

            const key = keys[i];

            if (
                typeof current[key] !== 'object' ||
                current[key] === null
            ) {

                current[key] = {};
            }

            current = current[key];
        }

        const finalKey =
            keys[keys.length - 1];

        current[finalKey] =
            this.clone(value);

        const nextState =
            this.clone(this.store);

        this.notifyPath(
            path,
            this.get(path)
        );

        this.notifyGlobal(
            previousState,
            nextState
        );
    }

    update(path, updater) {

        if (
            typeof updater !== 'function'
        ) {
            throw new TypeError(
                'Updater must be a function.'
            );
        }

        const current =
            this.get(path);

        const next =
            updater(current);

        this.set(
            path,
            next
        );
    }

    remove(path) {

        if (
            typeof path !== 'string'
        ) {
            return;
        }

        const keys = path.split('.');

        let current =
            this.store;

        for (
            let i = 0;
            i < keys.length - 1;
            i++
        ) {

            current =
                current?.[keys[i]];

            if (!current) {
                return;
            }
        }

        delete current[
            keys[keys.length - 1]
        ];

        this.notifyPath(
            path,
            undefined
        );
    }

    subscribe(path, callback) {

        if (
            typeof callback !== 'function'
        ) {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        if (
            !this.subscribers.has(path)
        ) {

            this.subscribers.set(
                path,
                new Set()
            );
        }

        const listeners =
            this.subscribers.get(path);

        listeners.add(callback);

        return () => {

            listeners.delete(
                callback
            );

            if (
                listeners.size === 0
            ) {

                this.subscribers.delete(
                    path
                );
            }
        };
    }

    subscribeAll(callback) {

        if (
            typeof callback !== 'function'
        ) {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        this.globalSubscribers.add(
            callback
        );

        return () => {

            this.globalSubscribers.delete(
                callback
            );
        };
    }

    notifyPath(path, value) {

        const listeners =
            this.subscribers.get(path);

        if (!listeners) {
            return;
        }

        for (const listener of listeners) {

            try {

                listener(
                    this.clone(value)
                );

            } catch (error) {

                console.error(
                    `[State] Path Subscriber Error (${path})`,
                    error
                );
            }
        }
    }

    notifyGlobal(
        previousState,
        nextState
    ) {

        for (
            const listener
            of this.globalSubscribers
        ) {

            try {

                listener(
                    previousState,
                    nextState
                );

            } catch (error) {

                console.error(
                    '[State] Global Subscriber Error',
                    error
                );
            }
        }
    }

    merge(partialState) {

        if (
            typeof partialState !== 'object' ||
            partialState === null
        ) {
            return;
        }

        const previousState =
            this.clone(this.store);

        this.deepMerge(
            this.store,
            partialState
        );

        const nextState =
            this.clone(this.store);

        this.notifyGlobal(
            previousState,
            nextState
        );
    }

    reset() {

        this.store = {};

        this.subscribers.clear();

        this.globalSubscribers.clear();
    }

    clone(value) {

        if (
            value === undefined
        ) {
            return undefined;
        }

        return structuredClone(
            value
        );
    }

    deepMerge(
        target,
        source
    ) {

        for (
            const key
            of Object.keys(source)
        ) {

            const sourceValue =
                source[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue)
            ) {

                if (
                    !target[key] ||
                    typeof target[key] !== 'object'
                ) {

                    target[key] = {};
                }

                this.deepMerge(
                    target[key],
                    sourceValue
                );

            } else {

                target[key] =
                    this.clone(sourceValue);
            }
        }
    }

    snapshot() {

        return this.clone(
            this.store
        );
    }

    restore(snapshot) {

        if (
            typeof snapshot !== 'object' ||
            snapshot === null
        ) {
            throw new Error(
                'Invalid snapshot.'
            );
        }

        const previousState =
            this.clone(this.store);

        this.store =
            this.clone(snapshot);

        const nextState =
            this.clone(this.store);

        this.notifyGlobal(
            previousState,
            nextState
        );
    }

    destroy() {

        this.subscribers.clear();

        this.globalSubscribers.clear();

        this.store = {};
    }
} 
