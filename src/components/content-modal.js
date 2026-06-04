import { BaseComponent } from './base-component.js';
import { SafeMarkdownParser } from '../parser/markdown-parser.js';

export class ContentModal extends BaseComponent {
  constructor(elementId) {
    super(elementId);
    this.trackEvent('router:change', (route) => this.handleNavigation(route));
  }

  template() {
    return `
      <div class="glass-panel modal-overlay hidden" id="modal-container">
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="modal-title"></h2>
            <button class="interactive modal-close-btn" id="modal-close">✕</button>
          </div>
          <div class="modal-body scrollbar-custom" id="modal-body-content"></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    this.element.addEventListener('click', (e) => {
      if (e.target.id === 'modal-close' || e.target.id === 'modal-container') {
        window.location.hash = '';
      }
    });
  }

  handleNavigation(route) {
    const container = document.getElementById('modal-container');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-body-content');

    if (!container || !titleEl || !contentEl) return;

    if (route.path === 'item' && route.query.id) {
      const state = this.store.getState();
      const items = state.portfolio?.items || [];
      
      let selectedItem = null;
      const len = items.length;
      for (let i = 0; i < len; i++) {
        if (items[i].id === route.query.id) {
          selectedItem = items[i];
          break;
        }
      }

      if (selectedItem) {
        titleEl.textContent = selectedItem.title;
        contentEl.innerHTML = SafeMarkdownParser.parse(selectedItem.content);
        container.classList.remove('hidden');
        this.element.classList.remove('hidden');
        return;
      }
    }

    container.classList.add('hidden');
    this.element.classList.add('hidden');
    titleEl.textContent = '';
    contentEl.innerHTML = '';
  }
}
 
