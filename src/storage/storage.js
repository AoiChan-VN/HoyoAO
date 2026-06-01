import { LocalStorageDriver }
from "./local-storage.js";

import { IndexedDBDriver }
from "./indexed-db.js";

export class StorageManager {

    constructor() {

        this.local =
            new LocalStorageDriver();

        this.indexed =
            new IndexedDBDriver();

    }

} 
