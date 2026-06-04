export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const eventCallbacks = this.listeners.get(event);
        const index = eventCallbacks.indexOf(callback);
        if (index !== -1) {
            eventCallbacks.splice(index, 1);
        }
        if (eventCallbacks.length === 0) {
            this.listeners.delete(event);
        }
    }

    emit(event, data = null) {
        if (!this.listeners.has(event)) return;
        const eventCallbacks = [...this.listeners.get(event)];
        for (const callback of eventCallbacks) {
            try {
                callback(data);
            } catch (error) {
                console.error(error);
            }
        }
    }

    once(event, callback) {
        const onceWrapper = (data) => {
            this.off(event, onceWrapper);
            callback(data);
        };
        this.on(event, onceWrapper);
    }

    clear() {
        this.listeners.clear();
    }
}
 
