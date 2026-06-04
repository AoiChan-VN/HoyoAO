export class VRCameraMatrix {
    /**
     * Khởi tạo ma trận điều khiển góc nhìn không gian 3D
     * @param {HTMLElement} sceneRootNode Phần tử DOM gốc chứa toàn bộ thế giới VR
     */
    constructor(sceneRootNode) {
        this.sceneRootNode = sceneRootNode;

        // Góc xoay hiện tại của hệ thống (Tính bằng độ)
        this.currentX = 0;
        this.currentY = 0;

        // Góc xoay mục tiêu hướng tới (Dùng để nội suy mượt mà)
        this.targetX = 0;
        this.targetY = 0;

        // Giới hạn góc quay của trục X (Lên/Xuống) để tránh lật ngược camera vật lý
        this.pitchLimit = 85;

        // Tỷ lệ nội suy tuyến tính (Lerp Factor) - số càng nhỏ chuyển động càng mịn và có độ quán tính
        this.lerpFactor = 0.15;

        // Kích hoạt vòng lặp render cập nhật ma trận liên tục theo tần số quét màn hình
        this._startRenderLoop();
    }

    /**
     * Cập nhật tọa độ góc quay từ cảm biến Gyroscope
     * @param {number} rotationX Góc xoay quanh trục X (Pitch)
     * @param {number} rotationY Góc xoay quanh trục Y (Yaw)
     */
    updateOrientation(rotationX, rotationY) {
        // Cập nhật góc đích trực tiếp từ dữ liệu cảm biến phần cứng
        this.targetX = this._clamp(rotationX, -this.pitchLimit, this.pitchLimit);
        this.targetY = rotationY;
    }

    /**
     * Cập nhật góc quay thủ công bằng tương tác chuột/trackpad từ Desktop Fallback
     * @param {number} deltaX Khoảng cách thay đổi góc X
     * @param {number} deltaY Khoảng cách thay đổi góc Y
     */
    addManualOffset(deltaX, deltaY) {
        this.targetX = this._clamp(this.targetX + deltaX, -this.pitchLimit, this.pitchLimit);
        this.targetY = this.targetY + deltaY;
    }

    /**
     * Thuật toán giới hạn khoảng giá trị số thực
     * @private
     */
    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Vòng lặp tính toán và áp dụng ma trận biến đổi CSS 3D
     * @private
     */
    _startRenderLoop() {
        const render = () => {
            // Thực hiện nội suy tuyến tính (Lerp) giữa góc hiện tại và góc mục tiêu để tạo độ mịn VR
            this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
            
            // Xử lý bước nhảy góc Y quanh vòng tròn 360 độ để tránh lỗi nội suy ngược hướng
            let diffY = this.targetY - this.currentY;
            // Chuẩn hóa vi sai góc về khoảng [-180, 180]
            diffY = ((diffY + 180) % 360 + 360) % 360 - 180;
            this.currentY += diffY * this.lerpFactor;

            // Áp dụng ma trận chuỗi biến đổi hình học không gian 3D
            // Lưu ý: Để giả lập Camera xoay, thế giới thực tế phải xoay ngược dấu với góc nhìn camera (-current)
            const transformMatrix = `
                perspective(var(--vr-perspective))
                rotateX(${-this.currentX}deg)
                rotateY(${-this.currentY}deg)
                translateZ(0px)
            `;

            // Ép cấu trúc phần cứng cập nhật trực tiếp qua CSS inline
            this.sceneRootNode.style.transform = transformMatrix;

            // Đệ quy liên tục qua RequestAnimationFrame để đồng bộ tối đa với phần cứng hiển thị
            requestAnimationFrame(render);
        };

        // Kích hoạt khung hình đầu tiên
        requestAnimationFrame(render);
    }
}
 
