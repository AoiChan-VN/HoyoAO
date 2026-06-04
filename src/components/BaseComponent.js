export class BaseComponent {
    constructor(container, store, eventBus) {
        if (this.constructor === BaseComponent) {
            throw new TypeError('Cannot instantiate abstract BaseComponent class directly.');
        }
        this.container = container;
        this.store = store;
        this.eventBus = eventBus;
        this.element = null;
        this.unsubscribeStore = null;

        this.bindStore();
    }

    bindStore() {
        this.unsubscribeStore = this.store.subscribe((currentState, prevState) => {
            if (this.shouldUpdate(currentState, prevState)) {
                this.render();
            }
        });
    }

    shouldUpdate(currentState, prevState) {
        return true;
    }

    render() {
        throw new Error('Method [render()] must be implemented by subclasses.');
    }

    destroy() {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
 
