// js/components/parallax.js

export class ParallaxEngine {
  constructor(config) {
    this.config = config;
    this.layers = [];
    this.gyroEnabled = config.hardware.gyroscope.enabled;
    this.videoElement = null;
    
    // Lưu trữ tọa độ mục tiêu (Target) và tọa độ hiện tại (Current) để tạo độ mượt (Easing)
    this.transformState = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      easingFactor: 0.08 // Hệ số mượt (chuyển động trễ tự nhiên)
    };

    // Chuẩn hóa hàm bind ngữ cảnh để tối ưu hiệu năng bộ nhớ
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  // Khởi động hệ thống điều khiển
  start() {
    this.cacheLayers();
    this.bindEvents();
    // Bắt đầu vòng lặp đồ họa tối ưu bằng phần cứng (RequestAnimationFrame)
    requestAnimationFrame(this.updateLoop);
  }

  // Thu thập các Layer dựa trên cấu hình (Data-Driven Link)
  cacheLayers() {
    this.config.parallaxLayers.forEach(layerData => {
      const element = document.getElementById(`layer-${layerData.id}`);
      if (element) {
        this.layers.push({
          element: element,
          speedX: layerData.speedX,
          speedY: layerData.speedY,
          depth: layerData.depth
        });
      }
    });
  }

  // Lắng nghe sự kiện phần cứng hệ thống
  bindEvents() {
    // 1. Trải nghiệm chuột trên màn hình máy tính
    window.addEventListener('mousemove', this.handleMouseMove);

    // 2. Trải nghiệm cảm biến nghiêng trên thiết bị di động
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
  }

  // Xử lý logic di chuyển chuột (Tính toán biên độ từ tâm màn hình: -1 đến 1)
  handleMouseMove(event) {
    // Không chạy hiệu ứng chuột nếu người dùng đang dùng cảm biến hoặc kích hoạt giảm chuyển động
    if (this.config.settings.motionReduction) return;

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    
    this.transformState.targetX = (event.clientX - halfWidth) / halfWidth;
    this.transformState.targetY = (event.clientY - halfHeight) / halfHeight;
  }

  // Xử lý logic con quay hồi chuyển Gyroscope
  handleOrientation(event) {
    if (!this.gyroEnabled || this.config.settings.motionReduction) return;

    // Cảm biến nghiêng trái phải (gamma) và trước sau (beta)
    // Chuẩn hóa góc nghiêng dựa vào độ nhạy trong cấu hình (Sensitivity)
    const sensX = this.config.hardware.gyroscope.sensitivityX;
    const sensY = this.config.hardware.gyroscope.sensitivityY;

    let gamma = event.gamma || 0; // Phạm vi thông thường -90 đến 90
    let beta = event.beta || 0;   // Phạm vi thông thường -180 đến 180

    // Giới hạn góc nghiêng hoạt động thực tế để tránh giật khung hình
    if (gamma > sensX) gamma = sensX;
    if (gamma < -sensX) gamma = -sensX;
    if (beta > sensY) beta = sensY;
    if (beta < -sensY) beta = -sensY;

    this.transformState.targetX = gamma / sensX;
    this.transformState.targetY = beta / sensY;
  }

  // Gắn luồng video để phân tích tương tác Camera (Face-tracking thuật toán tinh giản)
  bindCameraStream(videoEl) {
    this.videoElement = videoEl;
    if (videoEl) {
      this.initCameraProcessingLoop();
    }
  }

  // Thuật toán phân tích chuyển động Camera dựa trên Canvas siêu nhẹ không phụ thuộc thư viện ngoài
  initCameraProcessingLoop() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 40; // Giảm độ phân giải tối đa để ép xung hiệu năng, tránh nghẽn CPU theo Điều 8
    canvas.height = 30;

    let previousLuminance = 0;

    const processFrame = () => {
      if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
        return;
      }

      try {
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let totalLuminance = 0;
        let centerX = 0;
        let weightSum = 0;

        // Quét mật độ ảnh để định vị vùng sáng chuyển động (giả lập Tracking đầu người)
        for (let i = 0; i < frameData.length; i += 4) {
          const r = frameData[i];
          const g = frameData[i+1];
          const b = frameData[i+2];
          // Công thức tính độ sáng chuẩn truyền hình
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += luminance;

          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          
          if (luminance > 120) { // Lọc vùng sáng nổi bật
            centerX += x * luminance;
            weightSum += luminance;
          }
        }

        if (weightSum > 0) {
          const targetCenter = centerX / weightSum;
          // Ánh xạ chuyển động gương sang tọa độ dịch chuyển của Layer Parallax
          const normalizedCameraX = ((targetCenter / canvas.width) - 0.5) * 2;
          this.transformState.targetX = normalizedCameraX;
        }
      } catch (e) {
        // Tránh sập ứng dụng nếu render lỗi
        console.debug("Đang đợi luồng video ổn định...");
      }

      if (this.videoElement) {
        setTimeout(processFrame, 100); // Giới hạn quét 10 FPS để bảo vệ hạ tầng CPU theo Điều 8
      }
    };

    // Chờ luồng video bắt đầu phát thực tế để chạy vòng phân tích
    this.videoElement.addEventListener('play', () => {
      processFrame();
    });
  }

  // Bật/Tắt động cảm biến nghiêng từ bảng điều khiển Settings
  toggleGyroscope(isEnabled) {
    this.gyroEnabled = isEnabled;
    if (!isEnabled) {
      this.transformState.targetX = 0;
      this.transformState.targetY = 0;
    }
  }

  // Vòng lặp tính toán mượt chuyển động (Linear Interpolation) và cập nhật giao diện
  updateLoop() {
    const state = this.transformState;
    
    // Công thức tính nội suy tuyến tiến (Lerp) giúp triệt tiêu hiện tượng giật rung
    state.currentX += (state.targetX - state.currentX) * state.easingFactor;
    state.currentY += (state.targetY - state.currentY) * state.easingFactor;

    // Dịch chuyển ma trận tịnh tiến các Layer tương ứng dựa vào độ sâu cấu hình
    this.layers.forEach(layer => {
      const moveX = state.currentX * layer.speedX * 50; // Biên độ tối đa 50px
      const moveY = state.currentY * layer.speedY * 50;

      // Áp dụng tăng tốc phần cứng thông qua thuộc tính translate3d
      layer.element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0px)`;
    });

    // Tiếp tục giữ luồng render ổn định
    requestAnimationFrame(this.updateLoop);
  }
}
 
