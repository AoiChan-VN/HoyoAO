import { bus } from '../core/event-bus.js';

export class BaseElement extends HTMLElement {
    constructor() {
        super();
        this.stateListeners = [];
    }
    connectedCallback() {
        this.render();
        this.bindEvents();
    }
    disconnectedCallback() {
        // Tự động giải phóng bộ nhớ (Garbage Collection)
        this.stateListeners.forEach(({ ev, cb }) => bus.listeners[ev]?.splice(bus.listeners[ev].indexOf(cb), 1));
    }
    watchState(key, callback) {
        bus.on(`state:${key}`, callback);
        this.stateListeners.push({ ev: `state:${key}`, cb: callback });
    }
    render() {}
    bindEvents() {}
}
 
