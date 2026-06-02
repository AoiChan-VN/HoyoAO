// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    this.container = document.getElementById('parallax-container');
    this.layers = [];
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    
    // Quản lý trạng thái Camera ảo (Virtual Camera)
    this.cameraState = {
      targetX: 0,    // Tọa độ mục tiêu của Camera ảo
      targetY: 0,
      currentX: 0,   // Tọa độ hiện tại sau khi tính độ trễ (Easing)
      currentY: 0,
      easingFactor: 0.05 // Tạo độ mượt như ống kính Camera thật khi di chuyển
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Khởi động hệ thống Virtual Camera
  start() {
    this.cacheLayers();
    this.bindEvents();
    requestAnimationFrame(this.updateLoop);
  }

  // Khởi tạo các lớp Layer theo cấu hình Data-Driven
  cacheLayers() {
    this.config.parallaxLayers.forEach(layerData => {
      const element = document.getElementById(`layer-${layerData.id}`);
      if (element) {
        this.layers.push({
          element: element,
          depth: layerData.depth, // Chiều sâu Z-index trong không gian
          speedX: layerData.speedX,
          speedY: layerData.speedY
        });
      }
    });
  }

  // Lắng nghe tương tác điều khiển góc nhìn Camera
  bindEvents() {
    // Di chuột để quay góc nhìn Camera ảo (Desktop)
    window.addEventListener('mousemove', this.handleMouseMove);

    // Nghiêng thiết bị để quay góc nhìn Camera ảo (Mobile Gyroscope)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Điều khiển Camera ảo bằng chuột (Tính từ tâm màn hình ra các rìa)
  handleMouseMove(event) {
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    // Chuẩn hóa biên độ góc nhìn từ -1 đến 1
    this.cameraState.targetX = (event.clientX - halfWidth) / halfWidth;
    this.cameraState.targetY = (event.clientY - halfHeight) / halfHeight;
  }

  // Điều khiển Camera ảo bằng Con quay hồi chuyển (Gyroscope)
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    const sensX = this.config.hardware.gyroscope.sensitivityX;
    const sensY = this.config.hardware.gyroscope.sensitivityY;

    let gamma = event.gamma || 0; // Nghiêng trái/phải
    let beta = event.beta || 0;   // Nghiêng trước/sau

    // Giới hạn biên độ theo cấu hình hệ thống
    if (gamma > sensX) gamma = sensX;
    if (gamma < -sensX) gamma = -sensX;
    if (beta > sensY) beta = sensY;
    if (beta < -sensY) beta = -sensY;

    this.cameraState.targetX = gamma / sensX;
    this.cameraState.targetY = beta / sensY;
  }

  // Bật/Tắt con quay hồi chuyển từ Menu Settings
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.cameraState.targetX = 0;
      this.cameraState.targetY = 0;
    }
  }

  // Vòng lặp giả lập Ma trận Camera 3D Perspective (Render Loop)
  updateLoop() {
    const cam = this.cameraState;
    
    // Công thức nội suy tuyến tính (Lerp) tạo hiệu ứng ống kính Camera lướt mượt mà
    cam.currentX += (cam.targetX - cam.currentX) * cam.easingFactor;
    cam.currentY += (cam.targetY - cam.currentY) * cam.easingFactor;

    // 1. Tác động hiệu ứng quay lên toàn bộ khung chứa (Khung hình Camera ảo)
    if (this.container) {
      const rotateY = cam.currentX * 10;  // Quay Camera quanh trục Y (Tối đa 10 độ)
      const rotateX = -cam.currentY * 10; // Quay Camera quanh trục X (Tối đa 10 độ)
      
      // Tạo hiệu ứng phối cảnh 3D Camera góc rộng bằng cách xoay Container
      this.container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    // 2. Tịnh tiến các Layer độc lập dựa trên Depth để giả lập tiêu cự xa gần (Parallax)
    this.layers.forEach(layer => {
      // Càng ở xa (depth nhỏ) hoặc gần (depth lớn), độ dịch chuyển ma trận càng khác nhau
      const moveX = cam.currentX * layer.speedX * (layer.depth * 15);
      const moveY = cam.currentY * layer.speedY * (layer.depth * 15);

      // Ép phần cứng GPU xử lý translate3d mượt mà
      layer.element.style.transform = `translate3d(${moveX}px, ${moveY}px, ${layer.depth * 10}px)`;
    });

    // Duy trì vòng lặp đồ họa
    requestAnimationFrame(this.updateLoop);
  }
}
 
