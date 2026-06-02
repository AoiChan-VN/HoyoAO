// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    this.container = document.getElementById('parallax-container');
    this.layers = [];
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    
    // Quản lý trạng thái Camera ảo (Virtual Camera Matrix)
    this.cameraState = {
      targetX: 0,    // Tọa độ đích của Camera ảo (-1 đến 1)
      targetY: 0,
      currentX: 0,   // Tọa độ mượt hiện tại sau khi tính nội suy (Lerp)
      currentY: 0,
      easingFactor: 0.06 // Hệ số mượt chuyển dịch góc kính Camera
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Kích hoạt động cơ đồ họa
  start() {
    this.cacheLayers();
    this.bindEvents();
    // Khởi chạy vòng lặp đồ họa RequestAnimationFrame tối ưu xung nhịp GPU
    requestAnimationFrame(this.updateLoop);
  }

  // Ánh xạ các thành phần DOM từ cấu hình cấu trúc Data-Driven
  cacheLayers() {
    this.config.parallaxLayers.forEach(layerData => {
      const element = document.getElementById(`layer-${layerData.id}`);
      if (element) {
        this.layers.push({
          element: element,
          depth: layerData.depth,
          speedX: layerData.speedX,
          speedY: layerData.speedY
        });
      }
    });
  }

  // Đăng ký bộ lắng nghe cảm biến hệ thống
  bindEvents() {
    // Điều khiển hướng ống kính Camera bằng di chuột (Desktop)
    window.addEventListener('mousemove', this.handleMouseMove);

    // Điều khiển hướng ống kính Camera bằng cảm biến độ nghiêng phần cứng (Mobile Gyro)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Thuật toán chuẩn hóa tọa độ chuột từ tâm màn hình
  handleMouseMove(event) {
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    this.cameraState.targetX = (event.clientX - halfWidth) / halfWidth;
    this.cameraState.targetY = (event.clientY - halfHeight) / halfHeight;
  }

  // Thuật toán chuẩn hóa góc nghiêng từ con quay hồi chuyển phần cứng
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    const sensX = this.config.hardware.gyroscope.sensitivityX;
    const sensY = this.config.hardware.gyroscope.sensitivityY;

    let gamma = event.gamma || 0; // Trục nghiêng Ngang (-90 đến 90)
    let beta = event.beta || 0;   // Trục nghiêng Dọc (-180 đến 180)

    // Khóa biên độ dao động tối đa theo thông số cấu hình hệ thống
    if (gamma > sensX) gamma = sensX;
    if (gamma < -sensX) gamma = -sensX;
    if (beta > sensY) beta = sensY;
    if (beta < -sensY) beta = -sensY;

    this.cameraState.targetX = gamma / sensX;
    this.cameraState.targetY = beta / sensY;
  }

  // Nhận lệnh Bật/Tắt cảm biến từ Settings Panel để giải phóng bộ nhớ điều khiển
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.cameraState.targetX = 0;
      this.cameraState.targetY = 0;
    }
  }

  // Vòng lặp kết xuất đồ họa ma trận phối cảnh không nợ kỹ thuật (Render Loop)
  updateLoop() {
    const cam = this.cameraState;
    
    // Thuật toán nội suy tuyến tính (Linear Interpolation) khử triệt để hiện tượng rung giật tần số quét
    cam.currentX += (cam.targetX - cam.currentX) * cam.easingFactor;
    cam.currentY += (cam.targetY - cam.currentY) * cam.easingFactor;

    // 1. Áp dụng ma trận xoay góc nhìn Camera lên toàn bộ khung chứa phối cảnh
    if (this.container) {
      const rotateY = cam.currentX * 6;   // Xoay Camera quanh trục đứng Y (Tối đa 6 độ)
      const rotateX = -cam.currentY * 6;  // Xoay Camera quanh trục ngang X (Tối đa 6 độ)
      
      // Đồng bộ hóa không gian 3D giúp các layer con giữ nguyên chiều sâu hình ảnh
      this.container.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    // 2. Di chuyển tịnh tiến các Layer ảnh thật độc lập để giả lập hiệu ứng tiêu cự xa gần
    this.layers.forEach(layer => {
      // Biên độ dịch chuyển tính toán dựa trên tích số của Speed và Depth lớp cấu hình
      const moveX = cam.currentX * layer.speedX * (layer.depth * 12);
      const moveY = cam.currentY * layer.speedY * (layer.depth * 12);

      // Sử dụng translate3d để kích hoạt trực tiếp nhân xử lý đồ họa GPU của thiết bị
      layer.element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0px)`;
    });

    // Duy trì luồng RequestAnimationFrame liên tục
    requestAnimationFrame(this.updateLoop);
  }
}
 
