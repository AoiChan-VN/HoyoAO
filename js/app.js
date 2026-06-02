// js/app.js
import { SITE_CONFIG } from '../data/config.js';

class AppController {
  constructor() {
    this.config = SITE_CONFIG;
    this.domElements = {};
    this.parallaxModule = null;
    this.stream = null;
  }

  // Khởi tạo ứng dụng
  async init() {
    this.cacheDOM();
    this.renderDataDrivenUI();
    this.initLocalTheme();
    this.bindEvents();
    await this.initParallaxEngine();
  }

  // Lưu vết các thành phần DOM quan trọng
  cacheDOM() {
    this.domElements = {
      html: document.documentElement,
      logo: document.getElementById('site-logo'),
      navList: document.getElementById('nav-list'),
      settingsToggle: document.getElementById('settings-toggle'),
      settingsPanel: document.getElementById('settings-panel'),
      themeSelect: document.getElementById('theme-select'),
      cameraSwitch: document.getElementById('camera-switch'),
      gyroSwitch: document.getElementById('gyro-switch'),
      cameraViewport: document.getElementById('camera-viewport'),
      webcamStream: document.getElementById('webcam-stream'),
      hardwareAuthBtn: document.getElementById('hardware-auth-btn'),
      heroTitle: document.getElementById('hero-title')
    };
  }

  // Render giao diện tự động dựa trên dữ liệu cấu hình (Data-Driven)
  renderDataDrivenUI() {
    // 1. Cập nhật thông tin thương hiệu
    if (this.domElements.logo) {
      this.domElements.logo.textContent = this.config.brand.logoText;
      this.domElements.logo.href = this.config.brand.logoUrl;
    }
    if (this.domElements.heroTitle) {
      this.domElements.heroTitle.textContent = this.config.brand.title;
    }

    // 2. Render danh sách Menu Điều Hướng (MPA)
    if (this.domElements.navList) {
      this.domElements.navList.innerHTML = this.config.navigation
        .map(nav => {
          // Kiểm tra trang hiện tại để gán class active cho liên kết
          const isCurrentPage = window.location.pathname.endsWith(nav.path) || 
                                (window.location.pathname === '/' && nav.path === 'index.html');
          const activeClass = isCurrentPage ? 'class="active"' : '';
          return `<li><a href="${nav.path}" ${activeClass}>${nav.label}</a></li>`;
        })
        .join('');
    }

    // 3. Render danh sách Lựa chọn Giao diện (Theme Options)
    if (this.domElements.themeSelect) {
      this.domElements.themeSelect.innerHTML = this.config.settings.themes
        .map(theme => `<option value="${theme}">${theme.toUpperCase()}</option>`)
        .join('');
    }

    // 4. Đồng bộ trạng thái checkbox với cấu hình mặc định
    if (this.domElements.gyroSwitch) {
      this.domElements.gyroSwitch.checked = this.config.hardware.gyroscope.enabled;
    }
    if (this.domElements.cameraSwitch) {
      this.domElements.cameraSwitch.checked = this.config.hardware.camera.enabled;
    }
  }

  // Khởi tạo và thiết lập Theme ban đầu từ LocalStorage hoặc Cấu hình
  initLocalTheme() {
    const savedTheme = localStorage.getItem('pure_theme') || this.config.settings.defaultTheme;
    this.domElements.html.setAttribute('data-theme', savedTheme);
    if (this.domElements.themeSelect) {
      this.domElements.themeSelect.value = savedTheme;
    }
  }

  // Lắng nghe và xử lý sự kiện người dùng
  bindEvents() {
    // Đóng mở Settings Panel
    this.domElements.settingsToggle?.addEventListener('click', () => {
      this.domElements.settingsPanel?.classList.toggle('hidden');
    });

    // Thay đổi Giao diện (Theme Changer)
    this.domElements.themeSelect?.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      this.domElements.html.setAttribute('data-theme', selectedTheme);
      localStorage.setItem('pure_theme', selectedTheme);
    });

    // Xử lý Bật/Tắt Cảm biến Nghiêng (Gyroscope Switch)
    this.domElements.gyroSwitch?.addEventListener('change', (e) => {
      if (this.parallaxModule) {
        this.parallaxModule.toggleGyroscope(e.target.checked);
      }
    });

    // Xử lý Bật/Tắt Camera Tương Tác (Camera Switch)
    this.domElements.cameraSwitch?.addEventListener('change', (e) => {
      this.toggleCameraHardware(e.target.checked);
    });

    // Nút yêu cầu cấp quyền phần cứng khẩn cấp trên giao diện Hero
    this.domElements.hardwareAuthBtn?.addEventListener('click', () => {
      this.requestHardwarePermissions();
    });
  }

  // Khởi động module chuyển động Parallax bất đồng bộ
  async initParallaxEngine() {
    try {
      const { ParallaxEngine } = await import('./components/parallax.js');
      this.parallaxModule = new ParallaxEngine(this.config);
      this.parallaxModule.start();
    } catch (error) {
      console.error("Không thể khởi chạy hệ thống Parallax:", error);
    }
  }

  // Hàm xử lý kích hoạt hoặc giải phóng luồng Camera phần cứng
  async toggleCameraHardware(shouldEnable) {
    if (shouldEnable) {
      try {
        const constraints = this.config.hardware.camera.constraints;
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (this.domElements.webcamStream) {
          this.domElements.webcamStream.srcObject = this.stream;
        }
        this.domElements.cameraViewport?.classList.remove('hidden');
        
        // Gắn luồng video sang module Parallax để xử lý tracking nếu cần
        if (this.parallaxModule) {
          this.parallaxModule.bindCameraStream(this.domElements.webcamStream);
        }
      } catch (err) {
        console.error("Truy cập Camera bị từ chối hoặc không hỗ trợ:", err);
        if (this.domElements.cameraSwitch) this.domElements.cameraSwitch.checked = false;
        alert("Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị.");
      }
    } else {
      // Giải phóng luồng phần cứng để tiết kiệm năng lượng hệ thống
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      this.domElements.cameraViewport?.classList.add('hidden');
      if (this.parallaxModule) {
        this.parallaxModule.bindCameraStream(null);
      }
    }
  }

  // Yêu cầu quyền truy cập cho cả Camera và Thiết bị cảm biến hướng (iOS/Android)
  async requestHardwarePermissions() {
    // 1. Kích hoạt thử camera
    this.toggleCameraHardware(true).then(() => {
      if (this.domElements.cameraSwitch) this.domElements.cameraSwitch.checked = true;
    });

    // 2. Yêu cầu quyền DeviceOrientation đối với thiết bị iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted' && this.domElements.gyroSwitch) {
          this.domElements.gyroSwitch.checked = true;
          this.parallaxModule?.toggleGyroscope(true);
        }
      } catch (error) {
        console.error("Lỗi yêu cầu quyền cảm biến hướng thiết bị:", error);
      }
    }
  }
}

// Khởi chạy ứng dụng ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
 
