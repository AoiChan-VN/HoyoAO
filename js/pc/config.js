/* js/pc/config.js */
export const PC_CONFIG = {
    // Tốc độ phản hồi và độ nhạy của chuột khi di chuyển góc nhìn
    MOUSE_SENSITIVITY_X: 0.05,
    MOUSE_SENSITIVITY_Y: 0.05,

    // Tốc độ phản hồi của bánh xe cuộn chuột (Scroll)
    SCROLL_SENSITIVITY: 0.1,

    // Hệ số nội suy mượt mà (Lerp) cho PC (Cân bằng giữa độ trễ và độ mượt 60fps+)
    SMOOTH_FACTOR: 0.05,

    // Giới hạn góc nhìn dọc (Trục X) tránh việc lật ngược góc nhìn camera (Đơn vị: độ)
    LIMIT_ROTATION_X: 85,

    /* 
       HỆ SỐ DỊCH CHUYỂN PARALLAX CHO TỪNG TẦNG KHÔNG GIAN (Đơn vị tính: Pixel)
       Tạo ra hiệu ứng thị sai: Gần di chuyển mạnh, xa di chuyển rất ít.
    */
    PARALLAX: {
        NEAR: { x: 80, y: 80 },     // Tầng gần: Chuyển động biên độ lớn để thấy rõ chiều sâu vật thể tiền cảnh
        MEDIUM: { x: 30, y: 30 },   // Tầng vừa: Chuyển động trung bình
        FAR: { x: 5, y: 5 }         // Tầng xa: Chuyển động cực nhỏ, tạo cảm giác vô tận của bầu trời/vũ trụ
    }
};
 
