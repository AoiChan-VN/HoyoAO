export class SettingsPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('settings-panel');
        this.isSpawned = false;
        this.setupDOM();
    }

    setupDOM() {
        this.element.innerHTML = `
            <div class="panel-header">⚙️ PERFORMANCE SETTINGS</div>
            <div class="panel-content">
                <label style="display:block; margin-bottom:10px;">FRAME RATE LIMITER:</label>
                <button class="fps-btn" data-fps="60">LOCK 60 FPS</button>
                <button class="fps-btn" data-fps="120">LOCK 120 FPS</button>
                <button class="fps-btn active" data-fps="uncapped">UNCAPPED</button>
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
        if (this.isSpawned) return;
        this.isSpawned = true;
        // Thực hiện nạp phần tử vào engine tính toán tọa độ vật lý (đẩy lên phía TRÊN)
        this.controller.physicsEngine.registerElement(this.element, 0, -280, -450);
    }
}
