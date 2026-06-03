export class Store {

    #state;

    #listeners = new Set();

    constructor(initialState) {

        this.#state =
            structuredClone(initialState);

    }

    getState() {

        return structuredClone(
            this.#state
        );

    }

    setState(partial) {

        this.#state = {

            ...this.#state,
            ...partial

        };

        for (const listener of this.#listeners) {

            listener(
                this.getState()
            );

        }

    }

    subscribe(listener) {

        this.#listeners.add(listener);

        return () =>
            this.#listeners.delete(listener);

    }

} 
