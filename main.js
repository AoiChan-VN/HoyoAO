import { VRStatusSkybox } from './src/components/skybox/skybox.js';
import { VRStatusPanel } from './src/components/panel/panel.js';
import { VRStatusCard } from './src/components/card/card.js';
import { VRStatusSettings } from './src/components/settings/settings.js';
import { VRStatusModal } from './src/components/modal/modal.js';
import { BootstrapApp } from './src/app.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!customElements.get('vr-skybox')) customElements.define('vr-skybox', VRStatusSkybox);
        if (!customElements.get('vr-panel')) customElements.define('vr-panel', VRStatusPanel);
        if (!customElements.get('vr-card')) customElements.define('vr-card', VRStatusCard);
        if (!customElements.get('vr-settings')) customElements.define('vr-settings', VRStatusSettings);
        if (!customElements.get('vr-modal')) customElements.define('vr-modal', VRStatusModal);

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
 
