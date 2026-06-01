export class IndexedDBDriver {

    constructor() {

        this.db = null;

    }

    async connect() {

        return new Promise((resolve, reject) => {

            const request =
                indexedDB.open("AAoiDB", 1);

            request.onupgradeneeded = () => {

                request.result.createObjectStore(
                    "settings"
                );

            };

            request.onsuccess = () => {

                this.db = request.result;

                resolve();

            };

            request.onerror = reject;

        });

    }

} 
