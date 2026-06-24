/* js/mobile/transformer.js */
import { MOBILE_CONFIG } from './config.js';
import { MOBILE_STATE } from './state.js';

export function calculateMobileTransforms() {
    // Thực hiện thuật toán làm mượt Lerp cho thành phần vuốt chạm
    MOBILE_STATE.touch.currentLerpX += (MOBILE_STATE.touch.targetX - MOBILE_STATE.touch.currentLerpX) * MOBILE_CONFIG.SMOOTH_FACTOR;
    MOBILE_STATE.touch.currentLerpY += (MOBILE_STATE.touch.targetY - MOBILE_STATE.touch.currentLerpY) * MOBILE_CONFIG.SMOOTH_FACTOR;

    // Thực hiện thuật toán làm mượt Lerp cho thành phần cảm biến Gyro
    MOBILE_STATE.gyro.currentLerpX += (MOBILE_STATE.gyro.targetX - MOBILE_STATE.gyro.currentLerpX) * MOBILE_CONFIG.SMOOTH_FACTOR;
    MOBILE_STATE.gyro.currentLerpY += (MOBILE_STATE.gyro.targetY - MOBILE_STATE.gyro.currentLerpY) * MOBILE_CONFIG.SMOOTH_FACTOR;

    // Trả về kết quả tổng hợp góc xoay cuối cùng
    return {
        rotationX: MOBILE_STATE.touch.currentLerpX + MOBILE_STATE.gyro.currentLerpX,
        rotationY: MOBILE_STATE.touch.currentLerpY + MOBILE_STATE.gyro.currentLerpY
    };
}
 
