import { EventBus } from './EventBus.js';
import { Store } from './Store.js';
import { Router } from './Router.js';
import { Storage } from './Storage.js';
import { WebGLRenderer } from '../vr/WebGLRenderer.js';
import { Menu } from '../components/Menu.js';
import { Panel } from '../components/Panel.js';
import { Settings } from '../components/Settings.js';
import { Modal } from '../components/Modal.js';

export class App {
    constructor() {
        this.store = null;
        this.eventBus = null;
        this.router = null;
        this.storage = null;
        this.renderer = null;
        
        // Danh sách các UI components phẳng
        this.components = {
            menu: null,
            panel: null,
            settings: null,
            modal: null
        };
    }

    /**
     * Khởi chạy toàn bộ hệ thống ứng dụng
     */
    async initialize() {
        try {
            // 1. Khởi tạo trục truyền tin Event-Driven
            this.eventBus = new EventBus();
            window.appEventBus = this.eventBus; // Cấp quyền truy cập cục bộ cho module độc lập

            // 2. Nạp dữ liệu hệ thống (Data-Driven)
            const response = await fetch('./assets/data/profile.json');
            if (!response.ok) {
                throw new Error(`Failed to load app data: ${response.status}`);
            }
            const appData = await response.json();

            // 3. Khởi tạo kho lưu trữ thiết bị (LocalStorage / IndexedDB)
            this.storage = new Storage(appData.appConfig.storageKeys.dbName);
            await this.storage.initialize();

            // 4. Đọc cấu hình tùy chỉnh cũ của người dùng từ LocalStorage (nếu có)
            const savedTheme = localStorage.getItem(appData.appConfig.storageKeys.theme) || appData.appConfig.defaultTheme;
            document.documentElement.setAttribute('data-theme', savedTheme);

            // 5. Thiết lập trạng thái ứng dụng tập trung (State-Driven)
            this.store = new Store({
                config: appData.appConfig,
                profile: appData.profile,
                menuItems: appData.menu,
                hotspots: appData.vrHotspots,
                currentRoute: 'home',
                activeTheme: savedTheme,
                gyroscopeEnabled: appData.appConfig.gyroscopeEnabledDefault,
                activeModalPost: null,
                isSettingsOpen: false
            });
            window.appStore = this.store;

            // 6. Khởi tạo hệ thống hiển thị 3D gốc (Native WebGL2)
            const canvas = document.getElementById('vr-canvas');
            if (canvas) {
                this.renderer = new WebGLRenderer(canvas, this.store, this.eventBus);
                await this.renderer.initialize();
            }

            // 7. Khởi tạo và kết xuất giao diện phẳng UI (Component-Driven)
            this.renderUIComponents();

            // 8. Kích hoạt bộ định tuyến Hash Router
            this.router = new Router(this.store, this.eventBus);
            this.router.initialize();

            // 9. Lắng nghe các sự kiện hệ thống cốt lõi để cập nhật State toàn cục
            this.setupGlobalEventListeners();

            console.log('--- Portfolio System initialized successfully ---');
        } catch (error) {
            console.error('Fatal Error during App initialization:', error);
        }
    }

    /**
     * Khởi tạo các UI Component và mount vào DOM Shell
     */
    renderUIComponents() {
        const appShell = document.getElementById('app');
        if (!appShell) return;

        // Khởi tạo các instances của Component
        this.components.menu = new Menu(appShell, this.store, this.eventBus);
        this.components.panel = new Panel(appShell, this.store, this.eventBus);
        this.components.settings = new Settings(appShell, this.store, this.eventBus);
        this.components.modal = new Modal(appShell, this.store, this.eventBus);

        // Kích hoạt render ban đầu
        Object.values(this.components).forEach(component => {
            if (component && typeof component.render === 'function') {
                component.render();
            }
        });
    }

    /**
     * Quản lý tập trung các luồng bắt sự kiện thay đổi trạng thái UI phẳng
     */
    setupGlobalEventListeners() {
        // Lắng nghe sự kiện yêu cầu mở bài viết Markdown
        this.eventBus.on('UI_REQUEST_MODAL', (markdownFile) => {
            this.store.setState({ activeModalPost: markdownFile });
        });

        // Lắng nghe sự kiện yêu cầu đóng hộp thoại Modal
        this.eventBus.on('UI_CLOSE_MODAL', () => {
            this.store.setState({ activeModalPost: null });
        });

        // Lắng nghe sự kiện thay đổi cấu hình theme
        this.eventBus.on('UI_TOGGLE_THEME', (newTheme) => {
            this.store.setState({ activeTheme: newTheme });
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(this.store.state.config.storageKeys.theme, newTheme);
        });

        // Lắng nghe trạng thái bật/tắt cảm biến con quay hồi chuyển
        this.eventBus.on('UI_TOGGLE_GYRO', (isEnabled) => {
            this.store.setState({ gyroscopeEnabled: isEnabled });
        });

        // Lắng nghe sự kiện đóng/mở panel cấu hình hệ thống
        this.eventBus.on('UI_TOGGLE_SETTINGS_PANEL', (isOpen) => {
            this.store.setState({ isSettingsOpen: isOpen });
        });
    }
}
 
