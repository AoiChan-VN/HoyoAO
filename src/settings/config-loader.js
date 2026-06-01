import { ConfigCache }
from "./config-cache.js";

export class ConfigLoader {

    constructor() {

        this.cache = new ConfigCache();

    }

    async load(url) {

        if (this.cache.has(url)) {

            return this.cache.get(url);

        }

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                `Config load failed: ${url}`
            );

        }

        const data = await response.json();

        this.cache.set(url, data);

        return data;

    }

} 
