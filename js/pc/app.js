/* js/pc/app.js */
import { initMouseInput } from './input-mouse.js';
import { initScrollInput } from './input-scroll.js';
import { calculatePCTransforms } from './transformer.js';
import { updatePCDOM } from './dom-updater.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo các trình quản lý lắng nghe sự kiện tương tác thiết bị ngoại vi của PC
    initMouseInput();
    initScrollInput();

    // 2. Định nghĩa hàm chạy vòng lặp xử lý logic và đồ họa liên tục (Core Render Loop)
    function pcRenderLoop() {
        // Tính toán toàn bộ ma trận số học dựa trên các luồng input
        const computedTransforms = calculatePCTransforms();

        // Ghi dữ liệu ma trận vào DOM để GPU thực thi xử lý hình ảnh
        updatePCDOM(computedTransforms);

        // Duy trì vòng lặp mượt mà theo tần số quét màn hình (60Hz, 144Hz, 240Hz,...)
        requestAnimationFrame(pcRenderLoop);
    }

    // 3. Kích hoạt vòng lặp chạy nền chính thức
    requestAnimationFrame(pcRenderLoop);
});
 
