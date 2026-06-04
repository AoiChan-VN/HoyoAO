import { BaseComponent } from './BaseComponent.js';

export class Panel extends BaseComponent {
    constructor(container, store, eventBus) {
        super(container, store, eventBus);
    }

    shouldUpdate(currentState, prevState) {
        return currentState.currentRoute !== prevState.currentRoute ||
               currentState.profile !== prevState.profile ||
               currentState.isSettingsOpen !== prevState.isSettingsOpen;
    }

    render() {
        const { currentRoute, profile, isSettingsOpen } = this.store.state;

        if (isSettingsOpen || currentRoute === 'settings') {
            if (this.element) {
                this.element.style.display = 'none';
            }
            return;
        }

        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'info-panel glass-panel no-scrollbar interactive-element';
            this.container.appendChild(this.element);
        }

        this.element.style.display = 'flex';

        if (currentRoute === 'home') {
            this.element.innerHTML = `
                <div class="panel-header">
                    <h2>${profile.name}</h2>
                </div>
                <div class="panel-body">
                    <p style="font-weight: 600; color: var(--accent); margin-bottom: var(--space-sm);">${profile.title}</p>
                    <p>${profile.bio}</p>
                    <div style="margin-top: var(--space-lg); border-top: 1px solid var(--border-color); padding-top: var(--space-md);">
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Mẹo: Giữ và kéo chuột (hoặc nghiêng điện thoại) để xoay không gian VR 360° và tìm các điểm tương tác.</p>
                    </div>
                </div>
            `;
        } else if (currentRoute === 'projects') {
            this.element.innerHTML = `
                <div class="panel-header">
                    <h2>Dự án cá nhân</h2>
                </div>
                <div class="panel-body" style="display: flex; flex-direction: column; gap: var(--space-sm);">
                    <p>Khám phá kho lưu trữ mã nguồn và giải pháp kỹ thuật:</p>
                    <button class="project-link-btn" data-file="projects.md" style="width: 100%; text-align: left; padding: var(--space-sm); background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                        <span style="font-weight: 600; color: var(--accent);">📊 Danh sách dự án</span>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: var(--space-xs);">Xem chi tiết các core engine đồ họa và hệ thống PWA.</p>
                    </button>
                </div>
            `;
            this.setupEventListeners();
        } else if (currentRoute === 'about') {
            this.element.innerHTML = `
                <div class="panel-header">
                    <h2>Giới thiệu</h2>
                </div>
                <div class="panel-body" style="display: flex; flex-direction: column; gap: var(--space-sm);">
                    <p>Đọc thông tin chi tiết về lộ trình nghiên cứu của tôi:</p>
                    <button class="project-link-btn" data-file="bio.md" style="width: 100%; text-align: left; padding: var(--space-sm); background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: var(--space-xs);">
                        <span style="font-weight: 600; color: var(--accent);">👤 Tiểu sử bản thân</span>
                    </button>
                    <button class="project-link-btn" data-file="contact.md" style="width: 100%; text-align: left; padding: var(--space-sm); background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                        <span style="font-weight: 600; color: var(--accent);">📬 Thông tin liên hệ</span>
                    </button>
                </div>
            `;
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const buttons = this.element.querySelectorAll('.project-link-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileName = e.currentTarget.getAttribute('data-file');
                this.eventBus.emit('UI_REQUEST_MODAL', fileName);
            });
        });
    }
}
 
