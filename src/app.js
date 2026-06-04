// Import toàn bộ các Custom Web Components độc lập theo cấu trúc dự án
import { VRStatusSkybox } from './components/skybox/skybox.js';
import { VRStatusPanel } from './components/panel/panel.js';
import { VRStatusCard } from './components/card/card.js';
import { VRStatusSettings } from './components/settings/settings.js';
import { VRStatusModal } from './components/modal/modal.js';

// Import hai engine xử lý cốt lõi của không gian VR
import { VRCameraMatrix } from './core/matrix.js';
import { VRGyroscopeSensor } from './core/gyroscope.js';

export class BootstrapApp {
    /**
     * Khởi tạo cấu hình hệ thống Portfolio VR
     * @param {Object} config Cấu hình id định vị các node giao diện gốc
     */
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

    /**
     * Vòng đời kích hoạt và thiết lập phân rã luồng xử lý
     */
    init() {
        try {
            // 1. Định vị và ánh xạ các Node giao diện chính từ index.html
            this.viewportNode = document.getElementById(this.viewportId);
            this.sceneRootNode = document.getElementById(this.sceneRootId);
            this.loaderNode = document.getElementById(this.loaderId);

            if (!this.viewportNode || !this.sceneRootNode || !this.loaderNode) {
                throw new Error("Không thể tìm thấy các thành phần Viewport/Scene DOM gốc.");
            }

            // 2. Đăng ký các Custom Web Components độc lập vào hệ thống Browser Registry
            this._registerWebComponents();

            // 3. Khởi tạo lõi xử lý toán học Ma trận Camera 3D
            this.cameraMatrix = new VRCameraMatrix(this.sceneRootNode);

            // 4. Khởi tạo lõi xử lý cảm biến Gyroscope phần cứng thiết bị
            this.gyroSensor = new VRGyroscopeSensor((rotationX, rotationY) => {
                // Tác động trực tiếp góc quay từ cảm biến vào ma trận biến đổi không gian
                this.cameraMatrix.updateOrientation(rotationX, rotationY);
            });

            // 5. Thiết lập cơ chế tương tác dự phòng bằng Chuột/Trackpad cho Desktop
            this._setupDesktopFallbackInteractions();

            // 6. Theo dõi sự kiện tải tài nguyên và ẩn màn hình chờ (Loader) công khai
            this._handleSystemReadyState();

        } catch (error) {
            console.error("[VR Platform Critical Failure]:", error.message);
        }
    }

    /**
     * Đăng ký độc lập, cam kết không lồng ghép hay gom cụm layout
     * @private
     */
    _registerWebComponents() {
        if (!customElements.get('vr-skybox')) customElements.define('vr-skybox', VRStatusSkybox);
        if (!customElements.get('vr-panel')) customElements.define('vr-panel', VRStatusPanel);
        if (!customElements.get('vr-card')) customElements.define('vr-card', VRStatusCard);
        if (!customElements.get('vr-settings')) customElements.define('vr-settings', VRStatusSettings);
        if (!customElements.get('vr-modal')) customElements.define('vr-modal', VRStatusModal);
    }

    /**
     * Tương tác phối cảnh chuột khi thiết bị không hỗ trợ con quay hồi chuyển
     * @private
     */
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
            if (!isPointerDown || this.gyroSensor.isActive) return;

            // Tính toán khoảng cách di chuyển để chuyển đổi thành góc quay vật lý
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

    /**
     * Giải phóng màn hình chờ sau khi toàn bộ tài nguyên cục bộ (Ảnh WebP/Markdown) nạp xong
     * @private
     */
    _handleSystemReadyState() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loaderNode.style.opacity = '0';
                setTimeout(() => {
                    this.loaderNode.style.display = 'none';
                    // Tự động kích hoạt thử nghiệm yêu cầu quyền cảm biến Gyroscope nếu có cấu hình trước
                    this.gyroSensor.start();
                }, 500);
            }, 800); // Tạo độ trễ chuyển cảnh mượt mà cho thị giác VR
        });
    }
}
 
