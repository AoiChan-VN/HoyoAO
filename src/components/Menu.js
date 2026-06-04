import { BaseComponent } from './BaseComponent.js';

export class Menu extends BaseComponent {
    constructor(container, store, eventBus) {
        super(container, store, eventBus);
    }

    shouldUpdate(currentState, prevState) {
        return currentState.currentRoute !== prevState.currentRoute ||
               currentState.menuItems !== prevState.menuItems ||
               currentState.isSettingsOpen !== prevState.isSettingsOpen;
    }

    render() {
        if (!this.element) {
            this.element = document.createElement('nav');
            this.element.className = 'app-menu interactive-element';
            this.container.appendChild(this.element);
        }

        const { menuItems, currentRoute, isSettingsOpen } = this.store.state;

        this.element.innerHTML = menuItems.map(item => {
            const isActive = (item.id === 'settings' && isSettingsOpen) || 
                             (item.id !== 'settings' && !isSettingsOpen && currentRoute === item.id);
            
            return `
                <button class="menu-item ${isActive ? 'active' : ''}" data-id="${item.id}" title="${item.label}">
                    <svg viewBox="0 0 24 24">
                        <path d="${item.icon}"/>
                    </svg>
                </button>
            `;
        }).join('');

        this.setupEventListeners();
    }

    setupEventListeners() {
        const buttons = this.element.querySelectorAll('.menu-item');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const routeId = e.currentTarget.getAttribute('data-id');
                
                if (routeId === 'settings') {
                    const currentSettingsState = this.store.state.isSettingsOpen;
                    this.eventBus.emit('UI_TOGGLE_SETTINGS_PANEL', !currentSettingsState);
                } else {
                    if (this.store.state.isSettingsOpen) {
                        this.eventBus.emit('UI_TOGGLE_SETTINGS_PANEL', false);
                    }
                    window.location.hash = `#${routeId}`;
                }
            });
        });
    }
}
 
