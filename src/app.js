import { VRStatusSkybox } from './components/skybox/skybox.js';
import { VRStatusPanel } from './components/panel/panel.js';
import { VRStatusCard } from './components/card/card.js';
import { VRStatusSettings } from './components/settings/settings.js';
import { VRStatusModal } from './components/modal/modal.js';
import { VRCameraMatrix } from './core/matrix.js';
import { VRGyroscopeSensor } from './core/gyroscope.js';

export class BootstrapApp {
    constructor(config) {
        this.viewportId = config.viewportId;
        this.sceneRootId = config.sceneRootId;
        this.loaderId = config.loaderId;
        this.viewportNode = null;
        this.sceneRootNode = null;
        this.loaderNode = null;
        this.cameraMatrix = null;
        this.gyroSensor = null;
    }

    init() {
        try {
            this.viewportNode = document.getElementById(this.viewportId);
            this.sceneRootNode = document.getElementById(this.sceneRootId);
            this.loaderNode = document.getElementById(this.loaderId);

            if (!this.viewportNode || !this.sceneRootNode || !this.loaderNode) {
                throw new Error("Missing critical DOM containers.");
            }

            this._registerWebComponents();
            this.cameraMatrix = new VRCameraMatrix(this.sceneRootNode);
            
            this.gyroSensor = new VRGyroscopeSensor((rotationX, rotationY) => {
                this.cameraMatrix.updateOrientation(rotationX, rotationY);
            });

            this._setupGlobalEventListeners();
            this._setupDesktopFallbackInteractions();
            this._handleSystemReadyState();

        } catch (error) {
            console.error("[VR Critical Error]:", error.message);
        }
    }

    _registerWebComponents() {
        if (!customElements.get('vr-skybox')) customElements.define('vr-skybox', VRStatusSkybox);
        if (!customElements.get('vr-panel')) customElements.define('vr-panel', VRStatusPanel);
        if (!customElements.get('vr-card')) customElements.define('vr-card', VRStatusCard);
        if (!customElements.get('vr-settings')) customElements.define('vr-settings', VRStatusSettings);
        if (!customElements.get('vr-modal')) customElements.define('vr-modal', VRStatusModal);
    }

    _setupGlobalEventListeners() {
        window.addEventListener('vr-gyro-request', async (e) => {
            if (!this.gyroSensor) return;
            
            if (e.detail.action === 'start') {
                const activated = await this.gyroSensor.start();
                if (!activated) {
                    const settingsComponent = document.querySelector('vr-settings');
                    if (settingsComponent && settingsComponent.shadowRoot) {
                        const toggleBtn = settingsComponent.shadowRoot.getElementById('gyro-toggle');
                        if (toggleBtn) {
                            toggleBtn.classList.remove('active');
                            toggleBtn.innerText = 'GYRO: FAILED';
                        }
                    }
                }
            } else if (e.detail.action === 'stop') {
                this.gyroSensor.stop();
            }
        });
    }

    _setupDesktopFallbackInteractions() {
        let isPointerDown = false;
        let startPointerX = 0;
        let startPointerY = 0;

        window.addEventListener('mousedown', (e) => {
            isPointerDown = true;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPointerDown || (this.gyroSensor && this.gyroSensor.isActive)) return;

            const deltaX = e.clientX - startPointerX;
            const deltaY = e.clientY - startPointerY;
            const speedMultiplier = 0.05;

            this.cameraMatrix.addManualOffset(deltaY * speedMultiplier, deltaX * speedMultiplier);

            startPointerX = e.clientX;
            startPointerY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            isPointerDown = false;
        });
    }

    _handleSystemReadyState() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loaderNode.style.opacity = '0';
                setTimeout(() => {
                    this.loaderNode.style.display = 'none';
                }, 500);
            }, 800);
        });
    }
}
 
