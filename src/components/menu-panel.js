import { BaseComponent } from './base-component.js';

export class MenuPanel extends BaseComponent {
  constructor(elementId) {
    super(elementId);
    this.trackEvent('state:ui', (uiState) => this.updateVisibility(uiState));
  }

  template() {
    const state = this.store.getState();
    const items = state.portfolio?.items || [];
    
    let buttonsHtml = '';
    const len = items.length;
    for (let i = 0; i < len; i++) {
      const item = items[i];
      buttonsHtml += `
        <button class="interactive menu-btn" data-id="${item.id}">
          ${item.title}
        </button>
      `;
    }

    return `
      <div class="glass-panel menu-container">
        <div class="menu-brand">
          <img src="./assets/icons/app-icon.svg" class="menu-icon" alt="Logo" />
          <span class="menu-title">${state.portfolio?.profile?.name || 'Portfolio'}</span>
        </div>
        <nav class="menu-nav">
          <a href="#" class="interactive menu-btn active" data-route="">360° View</a>
          ${buttonsHtml}
        </nav>
        <button class="interactive settings-trigger-btn" id="menu-settings-toggle">
          ⚙️
        </button>
      </div>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    this.element.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.classList.contains('menu-btn') && target.hasAttribute('data-id')) {
        const id = target.getAttribute('data-id');
        window.location.hash = `item?id=${id}`;
        return;
      }

      if (target.hasAttribute('data-route')) {
        window.location.hash = '';
        return;
      }

      if (target.id === 'menu-settings-toggle' || target.closest('#menu-settings-toggle')) {
        const uiState = this.store.getState().uiState;
        this.store.setUiState('settingsVisible', !uiState.settingsVisible);
      }
    });
  }

  updateVisibility(uiState) {
    if (!this.element) return;
    if (uiState.menuVisible) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }
    
    const activeBtn = this.element.querySelector('.menu-btn.active');
    if (activeBtn) activeBtn.classList.remove('active');

    const hash = window.location.hash;
    if (!hash || hash === '#') {
      const homeBtn = this.element.querySelector('[data-route]');
      if (homeBtn) homeBtn.classList.add('active');
    } else if (hash.includes('id=')) {
      const id = new URLSearchParams(hash.split('?')[1]).get('id');
      const targetBtn = this.element.querySelector(`[data-id="${id}"]`);
      if (targetBtn) targetBtn.classList.add('active');
    }
  }
}
 
