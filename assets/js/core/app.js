import { HashRouter } from './router.js';
import { store } from './store.js';
import '../ui/settings-modal.js';

// Cấu hình danh sách định tuyến (Routes)
const routes = {
    '#/': () => {
        const div = document.createElement('div');
        div.innerHTML = `<h1>Chào mừng tới Portfolio</h1><settings-modal></settings-modal>`;
        return div;
    },
    '#/404': () => {
        const div = document.createElement('div');
        div.innerHTML = `<h1>404 - Không tìm thấy trang</h1>`;
        return div;
    }
};

// Khởi chạy App Router
new HashRouter(routes);

// Đăng ký Service Worker tối ưu chạy Offline (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./assets/manifests/service-worker.js')
            .then(reg => console.log('PWA Service Worker đã chạy!', reg.scope))
            .catch(err => console.error('Lỗi PWA:', err));
    });
}
 
