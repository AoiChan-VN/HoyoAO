// js/app.js
import { SITE_CONFIG } from '../data/config.js';
import { StateManager, MarkdownParser } from './utils/helpers.js';

class AppController {
  constructor() {
    this.config = SITE_CONFIG;
    this.domElements = {};
    this.parallaxModule = null;
    this.assetsData = null;
    this.articlesData = null;
  }

  // Khởi tạo toàn bộ hệ thống ứng dụng
  async init() {
    this.cacheDOM();
    this.initSavedState(); // Đồng bộ trạng thái lưu trữ trước khi render UI (Sửa lỗi số 3)
    this.renderStaticUI();
    
    // Nạp dữ liệu động từ các tệp Manifest (Tách biệt Hardcode theo Điều 5)
    await this.loadDynamicManifests();
    
    this.bindEvents();
    await this.initParallaxEngine();
  }

  // Lưu vết các phần tử DOM cố định
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
      heroTitle: document.getElementById('hero-title'),
      heroSubtitle: document.getElementById('hero-subtitle'),
      parallaxContainer: document.getElementById('parallax-container')
    };
  }

  // Đồng bộ và khôi phục trạng thái cài đặt xuyên trang từ LocalStorage (Sửa lỗi số 3)
  initSavedState() {
    const savedTheme = StateManager.load('theme', this.config.settings.defaultTheme);
    const savedGyro = StateManager.load('gyro_enabled', this.config.hardware.gyroscope.enabled);

    // Áp dụng trực tiếp vào hệ thống
    this.domElements.html.setAttribute('data-theme', savedTheme);
    this.config.settings.currentTheme = savedTheme;
    this.config.hardware.gyroscope.enabled = savedGyro;
  }

  // Dựng các thành phần giao diện cơ bản dựa trên cấu hình hệ thống
  renderStaticUI() {
    if (this.domElements.logo) {
      this.domElements.logo.textContent = this.config.brand.logoText;
      this.domElements.logo.href = this.config.brand.logoUrl;
    }

    // Render Menu Điều Hướng giữ nguyên class active theo trang hiện tại (MPA Structure)
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

    // Dựng danh sách Lựa chọn Giao diện trong Settings Panel
    if (this.domElements.themeSelect) {
      this.domElements.themeSelect.innerHTML = this.config.settings.themes
        .map(theme => `<option value="${theme}">${theme.toUpperCase()}</option>`)
        .join('');
      this.domElements.themeSelect.value = this.config.settings.currentTheme;
    }

    // Đồng bộ trạng thái nút gạt Gyroscope
    if (this.domElements.gyroSwitch) {
      this.domElements.gyroSwitch.checked = this.config.hardware.gyroscope.enabled;
    }
  }

  // Tải dữ liệu bất đồng bộ từ các tệp Manifest bên ngoài (Sửa lỗi số 1 và số 4)
  async loadDynamicManifests() {
    try {
      // 1. Fetch dữ liệu link ảnh thật (Sửa lỗi số 1)
      const assetsResponse = await fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.assets}`);
      this.assetsData = await assetsResponse.json();
      this.applyDynamicAssets();

      // 2. Fetch danh mục bài viết .md và tự động render nếu phần tử tồn tại (Sửa lỗi số 4)
      const articlesResponse = await fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.articles}`);
      this.articlesData = await articlesResponse.json();
      this.renderDynamicArticles();

    } catch (error) {
      console.error("Lỗi trong quá trình nạp dữ liệu Manifest hệ thống:", error);
    }
  }

  // Áp dụng ảnh thật từ Manifest vào các Layer Parallax (Sửa lỗi số 1)
  applyDynamicAssets() {
    if (!this.assetsData || !this.assetsData.parallaxImages) return;

    this.config.parallaxLayers.forEach(layer => {
      const element = document.getElementById(`layer-${layer.id}`);
      const assetInfo = this.assetsData.parallaxImages[layer.id];
      
      if (element && assetInfo && assetInfo.url) {
        // Thay thế hình khối giả lập cũ bằng ảnh nền thực tế chất lượng cao
        element.style.backgroundImage = `url('${assetInfo.url}')`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      }
    });
  }

  // Tự động render danh sách hoặc nội dung chi tiết bài viết Markdown (Sửa lỗi số 4)
  renderDynamicArticles() {
    if (!this.articlesData || !this.articlesData.articles) return;

    // Tìm kiếm vùng chứa danh sách bài viết trên trang (nếu có)
    const container = document.getElementById('layer-fg-content');
    if (!container) return;

    // Nếu đang ở trang chủ hoặc giới thiệu, tiến hành chèn danh sách bài viết động vào cuối Hero content
    const heroContent = container.querySelector('.hero-content');
    if (heroContent) {
      const articlesSection = document.createElement('div');
      articlesSection.className = 'dynamic-articles-list';
      articlesSection.style.marginTop = 'var(--spacing-lg)';
      articlesSection.style.textAlign = 'left';
      articlesSection.style.borderTop = '1px solid var(--border-glass)';
      articlesSection.style.paddingTop = 'var(--spacing-md)';

      articlesSection.innerHTML = `
        <h2 style="font-size: 1.2rem; margin-bottom: var(--spacing-sm); color: var(--accent-color);">Bài viết mới nhất (.MD Driven):</h2>
        <div class="articles-grid" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
          ${this.articlesData.articles.map(art => `
            <div class="article-card" style="cursor: pointer; padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
              <h3 class="article-trigger" data-file="${art.filePath}" style="font-size: 1rem; color: var(--text-primary); margin-bottom: 4px;">${art.title}</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${art.description}</p>
            </div>
          `).join('')}
        </div>
        <div id="md-content-viewport" style="margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-glass); border-radius: var(--radius-md); display: none;"></div>
      `;

      heroContent.appendChild(articlesSection);

      // Gắn sự kiện click để đọc và render trực tiếp nội dung file .md bằng Parser thuần
      articlesSection.querySelectorAll('.article-trigger').forEach(trigger => {
        trigger.addEventListener('click', async (e) => {
          const filePath = e.currentTarget.getAttribute('data-file');
          const viewport = document.getElementById('md-content-viewport');
          if (viewport) {
            viewport.style.display = 'block';
            // Gọi helper đọc tệp từ xa và dịch sang HTML
            await MarkdownParser.renderContainer(`${this.config.baseEndpoint}/${filePath}`, 'md-content-viewport');
            viewport.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    }
  }

  // Lắng nghe tương tác người dùng
  bindEvents() {
    // Đóng mở Settings Panel
    this.domElements.settingsToggle?.addEventListener('click', () => {
      this.domElements.settingsPanel?.classList.toggle('hidden');
    });

    // Thay đổi Giao diện và Ghi nhớ trạng thái (Sửa lỗi số 3)
    this.domElements.themeSelect?.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      this.domElements.html.setAttribute('data-theme', selectedTheme);
      StateManager.save('theme', selectedTheme);
    });

    // Xử lý Bật/Tắt Cảm biến Nghiêng và Ghi nhớ trạng thái (Sửa lỗi số 3)
    this.domElements.gyroSwitch?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      StateManager.save('gyro_enabled', isChecked);
      if (this.parallaxModule) {
        this.parallaxModule.toggleGyroscope(isChecked);
      }
    });

    // Cấp quyền cảm biến hướng cho thiết bị di động đặc thù
    this.domElements.hardwareAuthBtn?.addEventListener('click', () => {
      this.requestGyroscopePermission();
    });
  }

  // Kích hoạt engine xử lý Camera ảo Parallax 3D
  async initParallaxEngine() {
    try {
      const { ParallaxEngine } = await import('./components/parallax.js');
      this.parallaxModule = new ParallaxEngine(this.config);
      this.parallaxModule.start();
    } catch (error) {
      console.error("Không thể khởi chạy hệ thống Virtual Camera Parallax:", error);
    }
  }

  // Yêu cầu quyền cảm biến cho riêng thiết bị di động iOS
  async requestGyroscopePermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          if (this.domElements.gyroSwitch) this.domElements.gyroSwitch.checked = true;
          StateManager.save('gyro_enabled', true);
          this.parallaxModule?.toggleGyroscope(true);
        }
      } catch (error) {
        console.error("Lỗi yêu cầu quyền cảm biến hướng thiết bị:", error);
      }
    } else {
      alert("Thiết bị đã sẵn sàng kích hoạt cảm biến hướng.");
    }
  }
}

// Khởi chạy ứng dụng ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
 
