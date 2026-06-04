import { BaseComponent } from './BaseComponent.js';

export class Settings extends BaseComponent {
    constructor(container, store, eventBus) {
        super(container, store, eventBus);
    }

    shouldUpdate(currentState, prevState) {
        return currentState.isSettingsOpen !== prevState.isSettingsOpen ||
               currentState.activeTheme !== prevState.activeTheme ||
               currentState.gyroscopeEnabled !== prevState.gyroscopeEnabled;
    }

    render() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'settings-panel glass-panel interactive-element';
            this.container.appendChild(this.element);
        }

        const { isSettingsOpen, activeTheme, gyroscopeEnabled } = this.store.state;

        if (isSettingsOpen) {
            this.element.classList.add('open');
        } else {
            this.element.classList.remove('open');
        }

        this.element.innerHTML = `
            <div class="panel-header">
                <h3>Cấu hình hệ thống</h3>
            </div>
            <div class="setting-row">
                <span>Giao diện tối</span>
                <label class="switch-control">
                    <input type="checkbox" id="theme-toggle" ${activeTheme === 'dark' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-row">
                <span>Cảm biến Gyroscope</span>
                <label class="switch-control">
                    <input type="checkbox" id="gyro-toggle" ${gyroscopeEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-row" style="margin-top: var(--space-md);">
                <button id="clear-cache-btn" style="width: 100%; padding: var(--space-sm); background: var(--danger); border-radius: var(--radius-sm); font-weight: 600;">
                    Xóa bộ nhớ đệm Offline
                </button>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = this.element.querySelector('#theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                this.eventBus.emit('UI_TOGGLE_THEME', newTheme);
            });
        }

        const gyroToggle = this.element.querySelector('#gyro-toggle');
        if (gyroToggle) {
            gyroToggle.addEventListener('change', (e) => {
                this.eventBus.emit('UI_TOGGLE_GYRO', e.target.checked);
            });
        }

        const clearBtn = this.element.querySelector('#clear-cache-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bài viết đã lưu ngoại tuyến không?')) {
                    this.eventBus.emit('UI_REQUEST_CLEAR_CACHE');
                }
            });
        }
    }
}
