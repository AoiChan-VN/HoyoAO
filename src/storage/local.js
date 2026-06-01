export class Storage {

    constructor(
        namespace = "aoi"
    ) {

        this.namespace =
            namespace;

        this.listeners =
            new Set();

        this.boundStorageEvent =
            this.handleStorageEvent
                .bind(this);

        window.addEventListener(

            "storage",

            this.boundStorageEvent
        );
    }

    createKey(
        key
    ) {

        return `${this.namespace}:${key}`;
    }

    serialize(
        value,
        ttl = null
    ) {

        return JSON.stringify({

            value,

            ttl,

            createdAt:
                Date.now()
        });
    }

    deserialize(
        value
    ) {

        if (
            value === null
        ) {

            return null;
        }

        try {

            return JSON.parse(
                value
            );

        } catch {

            return null;
        }
    }

    isExpired(
        payload
    ) {

        if (
            !payload ||
            payload.ttl === null
        ) {

            return false;
        }

        return (

            Date.now() >

            payload.createdAt +
            payload.ttl
        );
    }

    set(
        key,
        value,
        ttl = null
    ) {

        try {

            localStorage.setItem(

                this.createKey(
                    key
                ),

                this.serialize(
                    value,
                    ttl
                )
            );

            return true;

        } catch (
            error
        ) {

            console.error(
                "[Storage]",
                error
            );

            return false;
        }
    }

    get(
        key,
        fallback = null
    ) {

        const payload =
            this.deserialize(

                localStorage.getItem(

                    this.createKey(
                        key
                    )
                )
            );

        if (
            !payload
        ) {

            return fallback;
        }

        if (
            this.isExpired(
                payload
            )
        ) {

            this.remove(
                key
            );

            return fallback;
        }

        return payload.value;
    }

    remove(
        key
    ) {

        localStorage.removeItem(

            this.createKey(
                key
            )
        );
    }

    has(
        key
    ) {

        return (
            this.get(
                key
            ) !== null
        );
    }

    clear() {

        const prefix =
            `${this.namespace}:`;

        const keys = [];

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(
                    i
                );

            if (
                key?.startsWith(
                    prefix
                )
            ) {

                keys.push(
                    key
                );
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

    sessionSet(
        key,
        value
    ) {

        try {

            sessionStorage.setItem(

                this.createKey(
                    key
                ),

                JSON.stringify(
                    value
                )
            );

            return true;

        } catch {

            return false;
        }
    }

    sessionGet(
        key,
        fallback = null
    ) {

        try {

            const value =
                sessionStorage.getItem(

                    this.createKey(
                        key
                    )
                );

            if (
                value === null
            ) {

                return fallback;
            }

            return JSON.parse(
                value
            );

        } catch {

            return fallback;
        }
    }

    sessionRemove(
        key
    ) {

        sessionStorage.removeItem(

            this.createKey(
                key
            )
        );
    }

    keys() {

        const prefix =
            `${this.namespace}:`;

        const result = [];

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(
                    i
                );

            if (
                key?.startsWith(
                    prefix
                )
            ) {

                result.push(

                    key.replace(
                        prefix,
                        ""
                    )
                );
            }
        }

        return result;
    }

    size() {

        return this.keys()
            .length;
    }

    subscribe(
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {

            return () => {};
        }

        this.listeners.add(
            callback
        );

        return () => {

            this.listeners.delete(
                callback
            );
        };
    }

    handleStorageEvent(
        event
    ) {

        if (
            !event.key
        ) {

            return;
        }

        const prefix =
            `${this.namespace}:`;

        if (
            !event.key.startsWith(
                prefix
            )
        ) {

            return;
        }

        const key =
            event.key.replace(
                prefix,
                ""
            );

        for (
            const listener
            of this.listeners
        ) {

            try {

                listener({

                    key,

                    oldValue:
                        this.deserialize(
                            event.oldValue
                        ),

                    newValue:
                        this.deserialize(
                            event.newValue
                        )
                });

            } catch (
                error
            ) {

                console.error(
                    error
                );
            }
        }
    }

    remember(
        key,
        producer,
        ttl = 60000
    ) {

        const cached =
            this.get(
                key
            );

        if (
            cached !== null
        ) {

            return cached;
        }

        const value =
            producer();

        this.set(
            key,
            value,
            ttl
        );

        return value;
    }

    statistics() {

        return {

            namespace:
                this.namespace,

            entries:
                this.size(),

            keys:
                this.keys()
        };
    }

    destroy() {

        window.removeEventListener(

            "storage",

            this.boundStorageEvent
        );

        this.listeners.clear();
    }
}

export const storage =
    new Storage();

export default Storage; 
