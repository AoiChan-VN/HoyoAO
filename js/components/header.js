// js/components/header.js

export class HeaderComponent {
  /**
   * Khởi tạo cấu phần quản lý Header và Điều hướng (MPA Navigation)
   * @param {Object} config - Cấu hình SITE_CONFIG toàn cục
   */
  constructor(config) {
    this.config = config;
    this.dom = {};
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.renderNavigation();
  }

  // Định vị các phần tử DOM cố định thuộc cấu trúc Header
  cacheElements() {
    this.dom = {
      logoContainer: document.getElementById('site-logo'),
      navList: document.getElementById('nav-list')
    };
  }

  /**
   * Cập nhật Logo ảnh thật nội bộ lấy dữ liệu từ Manifest (Sửa dứt điểm lỗi Logo chữ)
   * @param {Object} assetsManifest - Dữ liệu tải động từ assets-manifest.json
   */
  updateDynamicLogo(assetsManifest) {
    if (!this.dom.logoContainer || !assetsManifest || !assetsManifest.uiIcons) return;

    const logoData = assetsManifest.uiIcons.logoImage;
    
    // Nếu trong manifest khai báo đường dẫn ảnh thật nội bộ, tiến hành dựng thẻ <img>
    if (logoData && logoData.url) {
      // Đọc đường dẫn tương đối kết hợp baseEndpoint cấu hình để chống lỗi link trên GitHub Pages
      const fullLogoPath = `${this.config.baseEndpoint}/${logoData.url}`;
      
      this.dom.logoContainer.innerHTML = `
        <img 
          src="${fullLogoPath}" 
          alt="${logoData.alt || this.config.brand.logoText}" 
          class="site-logo-img"
          loading="eager"
        />
      `;
    } else {
      // Cơ chế dự phòng (Fallback) hiển thị chữ nếu file ảnh nội bộ bị thiếu hụt
      this.dom.logoContainer.textContent = this.config.brand.logoText;
    }

    this.dom.logoContainer.href = `${this.config.baseEndpoint}/${this.config.brand.logoUrl}`;
  }

  // Tự động dựng hệ thống Menu điều hướng Multi-Page (Data-Driven UI - Phân tách trang rạch ròi)
  renderNavigation() {
    if (!this.dom.navList || !this.config.navigation) return;

    this.dom.navList.innerHTML = this.config.navigation
      .map(nav => {
        const path = window.location.pathname;
        
        // Thuật toán kiểm tra trang hiện tại để gán class active chính xác cho cấu trúc MPA độc lập
        let isCurrentPage = false;
        if (nav.path === 'index.html') {
          isCurrentPage = path.endsWith('index.html') || path.endsWith('/') || path === '';
        } else {
          isCurrentPage = path.endsWith(nav.path);
        }
        
        const activeClass = isCurrentPage ? 'class="active"' : '';
        const fullNavPath = `${this.config.baseEndpoint}/${nav.path}`;
        
        return `<li><a href="${fullNavPath}" ${activeClass}>${nav.label}</a></li>`;
      })
      .join('');
  }
}
