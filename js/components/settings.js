// js/components/settings.js
import { StateManager } from '../utils/helpers.js';

export class SettingsComponent {
  /**
   * Khởi tạo cấu phần quản lý bảng điều khiển Dashboard Settings
   * @param {Object} config - Cấu hình SITE_CONFIG toàn cục
   * @param {Object} eventCallbacks - Các hàm callback đồng bộ sang Module khác
   */
  constructor(config, eventCallbacks = {}) {
    this.config = config;
    this.callbacks = eventCallbacks; // Chứa onGyroChange, onSensitivityChange, onToggleUI
    this.dom = {};
    this.isUiHidden = false; // Trạng thái theo dõi việc ẩn/hiện hệ thống Card bài viết
    
    // Kho dữ liệu từ điển ngôn ngữ nội bộ tĩnh (Data-Driven Dictionary)
    this.i18n = {
      vi: { title: "Cài Đặt Hệ Thống", theme: "Giao diện:", gyro: "Cảm biến Nghiêng (Gyro)", sens: "Độ nhạy Camera VR:", motion: "Chế độ tiết kiệm (Giảm VR)", hideUi: "Ẩn Toàn Bộ Card Giao Diện", showUi: "Hiện Tất Cả Giao Diện" },
      en: { title: "System Dashboard", theme: "Theme Control:", gyro: "Motion Sensor (Gyro)", sens: "VR Cam Sensitivity:", motion: "Battery Saver (Reduce VR)", hideUi: "Hide All Card Interface", showUi: "Show All Card Interface" }
    };

    this.init();
  }

  init() {
    this.cacheElements();
    this.renderDynamicDashboard();
    this.applyInitialState();
    this.bindEvents();
  }

  // Định vị chính xác phần tử DOM cố định thuộc phạm vi quản lý của Settings
  cacheElements() {
    this.dom = {
      html: document.documentElement,
      toggleBtn: document.getElementById('settings-toggle'),
      panel: document.getElementById('settings-panel')
    };
  }

  // Dựng toàn bộ giao diện chức năng hoàn thiện bên trong bảng trượt (Sửa lỗi cú pháp vỡ DOM)
  renderDynamicDashboard() {
    if (!this.dom.panel) return;

    const currentLang = StateManager.load('lang', 'vi');
    const t = this.i18n[currentLang];

    // Bơm cấu trúc HTML chứa đầy đủ các nhóm thiết lập và đóng thẻ chuẩn xác 100%
    this.dom.panel.innerHTML = `
      <div class="settings-content">
        <h3 id="lbl-dash-title">${t.title}</h3>
        
        <!-- 1. Bộ kiểm soát Theme -->
        <div class="setting-group">
          <label for="theme-select" id="lbl-theme">${t.theme}</label>
          <select id="theme-select">
            ${this.config.settings.themes.map(th => `<option value="${th}">${th.toUpperCase()}</option>`).join('')}
          </select>
        </div>

        <!-- 2. Bộ kiểm soát Ngôn ngữ -->
        <div class="setting-group">
          <label for="lang-select">Ngôn ngữ / Language:</label>
          <select id="lang-select">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <!-- 3. Thanh trượt Slider tinh chỉnh biên độ Camera ảo VR -->
        <div class="setting-group">
          <label for="sens-slider" id="lbl-sens">${t.sens}</label>
          <input type="range" id="sens-slider" class="vr-slider" min="5" max="30" value="12">
        </div>

        <!-- 4. Nút gạt Cảm biến Gyro -->
        <div class="setting-group">
          <label for="gyro-switch" class="switch-label">
            <input type="checkbox" id="gyro-switch">
            <span id="lbl-gyro">${t.gyro}</span>
          </label>
        </div>

        <!-- 5. Nút gạt Giảm chuyển động cho máy yếu -->
        <div class="setting-group">
          <label for="motion-switch" class="switch-label">
            <input type="checkbox" id="motion-switch">
            <span id="lbl-motion">${t.motion}</span>
          </label>
        </div>

        <!-- 6. Nút bấm Ẩn/Hiện toàn bộ hệ thống Card bài viết lơ lửng -->
        <button id="toggle-ui-btn" class="toggle-ui-btn">${t.hideUi}</button>
      </div>
    `;

    // Lưu lại DOM của các trường tương tác động vừa chèn
    this.dom.themeSelect = document.getElementById('theme-select');
    this.dom.langSelect = document.getElementById('lang-select');
    this.dom.sensSlider = document.getElementById('sens-slider');
    this.dom.gyroSwitch = document.getElementById('gyro-switch');
    this.dom.motionSwitch = document.getElementById('motion-switch');
    this.dom.toggleUiBtn = document.getElementById('toggle-ui-btn');
  }

  // Khôi phục trạng thái bộ nhớ an toàn xuyên trang, tránh lỗi reset cấu hình
  applyInitialState() {
    const theme = StateManager.load('theme', this.config.settings.defaultTheme);
    const lang = StateManager.load('lang', 'vi');
    const sens = StateManager.load('sens', this.config.hardware.gyroscope.sensitivityX);
    const gyro = StateManager.load('gyro_enabled', this.config.hardware.gyroscope.enabled);
    const motion = StateManager.load('motion_reduction', this.config.settings.motionReduction);

    // Đồng bộ giá trị vào object cấu hình hệ thống
    this.config.settings.currentTheme = theme;
    this.config.settings.motionReduction = motion;
    this.config.hardware.gyroscope.enabled = gyro;
    this.config.hardware.gyroscope.sensitivityX = sens;
    this.config.hardware.gyroscope.sensitivityY = sens;

    // Phản ánh trạng thái lên các thành phần giao diện
    if (this.dom.html) this.dom.html.setAttribute('data-theme', theme);
    if (this.dom.themeSelect) this.dom.themeSelect.value = theme;
    if (this.dom.langSelect) this.dom.langSelect.value = lang;
    if (this.dom.sensSlider) this.dom.sensSlider.value = sens;
    if (this.dom.gyroSwitch) this.dom.gyroSwitch.checked = gyro;
    if (this.dom.motionSwitch) this.dom.motionSwitch.checked = motion;
  }

  // Lắng nghe và xử lý toàn bộ luồng hành vi tương tác trên Dashboard
  bindEvents() {
    // Đóng mở Panel trượt cài đặt
    this.dom.toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.panel?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (this.dom.panel && !this.dom.panel.contains(e.target) && e.target !== this.dom.toggleBtn) {
        this.dom.panel.classList.add('add', 'hidden');
      }
    });

    // Sự kiện thay đổi Theme
    this.dom.themeSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      this.dom.html?.setAttribute('data-theme', val);
      StateManager.save('theme', val);
    });

    // Sự kiện thay đổi Ngôn ngữ
    this.dom.langSelect?.addEventListener('change', (e) => {
      const lang = e.target.value;
      StateManager.save('lang', lang);
      this.translateUI(lang);
    });

    // Sự kiện kéo thanh trượt tinh chỉnh độ nhạy Camera 3D
    this.dom.sensSlider?.addEventListener('input', (e) => {
      const sens = parseInt(e.target.value);
      StateManager.save('sens', sens);
      this.config.hardware.gyroscope.sensitivityX = sens;
      this.config.hardware.gyroscope.sensitivityY = sens;
      
      if (typeof this.callbacks.onSensitivityChange === 'function') {
        this.callbacks.onSensitivityChange(sens);
      }
    });

    // Sự kiện bật tắt cảm biến hướng Gyro
    this.dom.gyroSwitch?.addEventListener('change', (e) => {
      const chk = e.target.checked;
      StateManager.save('gyro_enabled', chk);
      if (typeof this.callbacks.onGyroChange === 'function') this.callbacks.onGyroChange(chk);
    });

    // Sự kiện bật tắt chế độ tiết kiệm năng lượng hệ thống
    this.dom.motionSwitch?.addEventListener('change', (e) => {
      const chk = e.target.checked;
      StateManager.save('motion_reduction', chk);
      this.config.settings.motionReduction = chk;
      if (typeof this.callbacks.onGyroChange === 'function') this.callbacks.onGyroChange(!chk);
    });

    // Sự kiện Click nút Ẩn/Hiện toàn diện hệ thống Card
    this.dom.toggleUiBtn?.addEventListener('click', () => {
      this.isUiHidden = !this.isUiHidden;
      
      const lang = StateManager.load('lang', 'vi');
      this.dom.toggleUiBtn.textContent = this.isUiHidden ? this.i18n[lang].showUi : this.i18n[lang].hideUi;

      if (typeof this.callbacks.onToggleUI === 'function') {
        this.callbacks.onToggleUI(this.isUiHidden);
      }
    });
  }

  // Dịch thuật thời gian thực toàn bộ các nhãn chữ trong Dashboard
  translateUI(lang) {
    const t = this.i18n[lang];
    document.getElementById('lbl-dash-title').textContent = t.title;
    document.getElementById('lbl-theme').textContent = t.theme;
    document.getElementById('lbl-sens').textContent = t.sens;
    document.getElementById('lbl-gyro').textContent = t.gyro;
    document.getElementById('lbl-motion').textContent = t.motion;
    if (this.dom.toggleUiBtn) {
      this.dom.toggleUiBtn.textContent = this.isUiHidden ? t.showUi : t.hideUi;
    }
  }
}
