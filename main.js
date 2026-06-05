import { VRStatusSkybox } from './src/components/skybox/skybox.js';
import { VRStatusPanel } from './src/components/panel/panel.js';
import { VRStatusCard } from './src/components/card/card.js';
import { VRStatusDashboard } from './src/components/dashboard/dashboard.js';
import { VRSpatialViewer } from './src/components/spatial-viewer/spatial-viewer.js';
import { BootstrapApp } from './src/app.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!customElements.get('vr-skybox')) customElements.define('vr-skybox', VRStatusSkybox);
        if (!customElements.get('vr-panel')) customElements.define('vr-panel', VRStatusPanel);
        if (!customElements.get('vr-card')) customElements.define('vr-card', VRStatusCard);
        if (!customElements.get('vr-dashboard')) customElements.define('vr-dashboard', VRStatusDashboard);
        if (!customElements.get('vr-spatial-viewer')) customElements.define('vr-spatial-viewer', VRSpatialViewer);

        const app = new BootstrapApp({
            viewportId: 'vr-viewport',
            sceneRootId: 'vr-scene-root',
            loaderId: 'app-loader'
        });
        
        app.init();

    } catch (error) {
        console.error(error);
    }
});
