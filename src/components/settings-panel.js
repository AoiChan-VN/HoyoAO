import { BaseComponent } from './base-component.js';

export class SettingsPanel extends BaseComponent {
  constructor(elementId) {
    super(elementId);
    this.trackEvent('state:ui', (uiState) => this.updateState(uiState));
  }

  template() {
    const uiState = this.store.getState().uiState;
    const isDark = uiState.theme === 'dark';
    const hasGyro = uiState.gyroscopeEnabled !== false;

    return `
      <div class="glass-panel settings-container">
        <div class="settings-header">
          <h3>Cấu hình hệ thống</h3>
          <button class="interactive close-btn" id="settings-close">✕</button>
        </div>
        <div class="settings-body">
          <div class="setting-item">
            <label>Giao diện nền</label>
            <div class="toggle-group">
              <button class="interactive toggle-btn ${isDark ? 'active' : ''}" data-theme="dark">Tối</button>
              <button class="interactive toggle-btn ${!isDark ? 'active' : ''}" data-theme="light">Sáng</button>
            </div>
          </div>
          <div class="setting-item">
            <label>Cảm biến xoay (Gyro)</label>
            <div class="toggle-group">
              <button class="interactive toggle-btn ${hasGyro ? 'active' : ''}" data-gyro="true">Bật</button>
              <button class="interactive toggle-btn ${!hasGyro ? 'active' : ''}" data-gyro="false">Tắt</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    this.element.addEventListener('click', (e) => {
      const target = e.target;

      if (target.id === 'settings-close') {
        this.store.setUiState('settingsVisible', false);
        return;
      }

      if (target.hasAttribute('data-theme')) {
        const theme = target.getAttribute('data-theme');
        this.store.setUiState('theme', theme);
        return;
      }

      if (target.hasAttribute('data-gyro')) {
        const gyroValue = target.getAttribute('data-gyro') === 'true';
        this.store.setUiState('gyroscopeEnabled', gyroValue);
        this.eventBus.emit('vr:gyro:toggle', gyroValue);
      }
    });
  }

  updateState(uiState) {
    if (!this.element) return;
    
    if (uiState.settingsVisible) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }

    const darkBtn = this.element.querySelector('[data-theme="dark"]');
    const lightBtn = this.element.querySelector('[data-theme="light"]');
    if (darkBtn && lightBtn) {
      if (uiState.theme === 'dark') {
        darkBtn.classList.add('active');
        lightBtn.classList.remove('active');
      } else {
        lightBtn.classList.add('active');
        darkBtn.classList.remove('active');
      }
    }
  }
}
 
