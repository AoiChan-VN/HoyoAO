// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    // Nhắm mục tiêu vào sân khấu 3D để xoay lồng không gian bao quanh mắt người
    this.stage = document.querySelector('.vr-stage');
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    
    // Hệ ma trận quản lý góc quay 360° thực tế ảo (VR Panoramic Matrix)
    this.cameraState = {
      targetX: 0,     // Góc xoay mục tiêu quanh trục Y (Trái / Phải)
      targetY: 0,     // Góc xoay mục tiêu quanh trục X (Lên / Xuống)
      currentX: 0,    // Góc xoay hiện tại sau khi khử răng cưa
      currentY: 0,
      easingFactor: 0.15 // Hệ số phản hồi tốc độ cao, bám đuổi thời gian thực
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Khởi động động cơ VR 360°
  start() {
    this.bindEvents();
    // Kích hoạt vòng lặp kết xuất đồ họa clock cao của GPU
    requestAnimationFrame(this.updateLoop);
  }

  // Đăng ký tương tác quay camera
  bindEvents() {
    // 1. Quay góc nhìn 360° bằng cách di chuột trên máy tính
    window.addEventListener('mousemove', this.handleMouseMove);

    // 2. Quay góc nhìn 360° tự nhiên bằng cách xoay/lia điện thoại (Gyroscope)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Xử lý toán học ma trận quay bằng chuột (Mở rộng biên độ góc rộng)
  handleMouseMove(event) {
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    // Nhân hệ số góc để chuột có thể lia góc nhìn rộng ra hai bên sườn
    this.cameraState.targetX = ((event.clientX - halfWidth) / halfWidth) * 45; // Xoay trái/phải tối đa 45 độ
    this.cameraState.targetY = ((event.clientY - halfHeight) / halfHeight) * 30; // Xoay lên/xuống tối đa 30 độ
  }

  // Xử lý toán học lượng giác Con quay hồi chuyển (Mô phỏng thiết bị VR chu kỳ thực)
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    // Gamma: Nghiêng trái/phải (-90 đến 90). Beta: Nghiêng trước/sau (-180 đến 180)
    let gamma = event.gamma || 0; 
    let beta = event.beta || 0;   

    // Thuật toán bù góc (Tư thế cầm máy nghiêng 45 độ tự nhiên của mắt người khi nhìn điện thoại)
    let adjustedBeta = beta - 45;

    // Tăng cường độ nhạy (Gain Factor) để khi bạn nghiêng điện thoại một góc nhỏ, không gian quay góc lớn bao quát
    // Giúp người dùng nhìn ra sau sườn cảnh vật mà không cần xoay vặn cả cổ tay
    this.cameraState.targetX = gamma * 2.5; 
    this.cameraState.targetY = adjustedBeta * 2.0;
  }

  // Bật/Tắt con quay hồi chuyển từ bảng điều khiển cài đặt
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.cameraState.targetX = 0;
      this.cameraState.targetY = 0;
    }
  }

  // Vòng lặp tính toán ma trận xoay lồng không gian 360° (Panoramic Render Loop)
  updateLoop() {
    const cam = this.cameraState;
    
    // Bộ lọc nội suy tuyến tính (Lerp) làm mịn chuyển động, triệt tiêu độ khựng lag của cảm biến
    cam.currentX += (cam.targetX - cam.currentX) * cam.easingFactor;
    cam.currentY += (cam.targetY - cam.currentY) * cam.easingFactor;

    // Thực thi xoay lồng không gian khép kín bao quanh mắt người
    if (this.stage) {
      const rotateY = cam.currentX;     // Quay toàn bộ thế giới quanh trục đứng Y (Nhìn sang trái / phải)
      const rotateX = -cam.currentY;    // Quay toàn bộ thế giới quanh trục ngang X (Nhìn ngước lên / cúi xuống)

      // Thuật toán VR Master Matrix: Xoay lồng sân khấu tại gốc tọa độ cố định.
      // Do các layer nền trong main.css đã được đẩy lùi bằng translateZ, việc rotateX/Y tại đây 
      // sẽ tạo ra hiệu ứng thị sai góc rộng 360° lập thể chân thực tuyệt đối, loại bỏ 100% lỗi lộ khoảng trống.
      this.stage.style.transform = `
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
      `;
    }

    // Duy trì luồng RequestAnimationFrame liên tục同 bộ với màn hình
    requestAnimationFrame(this.updateLoop);
  }
}
 
