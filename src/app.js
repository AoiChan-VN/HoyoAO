/**
 * ==========================================================================
 * BOOTSTRAP SPATIAL CORE - MOBILE DEBUG POWERED
 * Hạt nhân điều phối luồng thực thể ảo tích hợp bộ gỡ lỗi trực quan trên di động.
 * Tự động quét lỗi nạp tài nguyên và hiển thị trạng thái phần cứng lên màn hình.
 * ==========================================================================
 */

import { SpatialMatrixEngine } from './core/matrix.js';
import { SpatialGyroscopeCore } from './core/gyroscope.js';
import { SpatialMarkdownEngine } from './core/markdown.js';

export class App {
    constructor(stageElement) {
        if (!stageElement) {
            throw new Error('CRITICAL: Hạ tầng đổ vỡ do thiếu Stage điều phối vật lý.');
        }

        this.stage = stageElement;
        this.viewport = stageElement.parentElement;

        // Khởi tạo các động cơ tính toán lõi
        this.matrixEngine = new SpatialMatrixEngine();
        this.gyroCore = new SpatialGyroscopeCore();
        this.markdownEngine = new SpatialMarkdownEngine();

        this.animationFrameId = null;

        // Khởi tạo và tiêm bộ HUD gỡ lỗi trực quan trên màn hình điện thoại
        this.createMobileDebugHUD();

        // Kích hoạt chuỗi khởi tạo hệ thống
        this.init();
    }

    /**
     * Tự động tạo một bảng điều khiển gỡ lỗi phẳng (HUD) ghim chặt trên màn hình điện thoại
     * Giúp lập trình viên thấy ngay lỗi hệ thống mà không cần bật F12 Console.
     */
    createMobileDebugHUD() {
        const hud = document.createElement('div');
        hud.id = 'mobile-debug-hud';
        
        // Thiết lập phong cách thiết kế tối giản, đè lên mọi không gian 3D để dễ đọc
        Object.assign(hud.style, {
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            width: 'calc(100% - 20px)',
            maxHeight: '160px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid #00f0ff',
            borderRadius: '6px',
            padding: '10px',
            color: '#05ff60',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.4',
            overflowY: 'auto',
            zIndex: '999999',
            pointerEvents: 'none' // Không chặn tương tác vuốt chạm kéo thả của WebXR
        });

        hud.innerHTML = `
            <div style="color:#00f0ff;font-weight:bold;margin-bottom:4px;border-bottom:1px solid rgba(0,240,255,0.3)">SPATIAL ENGINE DEBUGGER v1.0</div>
            <div id="debug-env">Environment: Detecting...</div>
            <div id="debug-path" style="word-break:break-all;color:#fcee0a">Path: Calculating...</div>
            <div id="debug-gyro">Gyro Subsystem: Initialization...</div>
            <div id="debug-assets" style="color:#ff0055">Textures Status: Verifying...</div>
        `;

        document.body.appendChild(hud);

        // Hiển thị ngay thông tin môi trường chạy thực tế của điện thoại
        document.getElementById('debug-env').innerText = `Origin: ${window.location.origin}`;
        
        // Đoán đường dẫn ảnh dựa theo thuật toán của Skybox để hiển thị cho bạn kiểm tra
        let pathname = window.location.pathname;
        if (pathname.endsWith('index.html')) {
            pathname = pathname.substring(0, pathname.lastIndexOf('/'));
        }
        if (!pathname.endsWith('/')) pathname += '/';
        document.getElementById('debug-path').innerText = `Target Texture Path:\n${window.location.origin}${pathname}src/assets/textures/`;

        // Lắng nghe thử nghiệm nạp ảnh toàn cục để bắt lỗi 404 lập tức
        this.verifyTexturesLoad(`${window.location.origin}${pathname}src/assets/textures/pz.webp`);
    }

    /**
     * Kiểm tra thực tế xem trình duyệt điện thoại có tải được file ảnh của bạn không
     */
    verifyTexturesLoad(testUrl) {
        const img = new Image();
        img.onload = () => {
            const assetDiv = document.getElementById('debug-assets');
            if (assetDiv) {
                assetDiv.style.color = '#05ff60';
                assetDiv.innerText = `Textures Status: SUCCESS (pz.webp loaded)`;
            }
        };
        img.onerror = () => {
            const assetDiv = document.getElementById('debug-assets');
            if (assetDiv) {
                assetDiv.style.color = '#ff0055';
                assetDiv.innerText = `Textures Status: CRITICAL 404 (Cannot find image at target path)`;
            }
        };
        img.src = testUrl;
    }

    init() {
        this.matrixEngine.bindInteraction(this.viewport);

        // Đổi sang lắng nghe cả touchstart để điện thoại nhận tương tác mở Gyro ngay lập tức
        const unlockSensors = async () => {
            const sensorActivated = await this.gyroCore.activateSensor();
            const gyroDiv = document.getElementById('debug-gyro');
            
            if (gyroDiv) {
                if (sensorActivated) {
                    gyroDiv.style.color = '#05ff60';
                    gyroDiv.innerText = `Gyro Subsystem: ACTIVE (Hardware Connected)`;
                } else {
                    gyroDiv.style.color = '#fcee0a';
                    gyroDiv.innerText = `Gyro Subsystem: COMPATIBILITY MODE (Touch Only)`;
                }
            }
        };

        window.addEventListener('click', unlockSensors, { once: true });
        window.addEventListener('touchstart', unlockSensors, { once: true });

        this.renderLoop();
    }

    renderLoop() {
        if (this.gyroCore.isActive) {
            const gyroAngles = this.gyroCore.getSpatialAngles();
            this.matrixEngine.targetX = this.matrixEngine.storedX + gyroAngles.yaw;
            this.matrixEngine.targetY = this.matrixEngine.storedY + gyroAngles.pitch;

            // Cập nhật tọa độ góc quay liên tục lên HUD để bạn nhìn thấy cảm biến đang chạy
            const gyroDiv = document.getElementById('debug-gyro');
            if (gyroDiv) {
                gyroDiv.innerText = `Gyro Subsystem: ACTIVE [Yaw: ${gyroAngles.yaw.toFixed(2)}° | Pitch: ${gyroAngles.pitch.toFixed(2)}°]`;
            }
        }

        const currentTransformMatrix = this.matrixEngine.generateCameraMatrix();
        this.stage.style.transform = currentTransformMatrix;

        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    compileContent(rawMarkdown) {
        return this.markdownEngine.parse(rawMarkdown);
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.gyroCore.destroy();
        const hud = document.getElementById('mobile-debug-hud');
        if (hud) hud.remove();
    }
}
