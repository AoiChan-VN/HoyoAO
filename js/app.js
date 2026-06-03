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
    this.isHomePage = false;
  }

  // Khởi chạy vòng đời toàn hệ thống ứng dụng Multi-Page
  async bootstrap() {
    this.checkCurrentPage(); // 1. Xác định trang hiện tại trước khi dựng UI
    this.initCoreComponents(); // 2. Khởi tạo cấu phần theo từng trang biệt lập
    await this.loadDynamicManifests();
    await this.initParallaxEngine();
  }

  // Thuật toán kiểm tra định tuyến URL thực tế của GitHub Pages (Sửa lỗi lộn xộn xuyên trang)
  checkCurrentPage() {
    const path = window.location.pathname;
    // Trang chủ là khi path kết thúc bằng index.html, hoặc chạy ở root '/' trên GitHub Pages
    this.isHomePage = path.endsWith('index.html') || path.endsWith('/') || path === '';
  }

  // Khởi tạo các cấu phần giao diện biệt lập (Phân rõ nhiệm vụ quản lý - Sửa lỗi số 4)
  initCoreComponents() {
    // 1. Khởi tạo cấu phần Header & Menu điều hướng (Xuất hiện ở mọi trang)
    this.components.header = new HeaderComponent(this.config);

    // 2. Khởi tạo cấu phần Settings Dashboard nâng cao (Xuất hiện ở mọi trang)
    this.components.settings = new SettingsComponent(this.config, {
      onGyroChange: (isEnabled) => {
        if (this.parallaxEngine) this.parallaxEngine.toggleGyroscope(isEnabled);
      },
      onSensitivityChange: (newSensitivity) => {
        if (this.parallaxEngine) {
          this.parallaxEngine.config.hardware.gyroscope.sensitivityX = newSensitivity;
          this.parallaxEngine.config.hardware.gyroscope.sensitivityY = newSensitivity;
        }
      },
      // HÀM MỚI: Xử lý nút bấm Ẩn/Hiện toàn bộ UI Card từ Dashboard cài đặt
      onToggleUI: (isHideAll) => {
        const cards = document.querySelectorAll('.pure-article-card, #md-content-viewport');
        cards.forEach(card => {
          if (isHideAll) {
            card.classList.add('ui-elements-hidden');
          } else {
            card.classList.remove('ui-elements-hidden');
          }
        });
      }
    });

    // 3. KIỂM TRA ĐỊNH TUYẾN: Chỉ khởi tạo cấu phần Card bài viết tại Trang Chủ (Sửa lỗi trang nào cũng hiện)
    if (this.isHomePage) {
      this.components.articleCard = new ArticleCardComponent(this.config);
    }
  }

  // Tải dữ liệu bất đồng bộ từ các tệp Manifest nội bộ (Tách biệt dữ liệu môi trường theo Điều 5)
  async loadDynamicManifests() {
    try {
      // Thiết lập danh sách gọi fetch bất đồng bộ
      const fetchPromises = [
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.assets}`)
      ];

      // CHỈ TẢI MANIFEST BÀI VIẾT KHI ĐANG Ở TRANG CHỦ (Tiết kiệm băng thông, bảo vệ hạ tầng theo Điều 8)
      if (this.isHomePage) {
        fetchPromises.push(fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.articles}`));
      }

      const responses = await Promise.all(fetchPromises);

      // Xử lý nạp Manifest tài nguyên ảnh thật (Áp dụng cho tất cả các trang)
      if (responses[0].ok) {
        const assetsData = await responses[0].json();
        this.components.header.updateDynamicLogo(assetsData);
        this.applyParallaxImages(assetsData);
      }

      // Xử lý nạp danh mục bài viết Markdown (Chỉ thực thi tại Trang Chủ)
      if (this.isHomePage && responses[1] && responses[1].ok) {
        const articlesData = await responses[1].json();
        this.components.articleCard.render(articlesData);
      }

    } catch (error) {
      console.error("Lỗi nghẽn luồng trong tiến trình nạp dữ liệu Manifest:", error);
    }
  }

  // Phân phối đường dẫn ảnh thật nội bộ từ Manifest vào các Layer DOM tương ứng
  applyParallaxImages(assetsData) {
    if (!assetsData || !assetsData.parallaxImages) return;

    this.config.parallaxLayers.forEach(layer => {
      const element = document.getElementById(`layer-${layer.id}`);
      const assetInfo = assetsData.parallaxImages[layer.id];
      
      if (element && assetInfo && assetInfo.url) {
        element.style.backgroundImage = `url('${this.config.baseEndpoint}/${assetInfo.url}')`;
      }
    });
  }

  // Kích hoạt Engine đồ họa xử lý ma trận xoay phối cảnh VR 3D Camera
  async initParallaxEngine() {
    try {
      const { ParallaxEngine } = await import('./components/parallax.js');
      this.parallaxEngine = new ParallaxEngine(this.config);
      this.parallaxEngine.start();
      
      // Đồng bộ thông số độ nhạy ban đầu từ Dashboard Settings vào vòng lặp đồ họa
      const initialSens = this.config.hardware.gyroscope.sensitivityX;
      this.parallaxEngine.config.hardware.gyroscope.sensitivityX = initialSens;
      this.parallaxEngine.config.hardware.gyroscope.sensitivityY = initialSens;
      
    } catch (error) {
      console.error("Không thể kích hoạt bộ lõi đồ họa phối cảnh VR 3D Camera:", error);
    }
  }
}

// Khởi chạy kích hoạt ứng dụng ngay khi DOM cây thư mục sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppOrchestrator();
  app.bootstrap();
});
