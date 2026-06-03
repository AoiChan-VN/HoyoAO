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
    this.currentPage = ''; // Quản lý chu trình trang hiện tại
  }

  // Khởi chạy vòng đời toàn hệ thống ứng dụng Multi-Page
  async bootstrap() {
    this.routePageDetect(); // 1. Nhận diện chính xác trang người dùng đang đứng
    this.initCoreComponents(); // 2. Khởi tạo cấu phần phân vùng nhiệm vụ (Trang nào ra trang đó)
    await this.loadDynamicManifests();
    await this.initParallaxEngine();
  }

  // Thuật toán định tuyến phân tách trang (Sửa lỗi lộn xộn nội dung)
  routePageDetect() {
    const path = window.location.pathname;
    
    if (path.endsWith('about.html')) {
      this.currentPage = 'about';
    } else if (path.endsWith('contact.html')) {
      this.currentPage = 'contact';
    } else if (path.endsWith('404.html')) {
      this.currentPage = '404';
    } else {
      // Mặc định là trang chủ khi chạy root '/' hoặc index.html trên GitHub Pages
      this.currentPage = 'home';
    }
  }

  // Khởi tạo các cấu phần giao diện biệt lập (Tuân thủ Điều 4 và Điều 10)
  initCoreComponents() {
    // Header và Settings Panel xuất hiện đồng bộ ở mọi trang để giữ cấu trúc ứng dụng
    this.components.header = new HeaderComponent(this.config);

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
      // Xử lý nút gạt Ẩn/Hiện UI khi người dùng muốn ngắm không gian 3D thuần túy
      onToggleUI: (isHideAll) => {
        const dashboard = document.querySelector('.hero-content, .pure-articles-section, #md-content-viewport');
        if (dashboard) {
          if (isHideAll) {
            dashboard.classList.add('ui-elements-hidden');
          } else {
            dashboard.classList.remove('ui-elements-hidden');
          }
        }
      }
    });

    // SỬA ĐỔI QUAN TRỌNG: Phân tách rạch ròi vị trí xuất hiện cấu phần (Trang nào ra trang đó)
    if (this.currentPage === 'home') {
      // Trang chủ SẠCH TUYỆT ĐỐI - Dọn sạch vùng nội dung để lộ không gian VR 360° đắm chìm
      this.cleanHomeContent();
    } else if (this.currentPage === 'about') {
      // CHỈ KHỞI TẠO CẤU PHẦN CARD BÀI VIẾT TẠI TRANG GIỚI THIỆU (ABOUT PAGE)
      this.components.articleCard = new ArticleCardComponent(this.config);
    }
  }

  // Hàm dọn sạch ruột trang chủ, chỉ giữ lại câu chào lơ lửng tối giản
  cleanHomeContent() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.innerHTML = `
        <h1>${this.config.brand.title}</h1>
        <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 5px;">Xoay thiết bị hoặc di chuột để khám phá không gian 360° VR</p>
      `;
    }
  }

  // Tải dữ liệu bất đồng bộ từ các tệp Manifest nội bộ (Tách biệt nợ kỹ thuật theo Điều 5)
  async loadDynamicManifests() {
    try {
      const fetchPromises = [
        fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.assets}`)
      ];

      // Chỉ gọi fetch manifest bài viết .md khi người dùng truy cập trang GIỚI THIỆU (ABOUT)
      if (this.currentPage === 'about') {
        fetchPromises.push(fetch(`${this.config.baseEndpoint}/${this.config.manifestSources.articles}`));
      }

      const responses = await Promise.all(fetchPromises);

      // Nạp và xử lý Manifest tài nguyên ảnh thật (Áp dụng cho mọi trang)
      if (responses[0].ok) {
        const assetsData = await responses[0].json();
        this.components.header.updateDynamicLogo(assetsData);
        this.applyParallaxImages(assetsData);
      }

      // Nạp dữ liệu và tiến hành render danh sách Card bài viết riêng biệt (Chỉ chạy tại trang ABOUT)
      if (this.currentPage === 'about' && responses[1] && responses[1].ok) {
        const articlesData = await responses[1].json();
        this.components.articleCard.render(articlesData);
      }

    } catch (error) {
      console.error("Lỗi luồng trong tiến trình nạp dữ liệu Manifest cấu phần:", error);
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
 
