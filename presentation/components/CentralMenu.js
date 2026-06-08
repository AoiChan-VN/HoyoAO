/**
 * CentralMenu.js
 * Menu điều phối chính cố định tại gốc tọa độ HUD. Không cho phép kéo thả.
 */
export class CentralMenu {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('central-menu');
        this.setupDOM();
    }

    setupDOM() {
        this.element.innerHTML = `
            <div class="menu-title">VR ENTERPRISE HUD</div>
            <button id="btn-spawn-settings">⚙️ SETTINGS PANEL</button>
            <button id="btn-spawn-posts">📂 ARTICLES LIST</button>
        `;

        document.getElementById('btn-spawn-settings').addEventListener('click', () => {
            this.controller.settingsPanel.spawn();
        });

        document.getElementById('btn-spawn-posts').addEventListener('click', () => {
            this.controller.postListPanel.spawn();
        });
    }
}
 
