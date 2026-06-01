export class ModuleRegistry {

    #modules = new Map();

    register(name, instance) {

        if (this.#modules.has(name)) {

            throw new Error(
                `Module already registered: ${name}`
            );

        }

        this.#modules.set(name, instance);

    }

    get(name) {

        return this.#modules.get(name);

    }

    has(name) {

        return this.#modules.has(name);

    }

    remove(name) {

        this.#modules.delete(name);

    }

    getAll() {

        return [...this.#modules.entries()];

    }

} 
