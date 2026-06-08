/**
 * CentralMenu.js
 * Menu điều phối chính lơ lửng cố định tại HUD, sử dụng thẻ hình ảnh độc lập để nạp logo.svg riêng.
 */
export class CentralMenu {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('central-menu');
        this.setupDOM();
    }

    setupDOM() {
        // Nạp logo riêng biệt của bạn bằng thẻ img trỏ thẳng tới file assets/logo.svg nội bộ
        this.element.innerHTML = `
            <div class="logo-container">
                <img src="./assets/logo.svg" alt="Project Logo" class="main-svg-logo" onerror="this.style.display='none';">
            </div>
            <div class="menu-title">VR ENTERPRISE HUD</div>
            <button id="btn-spawn-settings">⚙️ SETTINGS PANEL</button>
            <button id="btn-spawn-posts">📂 ARTICLES LIST</button>
        `;

        this.element.querySelector('#btn-spawn-settings').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.controller.settingsPanel.spawn();
        });

        this.element.querySelector('#btn-spawn-posts').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.controller.postListPanel.spawn();
        });
    }
}
