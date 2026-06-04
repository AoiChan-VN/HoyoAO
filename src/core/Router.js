export class Router {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;
    }

    initialize() {
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
    }

    handleRouting() {
        const hash = window.location.hash.replace('#', '') || 'home';
        const validRoutes = this.store.state.menuItems.map(item => item.id);
        const targetRoute = validRoutes.includes(hash) ? hash : 'home';

        if (targetRoute === 'settings') {
            this.eventBus.emit('UI_TOGGLE_SETTINGS_PANEL', true);
            window.location.hash = this.store.state.currentRoute;
            return;
        }

        this.store.setState({ currentRoute: targetRoute });
        this.eventBus.emit('ROUTER_CHANGED', targetRoute);
    }

    navigate(routeId) {
        window.location.hash = `#${routeId}`;
    }
}
 
