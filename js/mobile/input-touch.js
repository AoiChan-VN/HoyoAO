/* js/mobile/input-touch.js */
import { MOBILE_CONFIG } from './config.js';
import { MOBILE_STATE } from './state.js';

export function initTouchInput() {
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            MOBILE_STATE.touch.startX = e.touches[0].clientX - MOBILE_STATE.touch.currentX;
            MOBILE_STATE.touch.startY = e.touches[0].clientY - MOBILE_STATE.touch.currentY;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            // Tính toán khoảng cách dịch chuyển tương đối
            const deltaX = e.touches[0].clientX - MOBILE_STATE.touch.startX;
            const deltaY = e.touches[0].clientY - MOBILE_STATE.touch.startY;

            MOBILE_STATE.touch.currentX = deltaX;
            MOBILE_STATE.touch.currentY = deltaY;

            // Chuyển đổi tọa độ dịch chuyển thành góc xoay mục tiêu (Trục X xoay theo chiều dọc, Y theo chiều ngang)
            MOBILE_STATE.touch.targetY = deltaX * MOBILE_CONFIG.TOUCH_SENSITIVITY_X;
            
            let tempTargetX = -deltaY * MOBILE_CONFIG.TOUCH_SENSITIVITY_Y;
            // Áp đặt giới hạn góc nhìn dọc
            if (tempTargetX > MOBILE_CONFIG.LIMIT_ROTATION_X) tempTargetX = MOBILE_CONFIG.LIMIT_ROTATION_X;
            if (tempTargetX < -MOBILE_CONFIG.LIMIT_ROTATION_X) tempTargetX = -MOBILE_CONFIG.LIMIT_ROTATION_X;
            
            MOBILE_STATE.touch.targetX = tempTargetX;
        }
    }, { passive: true });
}
 
