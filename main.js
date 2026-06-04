import { BootstrapApp } from './src/app.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new BootstrapApp({
        viewportId: 'vr-viewport',
        sceneRootId: 'vr-scene-root',
        loaderId: 'app-loader'
    });
    app.init();
});
 
