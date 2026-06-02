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

  // Định vị các phần tử DOM cố định thuộc Header
  cacheElements() {
    this.dom = {
      logoContainer: document.getElementById('site-logo'),
      navList: document.getElementById('nav-list')
    };
  }

  /**
   * Cập nhật Logo ảnh thật lấy dữ liệu từ Manifest (Giải quyết lỗi số 3)
   * @param {Object} assetsManifest - Dữ liệu tải động từ assets-manifest.json
   */
  updateDynamicLogo(assetsManifest) {
    if (!this.dom.logoContainer || !assetsManifest || !assetsManifest.uiIcons) return;

    const logoData = assetsManifest.uiIcons.logoImage;
    
    // Nếu trong manifest khai báo đường dẫn ảnh thật, tiến hành chèn thẻ <img>
    if (logoData && logoData.url) {
      this.dom.logoContainer.innerHTML = `
        <img 
          src="${logoData.url}" 
          alt="${logoData.alt || this.config.brand.logoText}" 
          class="site-logo-img"
          loading="eager"
        />
      `;
    } else {
      // Cơ chế dự phòng (Fallback) hiển thị chữ nếu link ảnh bị lỗi mạng
      this.dom.logoContainer.textContent = this.config.brand.logoText;
    }

    this.dom.logoContainer.href = this.config.brand.logoUrl;
  }

  // Tự động dựng hệ thống Menu điều hướng MPA (Data-Driven UI)
  renderNavigation() {
    if (!this.dom.navList || !this.config.navigation) return;

    this.dom.navList.innerHTML = this.config.navigation
      .map(nav => {
        // Kiểm tra trang hiện tại để gán class active chính xác cho cấu trúc MPA
        const isCurrentPage = window.location.pathname.endsWith(nav.path) || 
                              (window.location.pathname === '/' && nav.path === 'index.html');
        const activeClass = isCurrentPage ? 'class="active"' : '';
        return `<li><a href="${nav.path}" ${activeClass}>${nav.label}</a></li>`;
      })
      .join('');
  }
}
 
