export class Storage {
    constructor(dbName, version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('cache_posts')) {
                    db.createObjectStore('cache_posts', { keyPath: 'id' });
                }
            };
        });
    }

    setPost(id, content) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache_posts'], 'readwrite');
            const store = transaction.objectStore('cache_posts');
            const request = store.put({ id, content, updatedAt: Date.now() });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    getPost(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache_posts'], 'readonly');
            const store = transaction.objectStore('cache_posts');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => reject(request.error);
        });
    }

    clearCache() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache_posts'], 'readwrite');
            const store = transaction.objectStore('cache_posts');
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}
 
