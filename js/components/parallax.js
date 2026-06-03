// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    // Nhắm mục tiêu vào sân khấu 3D tổng để di chuyển ma trận Camera ảo VR
    this.stage = document.querySelector('.vr-stage');
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    
    // Hệ ma trận quản lý góc quay và tịnh tiến 360° thực tế ảo (VR Matrix States)
    this.cameraState = {
      targetX: 0,     // Góc xoay mục tiêu quanh trục Y (Trái / Phải)
      targetY: 0,     // Góc xoay mục tiêu quanh trục X (Lên / Xuống)
      currentX: 0,    // Góc xoay hiện tại sau khi khử răng cưa và nội suy
      currentY: 0,
      easingFactor: 0.18 // Tăng cường tốc độ phản hồi thời gian thực, triệt tiêu độ lia chậm
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Khởi động động cơ VR Panoramic Camera
  start() {
    this.bindEvents();
    // Kích hoạt vòng lặp kết xuất đồ họa đồng bộ tối đa với tần số quét của phần cứng (GPU)
    requestAnimationFrame(this.updateLoop);
  }

  // Đăng ký tương tác quay camera ảo
  bindEvents() {
    // 1. Quay góc nhìn bằng chuột trên máy tính (Desktop)
    window.addEventListener('mousemove', this.handleMouseMove);

    // 2. Quay góc nhìn tự nhiên bằng cách xoay/lia thiết bị phần cứng (Mobile Gyroscope)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Thuật toán lượng giác chuẩn hóa tọa độ chuột di chuyển từ tâm màn hình máy tính
  handleMouseMove(event) {
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    // Chuẩn hóa biên độ xoay góc rộng: Trái/Phải tối đa 35 độ, Lên/Xuống tối đa 25 độ
    this.cameraState.targetX = ((event.clientX - halfWidth) / halfWidth) * 35;
    this.cameraState.targetY = ((event.clientY - halfHeight) / halfHeight) * 25;
  }

  // Thuật toán lượng giác xử lý con quay hồi chuyển (Sửa dứt điểm lỗi lệch trục)
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    // Lấy thông số nghiêng Trái/Phải (Gamma) và Trước/Sau (Beta) từ cảm biến phần cứng
    let gamma = event.gamma || 0; 
    let beta = event.beta || 0;   

    // Thuật toán bù góc chết (Tư thế cầm máy nhìn tự nhiên của mắt người nghiêng góc 45 độ)
    let adjustedBeta = beta - 45;

    // Bộ lọc khử nhiễu động (Deadzone Noise Filter) - Bỏ qua rung lắc siêu nhỏ của tay người
    if (Math.abs(gamma) < 0.2) gamma = 0;
    if (Math.abs(adjustedBeta) < 0.2) adjustedBeta = 0;

    // Đọc thông số độ nhạy (Sensitivity) động từ Dashboard Settings để tính biên độ góc quay
    const sensX = this.config.hardware.gyroscope.sensitivityX;
    const sensY = this.config.hardware.gyroscope.sensitivityY;

    // Giới hạn biên độ dao động thực tế theo cấu hình để bảo vệ không gian, chống hở viền trống
    if (gamma > sensX) gamma = sensX;
    if (gamma < -sensX) gamma = -sensX;
    if (adjustedBeta > sensY) adjustedBeta = sensY;
    if (adjustedBeta < -sensY) adjustedBeta = -sensY;

    // Nhân hệ số khuếch đại góc nhìn rộng tương đương cấu trúc lồng cầu xoay VR
    this.cameraState.targetX = (gamma / sensX) * 40; 
    this.cameraState.targetY = (adjustedBeta / sensY) * 30;
  }

  // Bật/Tắt con quay hồi chuyển từ bảng điều khiển cài đặt Dashboard
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.cameraState.targetX = 0;
      this.cameraState.targetY = 0;
    }
  }

  // Vòng lặp tính toán và kết xuất ma trận 3D VR (Panoramic Render Loop)
  updateLoop() {
    const cam = this.cameraState;
    
    // Bộ lọc nội suy tuyến tính (Linear Interpolation) làm mịn chuyển dịch, triệt tiêu độ trễ
    cam.currentX += (cam.targetX - cam.currentX) * cam.easingFactor;
    cam.currentY += (cam.targetY - cam.currentY) * cam.easingFactor;

    // SỬA LỖI LỆCH TRỤC: Khóa cứng tâm xoay đồng nhất trên khung bọc vr-stage
    if (this.stage) {
      const rotateY = cam.currentX;     // Xoay toàn không gian quanh trục đứng Y (Nhìn Trái / Phải)
      const rotateX = -cam.currentY;    // Xoay toàn không gian quanh trục ngang X (Nhìn Lên / Xuống)

      // Thuật toán tịnh tiến mắt người nghịch đảo (Inverse Camera Translation) tạo thị sai chiều sâu chân thực
      const translateX = -cam.currentX * 0.8; // Giới hạn tịnh tiến nhỏ (tối đa 30px) để chống hở viền
      const translateY = -cam.currentY * 0.8;

      // Áp dụng đồng bộ một chuỗi ma trận duy nhất lên GPU phần cứng (Kích hoạt translate3d tăng tốc)
      // Việc gộp chung rotate và translate3d cố định điểm neo giúp triệt tiêu hoàn toàn khoảng trống đen lỗi của Chrome
      this.stage.style.transform = `
        translate3d(${translateX}px, ${translateY}px, 0px)
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
      `;
    }

    // Duy trì luồng đồ họa liên tục đồng bộ với tần số quét màn hình thiết bị
    requestAnimationFrame(this.updateLoop);
  }
}
