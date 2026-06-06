/**
 * ==========================================================================
 * MAXIMUM ACTIVATION ENGINE (MAIN ENTRY POINT)
 * Điểm kích hoạt tối cao - Đăng ký mảng Custom Elements vào Registry
 * và thiết lập luồng phân phối thực thể không gian toàn hệ thống.
 * ==========================================================================
 */

import { App } from './src/app.js';
import { SpatialSkybox } from './src/components/skybox/skybox.js';
import { SpatialDashboard } from './src/components/dashboard/dashboard.js';
import { SpatialPanel } from './src/components/panel/panel.js';
import { SpatialCard } from './src/components/card/card.js';
import { SpatialViewer } from './src/components/spatial-viewer/spatial-viewer.js';

// Đăng ký mảng Custom Web Elements vào hệ thống phân phối của Trình duyệt
if ('customElements' in window) {
    customElements.define('spatial-skybox', SpatialSkybox);
    customElements.define('spatial-dashboard', SpatialDashboard);
    customElements.define('spatial-panel', SpatialPanel);
    customElements.define('spatial-card', SpatialCard);
    customElements.define('spatial-viewer', SpatialViewer);
} else {
    console.error('CRITICAL: Trình duyệt không hỗ trợ Custom Elements (WebXR Subsystem Fault).');
}

// Khởi chạy hạt nhân điều phối luồng thực thể ảo ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('spatial-stage');
    if (stage) {
        window.SpatialAppCore = new App(stage);
    } else {
        console.error('CRITICAL: Không tìm thấy Spatial Stage (.spatial-stage). Hạ tầng đổ vỡ.');
    }
});
 
