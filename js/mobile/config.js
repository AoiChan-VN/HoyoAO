/* js/mobile/config.js */
export const MOBILE_CONFIG = {
    // Độ nhạy của thao tác vuốt chạm trên màn hình
    TOUCH_SENSITIVITY_X: 0.15,
    TOUCH_SENSITIVITY_Y: 0.15,

    // Độ nhạy của cảm biến nghiêng Gyroscope
    GYRO_SENSITIVITY_X: 0.25,
    GYRO_SENSITIVITY_Y: 0.25,

    // Tỷ lệ nội suy tuyến tính (Lerp) dùng để làm mượt chuyển động (Càng nhỏ càng mượt nhưng có độ trễ)
    SMOOTH_FACTOR: 0.08,

    // Bộ lọc nhiễu Gyroscope (Low-pass filter coefficient) - Chống rung góc nhìn
    GYRO_FILTER: 0.2,

    // Giới hạn góc quay theo trục X (Lên/Xuống) tránh việc lật ngược thế giới (Đơn vị: độ)
    LIMIT_ROTATION_X: 75
};
 
