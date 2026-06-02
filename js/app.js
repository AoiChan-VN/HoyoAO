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

  // Khởi tạo các cấu phần giao diện biệt lập (Sửa lỗi số 4 - Tách rõ file)
  initCoreComponents() {
    // 1. Khởi tạo cấu phần Header & Menu điều hướng
    this.components.header = new HeaderComponent(this.config);

    // 2. Khởi tạo cấu phần Settings Panel (Truyền callback đồng bộ trực tiếp sang Parallax Engine)
    this.components.settings = new SettingsComponent(this.config, (isGyroEnabled) => {
      if (this.parallaxEngine) {
        this.parallaxEngine.toggleGyroscope(isGyroEnabled);
      }
    });

    // 3. Khởi tạo cấu phần quản lý Card bài viết riêng biệt (.MD Loader)
    this.components.articleCard = new ArticleCardComponent(this.config);
  }

  // Tải dữ liệu bất đồng bộ từ các tệp Manifest bên ngoài (Data-Driven Content)
  async loadDynamicManifests() {
    try {
      // Gọi tải song song (Parallel Fetch) tối ưu tốc độ băng thông mạng, chống nghẽn theo Điều 8
      const [assetsRes, articlesRes] = await Promise.all([
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.assets}`),
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.articles}`)
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        // Cập nhật cấu trúc Thẻ ảnh Logo thật và phân phối ảnh cho Parallax (Sửa lỗi số 1 và 3)
        this.components.header.updateDynamicLogo(assetsData);
        this.applyParallaxImages(assetsData);
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        // Truyền dữ liệu manifest sang cấu phần Card bài viết để tự động render lên Grid (Sửa lỗi số 2)
        this.components.articleCard.render(articlesData);
      }

    } catch (error) {
      console.error("Lỗi trong tiến trình nạp dữ liệu Manifest cấu phần:", error);
    }
  }

  // Phân phối đường dẫn ảnh thật từ Manifest vào các Layer DOM tương ứng
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
    } catch (error) {
      console.error("Không thể khởi động bộ lõi đồ họa phối cảnh 3D:", error);
    }
  }
}

// Khởi chạy kích hoạt ứng dụng ngay khi DOM cây thư mục sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppOrchestrator();
  app.bootstrap();
});
 
