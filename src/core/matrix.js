/**
 * ==========================================================================
 * MATRIX3D MATHEMATICS TRANSLATION ENGINE
 * Bộ tính toán ma trận lượng giác & phối cảnh camera 360 độ siêu tối ưu.
 * Không phụ thuộc thư viện ngoài, tích hợp bộ lọc nội suy quán tính (Inertia).
 * ==========================================================================
 */

export class SpatialMatrixEngine {
    constructor() {
        // Tọa độ mục tiêu hướng tới (Target) và tọa độ hiện tại sau nội suy (Current)
        this.targetX = 0;
        this.targetY = 0;
        this.currentX = 0;
        this.currentY = 0;

        // Tọa độ phục vụ thao tác kéo thả không gian (Drag/Toss Behavior)
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.storedX = 0;
        this.storedY = 0;

        // Các hệ số động lực học vật lý (Hằng số không Hardcode)
        this.friction = 0.92;      // Lực ma sát triệt tiêu quán tính
        this.interpolation = 0.08; // Tốc độ nội suy mượt mà (Lerp factor)
        this.sensitivity = 0.15;   // Độ nhạy chuột và cảm ứng chạm
    }

    /**
     * Khởi tạo các sự kiện lắng nghe tương tác kéo thả trên vùng Viewport
     * @param {HTMLElement} viewportElement Lớp nền tối cao nhận tương tác
     */
    bindInteraction(viewportElement) {
        if (!viewportElement) return;

        // Sự kiện Chuột (Desktop)
        viewportElement.addEventListener('mousedown', (e) => this.onDragStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => this.onDragMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => this.onDragEnd());

        // Sự kiện Chạm (Mobile VR/Arched View)
        viewportElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.onDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                this.onDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        window.addEventListener('touchend', () => this.onDragEnd());
    }

    onDragStart(clientX, clientY) {
        this.isDragging = true;
        this.startX = clientX;
        this.startY = clientY;
        this.storedX = this.targetX;
        this.storedY = this.targetY;
    }

    onDragMove(clientX, clientY) {
        if (!this.isDragging) return;
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;

        // Tính toán góc quay mục tiêu dựa trên khoảng cách dịch chuyển và độ nhạy
        this.targetX = this.storedX + deltaX * this.sensitivity;
        // Giới hạn góc Pitch để tránh lật ngược camera (Quay dọc tối đa 75 độ)
        this.targetY = Math.max(-75, Math.min(75, this.storedY - deltaY * this.sensitivity));
    }

    onDragEnd() {
        this.isDragging = false;
    }

    /**
     * Thuật toán nội suy tuyến tính (Lerp) tạo hiệu ứng quán tính mượt mà cho Camera
     */
    updateInertia() {
        this.currentX += (this.targetX - this.currentX) * this.interpolation;
        this.currentY += (this.targetY - this.currentY) * this.interpolation;
    }

    /**
     * Tạo chuỗi ma trận biến đổi Matrix3D từ các góc xoay Euler (Yaw/Pitch)
     * Tránh hoàn toàn việc sử dụng chuỗi lồng nhau gây suy giảm hiệu năng.
     * @returns {string} Chuỗi CSS matrix3D hoàn chỉnh cho phần cứng tăng tốc
     */
    generateCameraMatrix() {
        this.updateInertia();

        // Chuyển đổi góc xoay sang đơn vị Radian để tính toán lượng giác
        const radX = (this.currentX * Math.PI) / 180;
        const radY = (this.currentY * Math.PI) / 180;

        const cosX = Math.cos(radX);
        const sinX = Math.sin(radX);
        const cosY = Math.cos(radY);
        const sinY = Math.sin(radY);

        /**
         * Nhân ma trận quay quanh trục Y (Yaw) và trục X (Pitch).
         * Cấu trúc mảng 16 phần tử đại diện cho ma trận cột dọc 4x4:
         * [ m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33 ]
         */
        const m00 = cosX;
        const m01 = sinX * sinY;
        const m02 = -sinX * cosY;
        
        const m10 = 0;
        const m11 = cosY;
        const m12 = sinY;
        
        const m20 = sinX;
        const m21 = -cosX * sinY;
        const m22 = cosX * cosY;

        // Trả về chuỗi định dạng chính xác của CSS matrix3d hardware-accelerated
        return `matrix3d(
            ${m00.toFixed(6)}, ${m01.toFixed(6)}, ${m02.toFixed(6)}, 0,
            ${m10.toFixed(6)}, ${m11.toFixed(6)}, ${m12.toFixed(6)}, 0,
            ${m20.toFixed(6)}, ${m21.toFixed(6)}, ${m22.toFixed(6)}, 0,
            0, 0, 0, 1
        )`;
    }
}
 
