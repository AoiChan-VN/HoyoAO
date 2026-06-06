/**
 * ==========================================================================
 * LOW-PASS SENSOR CORE (GYROSCOPE SUBSYSTEM)
 * Kết nối phần cứng cảm biến thiết bị di động, lọc nhiễu tín hiệu thời gian thực.
 * Tích hợp cơ chế xin quyền an toàn chuẩn mã nguồn Production toàn cầu.
 * ==========================================================================
 */

export class SpatialGyroscopeCore {
    constructor() {
        // Giá trị thô nhận từ cảm biến phần cứng
        this.rawAlpha = 0; // Trục Z (Yaw)
        this.rawBeta = 0;  // Trục X (Pitch)
        this.rawGamma = 0; // Trục Y (Roll)

        // Giá trị sau khi đi qua bộ lọc thông thấp (Low-pass Filtered)
        this.filteredYaw = 0;
        this.filteredPitch = 0;

        // Trạng thái vận hành của cảm biến
        this.isActive = false;
        this.isSupported = false;

        // Hằng số bộ lọc (Hệ số làm mượt tín hiệu - Càng nhỏ càng mượt nhưng trễ hơn)
        this.filterFactor = 0.12; 

        // Lưu trữ góc tham chiếu ban đầu khi vừa kích hoạt để chống giật Camera
        this.initialYaw = null;
        this.initialPitch = null;
    }

    /**
     * Khởi động quy trình kiểm tra và yêu cầu quyền truy cập phần cứng cảm biến
     * @returns {Promise<boolean>} Trạng thái kích hoạt thành công hay thất bại
     */
    async activateSensor() {
        if (!window.DeviceOrientationEvent) {
            this.isSupported = false;
            return false;
        }

        this.isSupported = true;

        // Xử lý cơ chế bảo mật nghiêm ngặt yêu cầu tương tác người dùng (API chuẩn của iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    this.startListening();
                    return true;
                } else {
                    console.warn('SPATIAL SENSOR: Người dùng từ chối cấp quyền truy cập Gyroscope.');
                    return false;
                }
            } catch (error) {
                console.error('SPATIAL SENSOR: Lỗi nghiêm trọng khi xin quyền thiết bị:', error);
                return false;
            }
        } else {
            // Đối với các thiết bị Android hoặc trình duyệt cũ không yêu cầu API xin quyền
            this.startListening();
            return true;
        }
    }

    /**
     * Đăng ký sự kiện lắng nghe trực tiếp luồng phần cứng
     */
    startListening() {
        if (this.isActive) return;
        
        window.addEventListener('deviceorientation', (event) => this.processSensorData(event), true);
        this.isActive = true;
    }

    /**
     * Thuật toán lọc nhiễu thông thấp (Low-pass Filter) xử lý tín hiệu lượng giác
     * @param {DeviceOrientationEvent} event Sự kiện trả về từ phần cứng trình duyệt
     */
    processSensorData(event) {
        if (event.alpha === null || event.beta === null) return;

        // Nạp dữ liệu thô từ phần cứng
        this.rawAlpha = event.alpha; 
        this.rawBeta = event.beta;   
        this.rawGamma = event.gamma; 

        // Chuẩn hóa góc xoay ban đầu làm mốc 0 tuyệt đối để tránh lỗi nhảy góc đột ngột khi vừa bật
        if (this.initialYaw === null) {
            this.initialYaw = this.rawAlpha;
            this.initialPitch = this.rawBeta;
        }

        // Tính toán độ lệch tương đối (Delta) so với mốc khởi tạo ban đầu
        let deltaYaw = this.rawAlpha - this.initialYaw;
        let deltaPitch = this.rawBeta - this.initialPitch;

        // Xử lý lỗi tràn biên lượng giác khi góc xoay vượt qua ranh giới 0/360 độ
        if (deltaYaw > 180) deltaYaw -= 360;
        if (deltaYaw < -180) deltaYaw += 360;

        // Thực thi công thức toán học Bộ lọc thông thấp (Low-pass Filter Formula)
        // Lấy (1 - factor) giá trị cũ cộng với (factor) giá trị mới nhập vào
        this.filteredYaw = this.filteredYaw + this.filterFactor * (deltaYaw - this.filteredYaw);
        this.filteredPitch = this.filteredPitch + this.filterFactor * (deltaPitch - this.filteredPitch);
    }

    /**
     * Xuất dữ liệu góc xoay đã làm sạch để tích hợp trực tiếp vào ma trận dịch chuyển
     * @returns {Object} Đối tượng chứa tọa độ Yaw/Pitch mượt mà
     */
    getSpatialAngles() {
        return {
            yaw: this.filteredYaw,
            pitch: Math.max(-75, Math.min(75, this.filteredPitch)) // Khóa góc nhìn dọc an toàn
        };
    }

    /**
     * Giải phóng bộ nhớ và huỷ lắng nghe sự kiện khi không cần thiết (Chống Resource Leak)
     */
    destroy() {
        if (this.isActive) {
            window.removeEventListener('deviceorientation', (event) => this.processSensorData(event), true);
            this.isActive = false;
            this.initialYaw = null;
            this.initialPitch = null;
        }
    }
}
 
