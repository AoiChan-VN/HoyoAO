/**
 * SettingsPanel.js
 * Bảng cấu hình hiệu năng, tự động định vị lên phía TRÊN không gian khi kích hoạt.
 */
export class SettingsPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('settings-panel');
        this.isSpawned = false;
        this.setupDOM();
    }

    setupDOM() {
        this.element.innerHTML = `
            <div class="panel-header">⚙️ PERFORMANCE ENGINE SETTINGS</div>
            <div class="panel-content">
                <label style="display:block; margin-bottom:12px; font-weight:bold; color:#00e5ff;">FRAME RATE LIMITER:</label>
                <button class="fps-btn" data-fps="60">LOCK 60 FPS</button>
                <button class="fps-btn" data-fps="120">LOCK 120 FPS</button>
                <button class="fps-btn active" data-fps="uncapped">UNCAPPED (HARDWARE)</button>
            </div>
        `;

        const buttons = this.element.querySelectorAll('.fps-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const fps = e.target.getAttribute('data-fps');
                this.controller.perfRegistry.setFPSMode(fps);
            });
        });
    }

    spawn() {
        this.element.style.display = 'block';
        this.isSpawned = true;
        // Đưa thực thể vào bộ xử lý vật lý kéo thả tự do, gán lệch lên phía TRÊN (Y: -260)
        this.controller.physicsEngine.registerElement(this.element, 0, -260, -450);
    }
}
