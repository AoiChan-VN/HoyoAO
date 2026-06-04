import { App } from './core/App.js';

document.addEventListener('DOMContentLoaded', () => {
    const application = new App();
    application.initialize()
        .then(() => {
            console.log('Application entry stage executed cleanly.');
        })
        .catch((error) => {
            console.error('Fatal error triggered at entry bootstrap:', error);
        });
});
 
