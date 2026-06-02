// js/app.js
import { SITE_CONFIG } from '../data/config.js';

class AppController {
  constructor() {
    this.config = SITE_CONFIG;
    this.domElements = {};
    this.parallaxModule = null;
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
      gyroSwitch: document.getElementById('gyro-switch'),
      hardwareAuthBtn: document.getElementById('hardware-auth-btn'),
      heroTitle: document.getElementById('hero-title')
    };
  }

  // Render giao diện tự động từ dữ liệu cấu hình (Data-Driven)
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

    // Nút kích hoạt khẩn cấp quyền cảm biến hướng (Dành riêng cho thiết bị iOS)
    this.domElements.hardwareAuthBtn?.addEventListener('click', () => {
      this.requestGyroscopePermission();
    });
  }

  // Khởi động module chuyển động Virtual Camera Parallax bất đồng bộ
  async initParallaxEngine() {
    try {
      const { ParallaxEngine } = await import('./components/parallax.js');
      this.parallaxModule = new ParallaxEngine(this.config);
      this.parallaxModule.start();
    } catch (error) {
      console.error("Không thể khởi chạy hệ thống Virtual Camera Parallax:", error);
    }
  }

  // Yêu cầu quyền truy cập con quay hồi chuyển phần cứng đặc thù cho thiết bị di động Apple (iOS 13+)
  async requestGyroscopePermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          if (this.domElements.gyroSwitch) this.domElements.gyroSwitch.checked = true;
          this.parallaxModule?.toggleGyroscope(true);
        } else {
          alert("Quyền truy cập cảm biến bị từ chối.");
        }
      } catch (error) {
        console.error("Lỗi yêu cầu quyền cảm biến hướng thiết bị:", error);
      }
    } else {
      alert("Thiết bị hoặc trình duyệt của bạn kích hoạt sẵn cảm biến hướng (không cần cấp quyền thủ công).");
    }
  }
}

// Khởi chạy ứng dụng ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
 
