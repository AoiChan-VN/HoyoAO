import { VRCamera } from './core/Camera.js';
import { DragDropDashboard } from './components/DragDrop.js';

class VRPlatformApp {
    constructor() {
        this.camera = new VRCamera();
        this.skybox = document.querySelector('.skybox');
        this.init();
    }

    init() {
        // Khởi tạo tính năng kéo thả cho Dashboard điều khiển
        new DragDropDashboard('main-dashboard');
        
        // Chạy vòng lặp render 60fps chuẩn quốc tế
        this.render();
    }

    render() {
        // Cập nhật tọa độ di chuyển đầu/chuột từ Camera
        this.camera.update();

        // Áp dụng Matrix-3D xoay không gian Skybox bao cảnh thời gian thực
        const transformString = `rotateX(${-this.camera.rotation.y * 0.1}deg) rotateY(${this.camera.rotation.x * 0.1}deg)`;
        this.skybox.style.transform = transformString;

        // Đệ quy tối ưu hóa phần cứng qua RequestAnimationFrame
        requestAnimationFrame(() => this.render());
    }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
    new VRPlatformApp();
});
 
