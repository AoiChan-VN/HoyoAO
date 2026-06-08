/**
 * SettingsPanel.js
 * Bảng điều khiển cấu hình đồ họa và khóa FPS, hỗ trợ kéo thả vật lý sau khi spawn phía TRÊN.
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
                <label>FRAME RATE LIMITER:</label>
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
        if (this.isSpawned) return;
        this.isSpawned = true;
        this.element.style.display = 'block';
        
        // Spawn định vị tự động lên hướng phía TRÊN màn hình không gian
        this.controller.physicsEngine.registerElement(this.element, 0, -320, -500);
    }
}
 
