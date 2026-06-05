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
        this.activeObject = null;
        this.dragStart = { x: 0, y: 0 };
        this.objectTransforms = new Map();
    }

    init() {
        try {
            this.viewportNode = document.getElementById(this.viewportId);
            this.sceneRootNode = document.getElementById(this.sceneRootId);
            this.loaderNode = document.getElementById(this.loaderId);

            if (!this.viewportNode || !this.sceneRootNode || !this.loaderNode) {
                throw new Error("Critical DOM failure.");
            }

            this.cameraMatrix = new VRCameraMatrix(this.sceneRootNode);
            
            this.gyroSensor = new VRGyroscopeSensor((rotationX, rotationY) => {
                this.cameraMatrix.updateOrientation(rotationX, rotationY);
            });

            this._setupSpatialObjects();
            this._setupGlobalEventListeners();
            this._setupSpatialInteractionEngine();
            this._handleSystemReadyState();

        } catch (error) {
            console.error(error);
        }
    }

    _setupSpatialObjects() {
        const spatialElements = this.sceneRootNode.querySelectorAll('vr-panel, vr-settings');
        spatialElements.forEach((el, index) => {
            const initialZ = -450;
            const initialXOffset = index === 0 ? -160 : 280;
            const initialYOffset = index === 0 ? 0 : 40;

            this.objectTransforms.set(el, {
                x: initialXOffset,
                y: initialYOffset,
                z: initialZ,
                rotX: 0,
                rotY: index === 0 ? 15 : -15
            });

            this._applySpatialTransform(el);
        });
    }

    _applySpatialTransform(el) {
        const t = this.objectTransforms.get(el);
        if (!t) return;
        el.style.position = 'absolute';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = `translate3d(calc(-50% + ${t.x}px), calc(-50% + ${t.y}px), ${t.z}px) rotateX(${t.rotX}deg) rotateY(${t.rotY}deg)`;
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

    _setupSpatialInteractionEngine() {
        const handleStart = (e) => {
            const target = e.target.closest('vr-panel, vr-settings');
            if (!target || e.target.closest('button, a, vr-card')) return;

            this.isDragging = true;
            this.activeObject = target;
            
            const clientX = e.touches ? e.touches.clientX : e.clientX;
            const clientY = e.touches ? e.touches.clientY : e.clientY;
            
            this.dragStart.x = clientX;
            this.dragStart.y = clientY;
            
            this.activeObject.style.transition = 'none';
        };

        const handleMove = (e) => {
            if (!this.isDragging || !this.activeObject) return;

            const clientX = e.touches ? e.touches.clientX : e.clientX;
            const clientY = e.touches ? e.touches.clientY : e.clientY;

            const deltaX = clientX - this.dragStart.x;
            const deltaY = clientY - this.dragStart.y;

            const transform = this.objectTransforms.get(this.activeObject);
            if (transform) {
                transform.x += deltaX * 0.8;
                transform.y += deltaY * 0.8;
                transform.rotY += deltaX * 0.1;
                transform.rotX -= deltaY * 0.1;
                
                transform.rotX = Math.min(Math.max(transform.rotX, -45), 45);
                transform.rotY = Math.min(Math.max(transform.rotY, -60), 60);
                
                this._applySpatialTransform(this.activeObject);
            }

            this.dragStart.x = clientX;
            this.dragStart.y = clientY;
            e.preventDefault();
        };

        const handleEnd = () => {
            if (!this.isDragging || !this.activeObject) return;
            this.activeObject.style.transition = 'var(--transition-ui-normal)';
            this.isDragging = false;
            this.activeObject = null;
        };

        this.viewportNode.addEventListener('mousedown', handleStart);
        this.viewportNode.addEventListener('mousemove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);

        this.viewportNode.addEventListener('touchstart', handleStart, { passive: false });
        this.viewportNode.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    _handleSystemReadyState() {
        const dismissLoader = () => {
            if (!this.loaderNode) return;
            this.loaderNode.style.opacity = '0';
            setTimeout(() => {
                this.loaderNode.style.display = 'none';
            }, 500);
        };

        if (document.readyState === 'complete') {
            dismissLoader();
        } else {
            window.addEventListener('load', dismissLoader, { once: true });
        }
    }
}
