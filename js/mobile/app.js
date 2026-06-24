/* js/mobile/app.js */
import { initTouchInput } from './input-touch.js';
import { initGyroInput } from './input-gyro.js';
import { calculateMobileTransforms } from './transformer.js';
import { updateMobileDOM } from './dom-updater.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo các trình quản lý lắng nghe phần cứng di động
    initTouchInput();
    initGyroInput();

    // 2. Định nghĩa hàm thực thi vòng lặp render đồ họa (Render Loop)
    function renderLoop() {
        // Thực hiện tính toán ma trận góc xoay
        const activeTransforms = calculateMobileTransforms();
        
        // Đẩy dữ liệu cập nhật trực tiếp vào giao diện hiển thị
        updateMobileDOM(activeTransforms);
        
        // Duy trì vòng lặp mượt mà theo tần số quét của màn hình điện thoại (60Hz - 120Hz)
        requestAnimationFrame(renderLoop);
    }

    // 3. Kích hoạt vòng lặp chạy nền
    requestAnimationFrame(renderLoop);
});
 
