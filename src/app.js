/**
 * ==========================================================================
 * BOOTSTRAP SPATIAL CORE (SYSTEM HUB)
 * Hạt nhân điều phối luồng thực thể ảo, quản lý vòng lặp kết xuất ma trận 3D
 * và đồng bộ hóa đa luồng dữ liệu tương tác cảm biến phần cứng.
 * ==========================================================================
 */

import { SpatialMatrixEngine } from './core/matrix.js';
import { SpatialGyroscopeCore } from './core/gyroscope.js';
import { SpatialMarkdownEngine } from './core/markdown.js';

export class App {
    /**
     * Khởi tạo hệ thống điều phối Spatial
     * @param {HTMLElement} stageElement Lớp bảo toàn cấu trúc hình học preserve-3d
     */
    constructor(stageElement) {
        if (!stageElement) {
            throw new Error('CRITICAL: Hạ tầng đổ vỡ do thiếu Stage điều phối vật lý.');
        }

        this.stage = stageElement;
        this.viewport = stageElement.parentElement;

        // Khởi tạo các động cơ tính toán lõi độc lập
        this.matrixEngine = new SpatialMatrixEngine();
        this.gyroCore = new SpatialGyroscopeCore();
        this.markdownEngine = new SpatialMarkdownEngine();

        // Trạng thái vòng lặp kết xuất
        this.animationFrameId = null;

        // Kích hoạt chuỗi khởi tạo hệ thống hạ tầng
        this.init();
    }

    /**
     * Kích hoạt luồng liên kết tương tác và khởi động vòng lặp kết xuất tối cao
     */
    init() {
        // Bước 1: Liên kết bộ tương tác chuột/chạm (Drag/Inertia) vào Viewport tối cao
        this.matrixEngine.bindInteraction(this.viewport);

        // Bước 2: Kích hoạt nút bấm kích hoạt cảm biến Gyroscope tự động khi người dùng tương tác lần đầu
        this.viewport.addEventListener('click', () => this.handleFirstInteraction(), { once: true });
        this.viewport.addEventListener('touchstart', () => this.handleFirstInteraction(), { once: true });

        // Bước 3: Khởi động vòng lặp kết xuất phần cứng tăng tốc (Hardware-Accelerated Loop)
        this.renderLoop();
    }

    /**
     * Xử lý tương tác đầu tiên của người dùng để kích hoạt quyền an toàn của cảm biến di động
     */
    async handleFirstInteraction() {
        const sensorActivated = await this.gyroCore.activateSensor();
        if (sensorActivated) {
            console.log('SPATIAL ENGINE: Cảm biến con quay hồi chuyển đã tích hợp vào hệ thống phối cảnh.');
        }
    }

    /**
     * Vòng lặp kết xuất thời gian thực chuyên dụng cho Spatial Computing.
     * Tối ưu hóa chu kỳ quét màn hình và triệt tiêu hiện tượng sụt giảm FPS.
     */
    renderLoop() {
        // Kiểm tra và lấy dữ liệu góc xoay đã làm sạch từ bộ lọc thông thấp (Gyroscope)
        if (this.gyroCore.isActive) {
            const gyroAngles = this.gyroCore.getSpatialAngles();
            
            // Đồng bộ góc xoay cảm biến vào ma trận mục tiêu (Bổ sung hiệu ứng Parallax chéo)
            this.matrixEngine.targetX = this.matrixEngine.storedX + gyroAngles.yaw;
            this.matrixEngine.targetY = this.matrixEngine.storedY + gyroAngles.pitch;
        }

        // Thực thi thuật toán sinh chuỗi ma trận biến đổi Matrix3D tích hợp quán tính kéo thả
        const currentTransformMatrix = this.matrixEngine.generateCameraMatrix();

        // Đẩy chuỗi ma trận trực tiếp vào phần cứng xử lý đồ họa của lớp Stage thông qua CSS4
        this.stage.style.transform = currentTransformMatrix;

        // Đăng ký chu kỳ quét màn hình tiếp theo, đảm bảo không nghẽn luồng chính
        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * Phương thức phân phối nội dung toàn cục: Giúp các Custom Element gọi xử lý Markdown an toàn
     * @param {string} rawMarkdown Dữ liệu nội dung thô từ file cấu hình
     * @returns {string} Chuỗi HTML5 đã được Tokenize và Sanitize bảo mật
     */
    compileContent(rawMarkdown) {
        return this.markdownEngine.parse(rawMarkdown);
    }

    /**
     * Hủy bỏ vòng lặp và giải phóng tài nguyên hệ thống khi tháo dỡ hạ tầng (Chống Memory Leak)
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.gyroCore.destroy();
        console.log('SPATIAL ENGINE: Hệ thống hạ tầng Core đã đóng an toàn.');
    }
}
 
