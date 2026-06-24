/* js/mobile/state.js */
export const MOBILE_STATE = {
    // Tọa độ sinh ra từ hành vi vuốt chạm (Touch)
    touch: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        currentLerpX: 0,
        currentLerpy: 0
    },

    // Góc nghiêng sinh ra từ cảm biến Gyroscope
    gyro: {
        rawAlpha: 0,
        rawBeta: 0,
        rawGamma: 0,
        filteredX: 0,
        filteredY: 0,
        targetX: 0,
        targetY: 0,
        currentLerpX: 0,
        currentLerpY: 0
    },

    // Kiểm tra xem thiết bị đã được cấp quyền truy cập Gyroscope chưa (Yêu cầu bắt buộc từ iOS 13+)
    isGyroAuthorized: false
};
 
