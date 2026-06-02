// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    // Nhắm mục tiêu vào sân khấu 3D tổng để di chuyển Camera ảo
    this.stage = document.querySelector('.vr-stage');
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    
    // Ma trận quản lý ống kính Camera ảo thực tế ảo (VR Camera Matrix)
    this.cameraState = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      // Tăng tốc hệ số nhạy lên 0.25 (Gấp 5 lần cũ) để triệt tiêu hiện tượng lia chậm, phản hồi tức thì
      easingFactor: 0.25 
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Khởi động động cơ VR Camera
  start() {
    this.bindEvents();
    // Kích hoạt vòng lặp đồ họa clock tối đa của phần cứng
    requestAnimationFrame(this.updateLoop);
  }

  // Đăng ký tương tác điều khiển góc nhìn
  bindEvents() {
    // 1. Trải nghiệm lướt mượt bằng chuột trên Desktop
    window.addEventListener('mousemove', this.handleMouseMove);

    // 2. Trải nghiệm liệng góc nhìn VR thời gian thực bằng Gyroscope (Mobile)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Chuẩn hóa tọa độ chuột từ tâm màn hình máy tính
  handleMouseMove(event) {
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    // Tăng biên độ góc nhìn từ -1.5 đến 1.5 để tăng cảm giác chìm đắm không gian rộng
    this.cameraState.targetX = ((event.clientX - halfWidth) / halfWidth) * 1.5;
    this.cameraState.targetY = ((event.clientY - halfHeight) / halfHeight) * 1.5;
  }

  // Xử lý toán học cảm biến hướng độ nghiêng phần cứng (Gyro)
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    // Lấy góc nghiêng trục ngang (Gamma) và trục dọc (Beta) từ thiết bị phần cứng
    let gamma = event.gamma || 0; 
    let beta = event.beta || 0;   

    // Thiết lập vùng chết động (Dynamic Deadzone Filter) nhằm loại bỏ hiện tượng nhiễu/bị rung nhẹ của phần cứng cảm biến
    if (Math.abs(gamma) < 0.2) gamma = 0;
    if (Math.abs(beta) < 0.2) beta = 0;

    // Chuẩn hóa góc nghiêng dựa vào độ nhạy cấu hình và nhân hệ số khuếch đại góc nhìn không gian
    const sensX = this.config.hardware.gyroscope.sensitivityX;
    const sensY = this.config.hardware.gyroscope.sensitivityY;

    // Chuyển dịch góc lia nhanh tương đương chuyển động lắc đầu trong môi trường VR
    this.cameraState.targetX = (gamma / sensX) * 1.8;
    this.cameraState.targetY = ((beta - 45) / sensY) * 1.8; // Trừ đi góc 45 độ - Tư thế cầm điện thoại nhìn tự nhiên của người dùng
  }

  // Bật/Tắt cảm biến từ Settings Panel
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.cameraState.targetX = 0;
      this.cameraState.targetY = 0;
    }
  }

  // Vòng lặp kết xuất đồ họa ma trận 3D VR (Render Loop)
  updateLoop() {
    const cam = this.cameraState;
    
    // Công thức nội suy tăng tốc phản hồi thời gian thực
    cam.currentX += (cam.targetX - cam.currentX) * cam.easingFactor;
    cam.currentY += (cam.targetY - cam.currentY) * cam.easingFactor;

    // Nếu tìm thấy sân khấu 3D, tiến hành tịnh tiến toàn bộ hệ không gian để tạo hiệu ứng thị sai lập thể VR
    if (this.stage) {
      // 1. Tính toán góc quay Camera quanh hai trục X và Y
      const rotateY = cam.currentX * 15;  // Quay Camera theo phương ngang (Tối đa 15 độ)
      const rotateX = -cam.currentY * 15; // Quay Camera theo phương dọc (Tối đa 15 độ)

      // 2. Tính toán tịnh tiến vị trí mắt người (Camera Translate) tạo hiệu ứng dịch chuyển vật lý trong không gian
      const translateX = -cam.currentX * 40; // Di chuyển Camera sang trái/phải 40px
      const translateY = -cam.currentY * 40; // Di chuyển Camera lên/xuống 40px

      // 3. Áp dụng đồng thời ma trận biến đổi lập thể lên sân khấu 3D tổng
      // Việc gộp chung vào 1 lệnh ma trận duy nhất trên vr-stage giúp GPU kết xuất mượt mà, không bao giờ bị hở viền trống
      this.stage.style.transform = `
        translate3d(${translateX}px, ${translateY}px, 0px)
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
      `;
    }

    // Duy trì luồng render liên tục đồng bộ với tần số quét màn hình
    requestAnimationFrame(this.updateLoop);
  }
}
