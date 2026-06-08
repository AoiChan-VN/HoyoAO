/**
 * AppController.js
 * Bộ điều phối trung tâm quản lý Main Loop, trạng thái chuyển đổi các Panel và Camera VR.
 */
import { SensorCamera } from '../infrastructure/SensorCamera.js';
import { WebGLRenderer } from '../infrastructure/WebGLRenderer.js';
import { PerformanceRegistry } from './PerformanceRegistry.js';
import { Matrix4 } from '../domain/Matrix4.js';
import { Vector3 } from '../domain/Vector3.js';
import { PhysicsDragDrop } from '../presentation/core/PhysicsDragDrop.js';
import { CentralMenu } from '../presentation/components/CentralMenu.js';
import { SettingsPanel } from '../presentation/components/SettingsPanel.js';
import { PostListPanel } from '../presentation/components/PostListPanel.js';
import { ReaderPanel } from '../presentation/components/ReaderPanel.js';

export class AppController {
    constructor() {
        this.camera = new SensorCamera();
        this.perfRegistry = new PerformanceRegistry();
        
        const canvas = document.getElementById('webgl-canvas');
        this.renderer = new WebGLRenderer(canvas);

        // Khởi tạo các thành phần UI / UX Presentation
        this.physicsEngine = new PhysicsDragDrop();
        this.centralMenu = new CentralMenu(this);
        this.settingsPanel = new SettingsPanel(this);
        this.postListPanel = new PostListPanel(this);
        this.readerPanel = new ReaderPanel(this);

        // Cấu trúc ma trận hệ thống phục vụ WebGL
        this.projMatrix = new Matrix4().makePerspective(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.viewMatrix = new Matrix4();
        this.camPos = new Vector3(0, 0, 0);

        this.initResize();
        this.startMainLoop();
    }

    initResize() {
        window.addEventListener('resize', () => {
            this.projMatrix.makePerspective(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        });
    }

    startMainLoop() {
        const loop = (currentTime) => {
            requestAnimationFrame(loop);

            if (!this.perfRegistry.shouldRender(currentTime)) return;

            const dt = this.perfRegistry.getDeltaTime();

            // 1. Đồng bộ hóa góc xoay từ SensorCamera vào không gian CSS 3D & WebGL
            const euler = this.camera.getOrientationEuler();
            this.updateCSSOrientation(euler);

            // 2. Cập nhật Engine vật lý kéo thả cho các Panel hoạt động
            this.physicsEngine.update(dt);

            // 3. Tính toán ma trận góc nhìn phục vụ hiệu ứng ánh sáng WebGL2 Phong Lighting
            this.viewMatrix.identity().makeRotationFromEuler(euler.x, euler.y, euler.z);
            this.renderer.render(this.viewMatrix.elements, this.projMatrix.elements, this.camPos);
        };
        requestAnimationFrame(loop);
    }

    updateCSSOrientation(euler) {
        const sceneContainer = document.getElementById('scene-3d');
        if (sceneContainer) {
            // Đảo ngược góc xoay của camera để xoay toàn bộ thế giới CSS theo hướng ngược lại
            const degX = euler.x * (180 / Math.PI);
            const degY = euler.y * (180 / Math.PI);
            sceneContainer.style.transform = `rotateX(${-degX}deg) rotateY(${-degY}deg)`;
        }
    }
}

// Khởi chạy hệ thống ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    window.appContext = new AppController();
});
 
