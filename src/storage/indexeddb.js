export class IndexedStorage {

    static DATABASE_NAME =
        "aoi_database";

    static DATABASE_VERSION =
        1;

    static STORES = {

        content: "content",

        search: "search",

        settings: "settings",

        locale: "locale",

        metadata: "metadata",

        cache: "cache"
    };

    constructor() {

        this.db = null;

        this.initialized = false;

        this.retryAttempts = 3;
    }

    async initialize() {

        if (this.initialized) {
            return;
        }

        this.db =
            await this.openDatabase();

        this.initialized = true;
    }

    openDatabase() {

        return new Promise(
            (resolve, reject) => {

                const request =
                    indexedDB.open(
                        IndexedStorage.DATABASE_NAME,
                        IndexedStorage.DATABASE_VERSION
                    );

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };

                request.onupgradeneeded =
                    event => {

                        const db =
                            event.target.result;

                        this.createSchema(
                            db
                        );
                    };

                request.onsuccess = () => {

                    const db =
                        request.result;

                    db.onerror =
                        error => {

                            console.error(
                                "[Aoi DB]",
                                error
                            );
                        };

                    resolve(db);
                };
            }
        );
    }

    createSchema(db) {

        Object.values(
            IndexedStorage.STORES
        ).forEach(store => {

            if (
                !db.objectStoreNames.contains(
                    store
                )
            ) {

                const objectStore =
                    db.createObjectStore(
                        store,
                        {
                            keyPath: "id"
                        }
                    );

                objectStore.createIndex(
                    "createdAt",
                    "createdAt",
                    {
                        unique: false
                    }
                );

                objectStore.createIndex(
                    "updatedAt",
                    "updatedAt",
                    {
                        unique: false
                    }
                );
            }
        });
    }

    async transaction(
        storeName,
        mode,
        callback
    ) {

        let lastError;

        for (
            let attempt = 1;
            attempt <= this.retryAttempts;
            attempt++
        ) {

            try {

                return await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        const tx =
                            this.db.transaction(
                                storeName,
                                mode
                            );

                        const store =
                            tx.objectStore(
                                storeName
                            );

                        const result =
                            callback(
                                store,
                                tx
                            );

                        tx.oncomplete =
                            () => {

                                resolve(
                                    result
                                );
                            };

                        tx.onerror =
                            () => {

                                reject(
                                    tx.error
                                );
                            };

                        tx.onabort =
                            () => {

                                reject(
                                    tx.error
                                );
                            };
                    }
                );

            } catch (error) {

                lastError = error;

                await this.delay(
                    attempt * 150
                );
            }
        }

        throw lastError;
    }

    delay(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }

    timestamp() {

        return Date.now();
    }

    async put(
        storeName,
        id,
        data
    ) {

        const payload = {

            id,

            createdAt:
                data.createdAt ??
                this.timestamp(),

            updatedAt:
                this.timestamp(),

            ...data
        };

        return this.transaction(
            storeName,
            "readwrite",
            store => {

                store.put(
                    payload
                );
            }
        );
    }

    async get(
        storeName,
        id
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const tx =
                    this.db.transaction(
                        storeName,
                        "readonly"
                    );

                const store =
                    tx.objectStore(
                        storeName
                    );

                const request =
                    store.get(id);

                request.onsuccess =
                    () =>
                        resolve(
                            request.result ||
                            null
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async delete(
        storeName,
        id
    ) {

        return this.transaction(
            storeName,
            "readwrite",
            store => {

                store.delete(id);
            }
        );
    }

    async clear(
        storeName
    ) {

        return this.transaction(
            storeName,
            "readwrite",
            store => {

                store.clear();
            }
        );
    }

    async exists(
        storeName,
        id
    ) {

        const result =
            await this.get(
                storeName,
                id
            );

        return result !== null;
    }

    async getAll(
        storeName
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const tx =
                    this.db.transaction(
                        storeName,
                        "readonly"
                    );

                const store =
                    tx.objectStore(
                        storeName
                    );

                const request =
                    store.getAll();

                request.onsuccess =
                    () =>
                        resolve(
                            request.result
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async count(
        storeName
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const tx =
                    this.db.transaction(
                        storeName,
                        "readonly"
                    );

                const store =
                    tx.objectStore(
                        storeName
                    );

                const request =
                    store.count();

                request.onsuccess =
                    () =>
                        resolve(
                            request.result
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async query(
        storeName,
        predicate
    ) {

        const items =
            await this.getAll(
                storeName
            );

        return items.filter(
            predicate
        );
    }

    async saveContent(
        id,
        content
    ) {

        return this.put(
            IndexedStorage.STORES.content,
            id,
            content
        );
    }

    async getContent(
        id
    ) {

        return this.get(
            IndexedStorage.STORES.content,
            id
        );
    }

    async saveSearchIndex(
        id,
        index
    ) {

        return this.put(
            IndexedStorage.STORES.search,
            id,
            index
        );
    }

    async saveLocale(
        language,
        data
    ) {

        return this.put(
            IndexedStorage.STORES.locale,
            language,
            data
        );
    }

    async saveMetadata(
        key,
        value
    ) {

        return this.put(
            IndexedStorage.STORES.metadata,
            key,
            value
        );
    }

    async saveCache(
        key,
        value
    ) {

        return this.put(
            IndexedStorage.STORES.cache,
            key,
            value
        );
    }

    async cleanup(
        maxAge
    ) {

        const cutoff =
            this.timestamp() -
            maxAge;

        for (
            const storeName
            of Object.values(
                IndexedStorage.STORES
            )
        ) {

            const entries =
                await this.getAll(
                    storeName
                );

            for (
                const item
                of entries
            ) {

                if (
                    item.updatedAt &&
                    item.updatedAt <
                    cutoff
                ) {

                    await this.delete(
                        storeName,
                        item.id
                    );
                }
            }
        }
    }

    async healthCheck() {

        try {

            const testKey =
                "__healthcheck__";

            await this.put(
                IndexedStorage.STORES.metadata,
                testKey,
                {
                    value: true
                }
            );

            const result =
                await this.get(
                    IndexedStorage.STORES.metadata,
                    testKey
                );

            await this.delete(
                IndexedStorage.STORES.metadata,
                testKey
            );

            return Boolean(
                result
            );

        } catch {

            return false;
        }
    }

    async destroy() {

        if (
            this.db
        ) {

            this.db.close();
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const request =
                    indexedDB.deleteDatabase(
                        IndexedStorage.DATABASE_NAME
                    );

                request.onsuccess =
                    () =>
                        resolve(true);

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }
}

export default IndexedStorage; 
