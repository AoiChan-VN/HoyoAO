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
        
        this.isDragging = false;
        this.activePanel = null;
        this.panelTransform = { x: 0, y: 0, z: -400, rotX: 0, rotY: 0 };
        this.dragStart = { x: 0, y: 0 };
    }

    init() {
        try {
            this.viewportNode = document.getElementById(this.viewportId);
            this.sceneRootNode = document.getElementById(this.sceneRootId);
            this.loaderNode = document.getElementById(this.loaderId);

            if (!this.viewportNode || !this.sceneRootNode || !this.loaderNode) {
                throw new Error("Critical DOM error.");
            }

            this._registerWebComponents();
            this.cameraMatrix = new VRCameraMatrix(this.sceneRootNode);
            
            this.gyroSensor = new VRGyroscopeSensor((rotationX, rotationY) => {
                this.cameraMatrix.updateOrientation(rotationX, rotationY);
            });

            this._setupGlobalEventListeners();
            this._setupSpatialDragAndDrop();
            this._handleSystemReadyState();

        } catch (error) {
            console.error(error);
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
                await this.gyroSensor.start();
            } else {
                this.gyroSensor.stop();
            }
        });
    }

    _setupSpatialDragAndDrop() {
        const handleStart = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const targetPanel = e.target.closest('vr-panel');
            if (!targetPanel) return;

            this.isDragging = true;
            this.activePanel = targetPanel;
            this.dragStart.x = clientX;
            this.dragStart.y = clientY;
            
            this.activePanel.style.transition = 'none';
            this.activePanel.style.cursor = 'grabbing';
        };

        const handleMove = (e) => {
            if (!this.isDragging || !this.activePanel) return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - this.dragStart.x;
            const deltaY = clientY - this.dragStart.y;

            this.panelTransform.rotY += deltaX * 0.15;
            this.panelTransform.rotX -= deltaY * 0.15;

            this.panelTransform.rotX = Math.min(Math.max(this.panelTransform.rotX, -45), 45);
            this.panelTransform.rotY = Math.min(Math.max(this.panelTransform.rotY, -60), 60);

            this.activePanel.style.transform = `
                translate3d(-50%, -50%, ${this.panelTransform.z}px) 
                rotateX(${this.panelTransform.rotX}deg) 
                rotateY(${this.panelTransform.rotY}deg)
            `;

            this.dragStart.x = clientX;
            this.dragStart.y = clientY;
            e.preventDefault();
        };

        const handleEnd = () => {
            if (!this.isDragging || !this.activePanel) return;
            this.isDragging = false;
            this.activePanel.style.transition = 'var(--transition-ui-normal)';
            this.activePanel.style.cursor = 'grab';
            this.activePanel = null;
        };

        window.addEventListener('mousedown', handleStart, { passive: false });
        window.addEventListener('mousemove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);

        window.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    _handleSystemReadyState() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loaderNode.style.opacity = '0';
                setTimeout(() => {
                    this.loaderNode.style.display = 'none';
                    if(this.gyroSensor) this.gyroSensor.start();
                }, 500);
            }, 800);
        });
    }
}
 
