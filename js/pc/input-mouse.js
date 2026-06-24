/* js/pc/input-mouse.js */
import { PC_CONFIG } from './config.js';
import { PC_STATE } from './state.js';

export function initMouseInput() {
    // Lắng nghe sự kiện di chuyển chuột trên toàn bộ khung nhìn của trình duyệt
    window.addEventListener('mousemove', (e) => {
        // Chuẩn hóa tọa độ chuột: Tâm màn hình sẽ có giá trị là 0, góc trái là âm, phải là dương
        const halfWidth = PC_STATE.window.width / 2;
        const halfHeight = PC_STATE.window.height / 2;

        const normalizedX = (e.clientX - halfWidth) / halfWidth;   // Khoảng giá trị từ -1 đến 1
        const normalizedY = (e.clientY - halfHeight) / halfHeight; // Khoảng giá trị từ -1 đến 1

        // Cập nhật giá trị mục tiêu cho góc xoay ma trận và dịch chuyển Parallax
        PC_STATE.mouse.targetX = normalizedX;
        PC_STATE.mouse.targetY = normalizedY;
    });

    // Cập nhật lại thông số khung nhìn khi người dùng thay đổi kích thước trình duyệt (Resize)
    window.addEventListener('resize', () => {
        PC_STATE.window.width = window.innerWidth;
        PC_STATE.window.height = window.innerHeight;
    });
}
 
