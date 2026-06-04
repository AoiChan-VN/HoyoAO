export class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(nextState) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...nextState };
        this.notify(this.state, prevState);
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify(currentState, prevState) {
        for (const listener of this.listeners) {
            try {
                listener(currentState, prevState);
            } catch (error) {
                console.error(error);
            }
        }
    }
}
 
