/* js/pc/transformer.js */
import { PC_CONFIG } from './config.js';
import { PC_STATE } from './state.js';

export function calculatePCTransforms() {
    // 1. Áp dụng thuật toán Lerp làm mượt dữ liệu di chuyển chuột
    PC_STATE.mouse.lerpX += (PC_STATE.mouse.targetX - PC_STATE.mouse.lerpX) * PC_CONFIG.SMOOTH_FACTOR;
    PC_STATE.mouse.lerpY += (PC_STATE.mouse.targetY - PC_STATE.mouse.lerpY) * PC_CONFIG.SMOOTH_FACTOR;

    // 2. Áp dụng thuật toán Lerp làm mượt dữ liệu cuộn chuột
    PC_STATE.scroll.lerpY += (PC_STATE.scroll.targetY - PC_STATE.scroll.lerpY) * PC_CONFIG.SMOOTH_FACTOR;

    // 3. Quy đổi dữ liệu chuột và cuộn thành góc xoay 3D của toàn bộ thế giới (World Container)
    let rotationX = -PC_STATE.mouse.lerpY * PC_CONFIG.LIMIT_ROTATION_X + (PC_STATE.scroll.lerpY * 0.05);
    let rotationY = PC_STATE.mouse.lerpX * 180; // Cho phép xoay ngang biên độ rộng hơn khi di chuột ra biên

    // Khóa góc xoay trục dọc (X) để tránh thế giới bị đảo ngược ngoài tầm mắt người nhìn
    if (rotationX > PC_CONFIG.LIMIT_ROTATION_X) rotationX = PC_CONFIG.LIMIT_ROTATION_X;
    if (rotationX < -PC_CONFIG.LIMIT_ROTATION_X) rotationX = -PC_CONFIG.LIMIT_ROTATION_X;

    // 4. Tính toán tọa độ tịnh tiến Parallax thị sai độc lập cho 3 tầng hộp dựa trên hệ số cấu hình
    const parallaxNearX = -PC_STATE.mouse.lerpX * PC_CONFIG.PARALLAX.NEAR.x;
    const parallaxNearY = -PC_STATE.mouse.lerpY * PC_CONFIG.PARALLAX.NEAR.y;

    const parallaxMediumX = -PC_STATE.mouse.lerpX * PC_CONFIG.PARALLAX.MEDIUM.x;
    const parallaxMediumY = -PC_STATE.mouse.lerpY * PC_CONFIG.PARALLAX.MEDIUM.y;

    const parallaxFarX = -PC_STATE.mouse.lerpX * PC_CONFIG.PARALLAX.FAR.x;
    const parallaxFarY = -PC_STATE.mouse.lerpY * PC_CONFIG.PARALLAX.FAR.y;

    // Trả về cấu trúc dữ liệu ma trận hoàn chỉnh để đẩy ra DOM hiển thị
    return {
        world: {
            rotX: rotationX,
            rotY: rotationY
        },
        layers: {
            near: { x: parallaxNearX, y: parallaxNearY },
            medium: { x: parallaxMediumX, y: parallaxMediumY },
            far: { x: parallaxFarX, y: parallaxFarY }
        }
    };
}
