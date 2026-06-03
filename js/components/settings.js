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
    this.callbacks = eventCallbacks; // Chứa onGyroChange, onSensitivityChange, onLangChange
    this.dom = {};
    
    // Kho dữ liệu từ điển ngôn ngữ nội bộ tĩnh (Data-Driven Dictionary)
    this.i18n = {
      vi: { title: "Cài Đặt Hệ Thống", theme: "Giao diện:", gyro: "Cảm biến Nghiêng (Gyro)", sens: "Độ nhạy Camera VR:", motion: "Chế độ tiết kiệm (Giảm VR)" },
      en: { title: "System Dashboard", theme: "Theme Control:", gyro: "Motion Sensor (Gyro)", sens: "VR Cam Sensitivity:", motion: "Battery Saver (Reduce VR)" }
    };

    this.init();
  }

  init() {
    this.cacheElements();
    this.renderDynamicDashboard();
    this.applyInitialState();
    this.bindEvents();
  }

  // Định vị chính xác toàn bộ vùng tương tác của Dashboard
  cacheElements() {
    this.dom = {
      html: document.documentElement,
      toggleBtn: document.getElementById('settings-toggle'),
      panel: document.getElementById('settings-panel')
    };
  }

  // Tạo lập toàn bộ giao diện chức năng hoàn thiện bên trong bảng trượt (Sửa lỗi số 1)
  renderDynamicDashboard() {
    if (!this.dom.panel) return;

    const currentLang = StateManager.load('lang', 'vi');
    const t = this.i18n[currentLang];

    // Bơm cấu trúc HTML chứa đầy đủ slider độ nhạy, select ngôn ngữ, checkbox chuyển động
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

        <!-- 2. Bộ kiểm soát Ngôn ngữ (Data-Driven Language) -->
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

        <!-- 5. Nút gạt Giảm chuyển động cho máy yếu (Điều 8) -->
        <div class="setting-group">
          <label for="motion-switch" class="switch-label">
            <input type="checkbox" id="motion-switch">
            <span id="lbl-motion">${t.motion}</span>
          </label>
        </div>
      </div>
    `;

    // Lưu lại DOM của các input vừa tạo động
    this.dom.themeSelect = document.getElementById('theme-select');
    this.dom.langSelect = document.getElementById('lang-select');
    this.dom.sensSlider = document.getElementById('sens-slider');
    this.dom.gyroSwitch = document.getElementById('gyro-switch');
    this.dom.motionSwitch = document.getElementById('motion-switch');
  }

  // Khôi phục trạng thái bộ nhớ an toàn xuyên trang, không reset khi chuyển MPA
  applyInitialState() {
    const theme = StateManager.load('theme', this.config.settings.defaultTheme);
    const lang = StateManager.load('lang', 'vi');
    const sens = StateManager.load('sens', this.config.hardware.gyroscope.sensitivityX);
    const gyro = StateManager.load('gyro_enabled', this.config.hardware.gyroscope.enabled);
    const motion = StateManager.load('motion_reduction', this.config.settings.motionReduction);

    // Đồng bộ giá trị lên cấu hình chung
    this.config.settings.currentTheme = theme;
    this.config.settings.motionReduction = motion;
    this.config.hardware.gyroscope.enabled = gyro;
    this.config.hardware.gyroscope.sensitivityX = sens;
    this.config.hardware.gyroscope.sensitivityY = sens;

    // Đồng bộ lên UI thực tế
    if (this.dom.html) this.dom.html.setAttribute('data-theme', theme);
    if (this.dom.themeSelect) this.dom.themeSelect.value = theme;
    if (this.dom.langSelect) this.dom.langSelect.value = lang;
    if (this.dom.sensSlider) this.dom.sensSlider.value = sens;
    if (this.dom.gyroSwitch) this.dom.gyroSwitch.checked = gyro;
    if (this.dom.motionSwitch) this.dom.motionSwitch.checked = motion;
  }

  // Lắng nghe và điều phối chuỗi hành vi tương tác nâng cao
  bindEvents() {
    // Đóng mở Panel trượt
    this.dom.toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.panel?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (this.dom.panel && !this.dom.panel.contains(e.target) && e.target !== this.dom.toggleBtn) {
        this.dom.panel.classList.add('hidden');
      }
    });

    // Thay đổi Giao diện
    this.dom.themeSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      this.dom.html?.setAttribute('data-theme', val);
      StateManager.save('theme', val);
    });

    // Thay đổi Ngôn ngữ (Cơ chế dịch thuật trực tiếp không load lại trang)
    this.dom.langSelect?.addEventListener('change', (e) => {
      const lang = e.target.value;
      StateManager.save('lang', lang);
      this.translateUI(lang);
      if (typeof this.callbacks.onLangChange === 'function') this.callbacks.onLangChange(lang);
    });

    // Kéo thả Slider tinh chỉnh độ nhạy biên độ VR Camera
    this.dom.sensSlider?.addEventListener('input', (e) => {
      const sens = parseInt(e.target.value);
      StateManager.save('sens', sens);
      this.config.hardware.gyroscope.sensitivityX = sens;
      this.config.hardware.gyroscope.sensitivityY = sens;
      
      if (typeof this.callbacks.onSensitivityChange === 'function') {
        this.callbacks.onSensitivityChange(sens);
      }
    });

    // Bật tắt Gyro
    this.dom.gyroSwitch?.addEventListener('change', (e) => {
      const chk = e.target.checked;
      StateManager.save('gyro_enabled', chk);
      if (typeof this.callbacks.onGyroChange === 'function') this.callbacks.onGyroChange(chk);
    });

    // Bật tắt Chế độ tiết kiệm / Giảm chuyển động đồ họa (Bảo vệ phần cứng)
    this.dom.motionSwitch?.addEventListener('change', (e) => {
      const chk = e.target.checked;
      StateManager.save('motion_reduction', chk);
      this.config.settings.motionReduction = chk;
      
      // Nếu bật tiết kiệm, tự động trả camera về gốc tọa độ phẳng cố định
      if (typeof this.callbacks.onGyroChange === 'function') this.callbacks.onGyroChange(!chk);
    });
  }

  // Dịch thuật thời gian thực toàn bộ các nhãn văn bản chữ trong Dashboard
  translateUI(lang) {
    const t = this.i18n[lang];
    document.getElementById('lbl-dash-title').textContent = t.title;
    document.getElementById('lbl-theme').textContent = t.theme;
    document.getElementById('lbl-sens').textContent = t.sens;
    document.getElementById('lbl-gyro').textContent = t.gyro;
    document.getElementById('lbl-motion').textContent = t.motion;
  }
}
