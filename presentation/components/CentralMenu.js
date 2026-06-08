/**
 * CentralMenu.js
 * Menu điều phối chính có tích hợp cổng nhúng tệp tin Đồ họa Vector Logo.
 */
export class CentralMenu {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('central-menu');
        this.setupDOM();
    }

    setupDOM() {
        // Bổ sung thẻ chứa logo-container chuyên dụng để bạn tùy biến gắn đè logo.svg vào bên trong
        this.element.innerHTML = `
            <div class="logo-container">
                <!-- BẠN GẮN HOẶC CHÈN NỘI DUNG FILE LOGO.SVG VÀO ĐÂY -->
                <object type="image/svg+xml" data="./assets/logo.svg" class="main-svg-logo">
                    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://w3.org">
                        <polygon points="50,15 90,85 10,85" stroke="#ff007f" stroke-width="4" fill="rgba(255, 0, 127, 0.1)"/>
                        <circle cx="50" cy="55" r="15" stroke="#00e5ff" stroke-width="3" fill="none"/>
                    </svg>
                </object>
            </div>
            <div class="menu-title">VR ENTERPRISE HUD</div>
            <button id="btn-spawn-settings">⚙️ SETTINGS PANEL</button>
            <button id="btn-spawn-posts">📂 ARTICLES LIST</button>
        `;

        // Ép luồng xử lý sự kiện lắng nghe click chuẩn xác không bị nuốt luồng VR
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
