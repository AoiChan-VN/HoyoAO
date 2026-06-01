export class Storage {

    static VERSION = 1;

    static PREFIX = "aoi";

    constructor() {

        this.available =
            this.checkAvailability();

        this.memoryFallback =
            new Map();
    }

    checkAvailability() {

        try {

            const key =
                "__aoi_test__";

            localStorage.setItem(
                key,
                key
            );

            localStorage.removeItem(
                key
            );

            return true;

        } catch {

            return false;
        }
    }

    createKey(key) {

        return [
            Storage.PREFIX,
            Storage.VERSION,
            key
        ].join(":");
    }

    now() {

        return Date.now();
    }

    serialize(payload) {

        return JSON.stringify(payload);
    }

    deserialize(payload) {

        try {

            return JSON.parse(payload);

        } catch {

            return null;
        }
    }

    writeRaw(key, value) {

        if (!this.available) {

            this.memoryFallback.set(
                key,
                value
            );

            return;
        }

        localStorage.setItem(
            key,
            value
        );
    }

    readRaw(key) {

        if (!this.available) {

            return (
                this.memoryFallback.get(
                    key
                ) ?? null
            );
        }

        return localStorage.getItem(
            key
        );
    }

    removeRaw(key) {

        if (!this.available) {

            this.memoryFallback.delete(
                key
            );

            return;
        }

        localStorage.removeItem(
            key
        );
    }

    set(
        key,
        value,
        options = {}
    ) {

        const namespacedKey =
            this.createKey(key);

        const payload = {

            version:
                Storage.VERSION,

            createdAt:
                this.now(),

            expiresAt:
                options.ttl
                    ? this.now() + options.ttl
                    : null,

            value
        };

        this.writeRaw(
            namespacedKey,
            this.serialize(payload)
        );

        return true;
    }

    get(
        key,
        fallback = null
    ) {

        const namespacedKey =
            this.createKey(key);

        const raw =
            this.readRaw(
                namespacedKey
            );

        if (!raw) {

            return fallback;
        }

        const payload =
            this.deserialize(raw);

        if (!payload) {

            this.remove(key);

            return fallback;
        }

        if (
            payload.expiresAt &&
            payload.expiresAt < this.now()
        ) {

            this.remove(key);

            return fallback;
        }

        return payload.value;
    }

    has(key) {

        return this.get(
            key,
            Symbol("missing")
        ) !== Symbol.for("missing");
    }

    remove(key) {

        const namespacedKey =
            this.createKey(key);

        this.removeRaw(
            namespacedKey
        );
    }

    clear() {

        if (!this.available) {

            this.memoryFallback.clear();

            return;
        }

        const keys = [];

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (
                key &&
                key.startsWith(
                    `${Storage.PREFIX}:`
                )
            ) {

                keys.push(key);
            }
        }

        for (
            const key
            of keys
        ) {

            localStorage.removeItem(
                key
            );
        }
    }

    keys() {

        const output = [];

        if (!this.available) {

            return [
                ...this.memoryFallback.keys()
            ];
        }

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (
                key &&
                key.startsWith(
                    `${Storage.PREFIX}:`
                )
            ) {

                output.push(key);
            }
        }

        return output;
    }

    entries() {

        const entries = [];

        for (
            const key
            of this.keys()
        ) {

            entries.push([
                key,
                this.readRaw(key)
            ]);
        }

        return entries;
    }

    pruneExpired() {

        const now =
            this.now();

        for (
            const key
            of this.keys()
        ) {

            const raw =
                this.readRaw(key);

            const payload =
                this.deserialize(raw);

            if (
                !payload
            ) {

                this.removeRaw(key);

                continue;
            }

            if (
                payload.expiresAt &&
                payload.expiresAt < now
            ) {

                this.removeRaw(key);
            }
        }
    }

    increment(
        key,
        amount = 1
    ) {

        const current =
            Number(
                this.get(
                    key,
                    0
                )
            );

        const next =
            current + amount;

        this.set(
            key,
            next
        );

        return next;
    }

    decrement(
        key,
        amount = 1
    ) {

        return this.increment(
            key,
            -amount
        );
    }

    push(
        key,
        value
    ) {

        const current =
            this.get(
                key,
                []
            );

        if (
            !Array.isArray(
                current
            )
        ) {

            throw new TypeError(
                `${key} is not an array`
            );
        }

        current.push(value);

        this.set(
            key,
            current
        );

        return current;
    }

    touch(
        key,
        ttl
    ) {

        const value =
            this.get(key);

        if (
            value === null
        ) {

            return false;
        }

        this.set(
            key,
            value,
            {
                ttl
            }
        );

        return true;
    }

    export() {

        const output = {};

        for (
            const [key, value]
            of this.entries()
        ) {

            output[key] = value;
        }

        return output;
    }

    import(data = {}) {

        for (
            const [
                key,
                value
            ]
            of Object.entries(data)
        ) {

            this.writeRaw(
                key,
                value
            );
        }
    }
}

export default Storage; 
