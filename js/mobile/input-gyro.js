/* js/mobile/input-gyro.js */
import { MOBILE_CONFIG } from './config.js';
import { MOBILE_STATE } from './state.js';

export function initGyroInput() {
    // Hàm xử lý dữ liệu cảm biến
    function handleOrientation(event) {
        // beta: Nghiêng trước/sau (-180 đến 180). gamma: Nghiêng trái/phải (-90 đến 90)
        const beta = event.beta ? event.beta : 0;
        const gamma = event.gamma ? event.gamma : 0;

        // Áp dụng bộ lọc nhiễu tần số thấp (Low-pass filter) tránh giật camera do run tay
        MOBILE_STATE.gyro.filteredX = MOBILE_STATE.gyro.filteredX + MOBILE_CONFIG.GYRO_FILTER * (beta - MOBILE_STATE.gyro.filteredX);
        MOBILE_STATE.gyro.filteredY = MOBILE_STATE.gyro.filteredY + MOBILE_CONFIG.GYRO_FILTER * (gamma - MOBILE_STATE.gyro.filteredY);

        // Quy đổi ra góc xoay ma trận mục tiêu
        MOBILE_STATE.gyro.targetX = (MOBILE_STATE.gyro.filteredX - 45) * MOBILE_CONFIG.GYRO_SENSITIVITY_X; // Trừ 45 độ để tối ưu góc cầm máy tự nhiên
        MOBILE_STATE.gyro.targetY = MOBILE_STATE.gyro.filteredY * MOBILE_CONFIG.GYRO_SENSITIVITY_Y;
    }

    // Cơ chế xin cấp quyền của trình duyệt hiện đại (iOS yêu cầu kích hoạt từ hành động của người dùng)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Tạo một vùng bấm vô hình trên màn hình để kích hoạt quyền nếu chưa có
        const overlayButton = document.createElement('div');
        overlayButton.style.position = 'fixed';
        overlayButton.style.top = '0';
        overlayButton.style.left = '0';
        overlayButton.style.width = '100%';
        overlayButton.style.height = '100%';
        overlayButton.style.zIndex = '999999';
        overlayButton.style.backgroundColor = 'transparent';
        document.body.appendChild(overlayButton);

        overlayButton.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        MOBILE_STATE.isGyroAuthorized = true;
                    }
                    overlayButton.remove();
                })
                .catch(() => {
                    overlayButton.remove();
                });
        });
    } else {
        // Đối với Android hoặc các trình duyệt cũ không cần xin quyền chủ động
        window.addEventListener('deviceorientation', handleOrientation, true);
        MOBILE_STATE.isGyroAuthorized = true;
    }
}
 
