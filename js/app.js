// js/app.js
import { SITE_CONFIG } from '../data/config.js';
import { HeaderComponent } from './components/header.js';
import { SettingsComponent } from './components/settings.js';
import { ArticleCardComponent } from './components/article-card.js';

class AppOrchestrator {
  constructor() {
    this.config = SITE_CONFIG;
    this.components = {};
    this.parallaxEngine = null;
  }

  // Khởi chạy vòng đời toàn hệ thống ứng dụng Multi-Page
  async bootstrap() {
    this.initCoreComponents();
    await this.loadDynamicManifests();
    await this.initParallaxEngine();
  }

  // Khởi tạo và thiết lập các cấu phần giao diện biệt lập (Sửa lỗi số 4)
  initCoreComponents() {
    // 1. Khởi tạo cấu phần Header & Menu điều hướng
    this.components.header = new HeaderComponent(this.config);

    // 2. Khởi tạo cấu phần Settings Dashboard hoàn chỉnh (Sửa lỗi số 1)
    // Tích hợp hệ thống Callbacks liên kết trực tiếp sang các module đồ họa và ngôn ngữ
    this.components.settings = new SettingsComponent(this.config, {
      // Khi người dùng bật/tắt Gyroscope hoặc chế độ Giảm chuyển động
      onGyroChange: (isEnabled) => {
        if (this.parallaxEngine) {
          this.parallaxEngine.toggleGyroscope(isEnabled);
        }
      },
      // Khi người dùng kéo Slider thay đổi độ nhạy biên độ Camera VR
      onSensitivityChange: (newSensitivity) => {
        if (this.parallaxEngine) {
          // Đồng bộ thông số độ nhạy trực tiếp vào vòng lặp đồ họa thời gian thực
          this.parallaxEngine.config.hardware.gyroscope.sensitivityX = newSensitivity;
          this.parallaxEngine.config.hardware.gyroscope.sensitivityY = newSensitivity;
        }
      },
      // Khi người dùng thay đổi ngôn ngữ hệ thống trên Dashboard
      onLangChange: (lang) => {
        console.log(`Hệ thống PURE đã chuyển đổi ngôn ngữ sang: ${lang.toUpperCase()}`);
        // Có thể mở rộng để dịch thêm tiêu đề trang nếu cần
      }
    });

    // 3. Khởi tạo cấu phần quản lý Card bài viết riêng biệt lơ lửng VR (Sửa lỗi số 2 & 3)
    this.components.articleCard = new ArticleCardComponent(this.config);
  }

  // Tải dữ liệu bất đồng bộ từ các tệp Manifest nội bộ (Tách biệt Hardcode theo Điều 5)
  async loadDynamicManifests() {
    try {
      // Gọi tải song song (Parallel Fetch) tối ưu tốc độ mạng, chống nghẽn theo Điều 8
      const [assetsRes, articlesRes] = await Promise.all([
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.assets}`),
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.articles}`)
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        // Cập nhật cấu trúc Logo ảnh thật nội bộ và phân phối ảnh cho Parallax (Sửa lỗi số 1)
        this.components.header.updateDynamicLogo(assetsData);
        this.applyParallaxImages(assetsData);
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        // Truyền dữ liệu manifest sang cấu phần Card bài viết để tự động render lơ lửng (Sửa lỗi số 2)
        this.components.articleCard.render(articlesData);
      }

    } catch (error) {
      console.error("Lỗi trong tiến trình nạp dữ liệu Manifest cấu phần:", error);
    }
  }

  // Phân phối đường dẫn ảnh thật từ Manifest nội bộ vào các Layer DOM tương ứng
  applyParallaxImages(assetsData) {
    if (!assetsData || !assetsData.parallaxImages) return;

    this.config.parallaxLayers.forEach(layer => {
      const element = document.getElementById(`layer-${layer.id}`);
      const assetInfo = assetsData.parallaxImages[layer.id];
      
      if (element && assetInfo && assetInfo.url) {
        element.style.backgroundImage = `url('${assetInfo.url}')`;
      }
    });
  }

  // Kích hoạt Engine đồ họa xử lý không gian Virtual 3D Camera Parallax
  async initParallaxEngine() {
    try {
      const { ParallaxEngine } = await import('./components/parallax.js');
      this.parallaxEngine = new ParallaxEngine(this.config);
      this.parallaxEngine.start();
      
      // Đồng bộ thông số độ nhạy ban đầu từ Settings đã khôi phục vào Parallax Engine
      const initialSens = this.config.hardware.gyroscope.sensitivityX;
      this.parallaxEngine.config.hardware.gyroscope.sensitivityX = initialSens;
      this.parallaxEngine.config.hardware.gyroscope.sensitivityY = initialSens;
      
    } catch (error) {
      console.error("Không thể khởi động bộ lõi đồ họa phối cảnh VR 3D Camera:", error);
    }
  }
}

// Khởi chạy kích hoạt ứng dụng ngay khi DOM cây thư mục sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppOrchestrator();
  app.bootstrap();
});
