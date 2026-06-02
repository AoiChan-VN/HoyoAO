// js/components/settings.js
import { StateManager } from '../utils/helpers.js';

export class SettingsComponent {
  /**
   * Khởi tạo cấu phần cài đặt hệ thống
   * @param {Object} config - Cấu hình SITE_CONFIG gốc
   * @param {Function} onGyroChange - Callback thông báo cho Parallax Engine khi thay đổi trạng thái cảm biến
   */
  constructor(config, onGyroChange) {
    this.config = config;
    this.onGyroChange = onGyroChange;
    this.dom = {};
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.renderThemes();
    this.bindEvents();
    this.applyInitialState();
  }

  // Định vị chính xác các thẻ DOM thuộc phạm vi quản lý của Settings
  cacheElements() {
    this.dom = {
      html: document.documentElement,
      toggleBtn: document.getElementById('settings-toggle'),
      panel: document.getElementById('settings-panel'),
      themeSelect: document.getElementById('theme-select'),
      gyroSwitch: document.getElementById('gyro-switch')
    };
  }

  // Dựng danh sách cấu phần Theme động dựa trên dữ liệu cấu hình (Data-Driven UI)
  renderThemes() {
    if (!this.dom.themeSelect || !this.config.settings.themes) return;
    
    this.dom.themeSelect.innerHTML = this.config.settings.themes
      .map(theme => `<option value="${theme}">${theme.toUpperCase()}</option>`)
      .join('');
  }

  // Phục hồi trạng thái cài đặt an toàn từ LocalStorage mà không gây reset khi chuyển trang (Sửa lỗi số 1)
  applyInitialState() {
    const activeTheme = StateManager.load('theme', this.config.settings.defaultTheme);
    const isGyroActive = StateManager.load('gyro_enabled', this.config.hardware.gyroscope.enabled);

    // Áp dụng trạng thái lên giao diện HTML5
    if (this.dom.html) this.dom.html.setAttribute('data-theme', activeTheme);
    if (this.dom.themeSelect) this.dom.themeSelect.value = activeTheme;
    if (this.dom.gyroSwitch) this.dom.gyroSwitch.checked = isGyroActive;

    // Cập nhật ngược lại object cấu hình dùng chung
    this.config.settings.currentTheme = activeTheme;
    this.config.hardware.gyroscope.enabled = isGyroActive;
  }

  // Đăng ký các bộ lắng nghe sự kiện đóng, mở, tương tác Modal/Panel
  bindEvents() {
    // 1. Chức năng Đóng/Mở Panel mượt mà bằng Class tương tác
    this.dom.toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation(); // Chống hiện tượng nổi bọt sự kiện đám mây
      this.dom.panel?.classList.toggle('hidden');
      
      // Cập nhật thuộc tính hỗ trợ tiếp cận (Accessibility Aria-expanded)
      const isExpanded = !this.dom.panel?.classList.contains('hidden');
      this.dom.toggleBtn.setAttribute('aria-expanded', isExpanded.toString());
    });

    // Tự động đóng Panel khi người dùng click trượt ra ngoài vùng cài đặt
    document.addEventListener('click', (e) => {
      if (this.dom.panel && !this.dom.panel.contains(e.target) && e.target !== this.dom.toggleBtn) {
        this.dom.panel.classList.add('hidden');
        this.dom.toggleBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    // 2. Chức năng thay đổi và lưu giao diện Theme trực tiếp
    this.dom.themeSelect?.addEventListener('change', (e) => {
      const newTheme = e.target.value;
      if (this.dom.html) this.dom.html.setAttribute('data-theme', newTheme);
      StateManager.save('theme', newTheme);
      this.config.settings.currentTheme = newTheme;
    });

    // 3. Chức năng thay đổi và đồng bộ cảm biến hướng Gyroscope
    this.dom.gyroSwitch?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      StateManager.save('gyro_enabled', isChecked);
      this.config.hardware.gyroscope.enabled = isChecked;
      
      // Kích hoạt callback thông báo cho Parallax Engine xử lý tịnh tiến ma trận
      if (typeof this.onGyroChange === 'function') {
        this.onGyroChange(isChecked);
      }
    });
  }
}
 
