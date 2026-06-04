import { store } from './store.js';

export class HashRouter {
    constructor(routes) {
        this.routes = routes;
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('DOMContentLoaded', () => this.handleRoute());
    }
    handleRoute() {
        const hash = window.location.hash || '#/';
        store.set('currentRoute', hash);
        const route = this.routes[hash] || this.routes['#/404'];
        
        const container = document.getElementById('app-router-view');
        container.innerHTML = '';
        container.appendChild(route());
    }
}
 
