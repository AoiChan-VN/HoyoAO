import globalEventBus from '../core/event-bus.js';
import globalStore from '../core/store.js';

export class BaseComponent {
  constructor(elementId) {
    this.elementId = elementId;
    this.element = document.getElementById(elementId);
    this.store = globalStore;
    this.eventBus = globalEventBus;
    this.unsubs = [];
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.element) return;
    this.element.innerHTML = this.template();
  }

  template() {
    return ``;
  }

  bindEvents() {}

  trackEvent(event, callback) {
    const unsub = this.eventBus.on(event, callback);
    this.unsubs.push(unsub);
  }

  destroy() {
    const len = this.unsubs.length;
    for (let i = 0; i < len; i++) {
      this.unsubs[i]();
    }
    this.unsubs = [];
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}
 
