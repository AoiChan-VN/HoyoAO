// js/components/article-card.js
import { MarkdownParser } from '../utils/helpers.js';

export class ArticleCardComponent {
  /**
   * Khởi tạo cấu phần quản lý Card bài viết động
   * @param {Object} config - Cấu hình SITE_CONFIG toàn cục
   */
  constructor(config) {
    this.config = config;
    this.container = document.getElementById('layer-fg-content');
    this.articlesData = null;
  }

  /**
   * Nạp danh mục và khởi chạy tiến trình render cấu phần
   * @param {Object} articlesManifest - Dữ liệu thô đọc về từ articles-manifest.json
   */
  render(articlesManifest) {
    if (!this.container || !articlesManifest || !articlesManifest.articles) return;
    this.articlesData = articlesManifest.articles;

    // Định vị hoặc khởi tạo vùng chứa danh sách Card bài viết bên trong Hero Content
    const heroContent = this.container.querySelector('.hero-content');
    if (!heroContent) return;

    // Khởi tạo khối bọc danh sách Card riêng biệt
    const articlesSection = document.createElement('div');
    articlesSection.className = 'pure-articles-section';

    // Tạo cấu trúc danh sách Card bài viết độc lập (Tách biệt hoàn toàn HTML ra khỏi app.js)
    articlesSection.innerHTML = `
      <h2 class="section-title">Bài Viết Mới Nhất</h2>
      <div class="articles-grid">
        ${this.articlesData.map(article => this.createCardHTML(article)).join('')}
      </div>
      <div id="md-content-viewport" class="md-viewport-hidden">
        <button id="close-viewport-btn" class="viewport-close-btn" aria-label="Đóng bài viết">✕</button>
        <div id="md-render-target"></div>
      </div>
    `;

    heroContent.appendChild(articlesSection);
    this.bindCardEvents(articlesSection);
  }

  /**
   * Tạo chuỗi HTML cấu trúc cho từng Card bài viết riêng biệt (Giải quyết lỗi số 2)
   * @param {Object} article - Dữ liệu một bài viết đơn lẻ
   * @returns {string} Chuỗi mã HTML của Card
   */
  createCardHTML(article) {
    return `
      <article class="pure-article-card" data-file="${article.filePath}">
        <div class="card-badge">.MD Driven</div>
        <div class="card-body">
          <h3 class="card-title">${article.title}</h3>
          <p class="card-excerpt">${article.description}</p>
        </div>
        <div class="card-footer">
          <span class="read-more-text">Đọc bài viết →</span>
        </div>
      </article>
    `;
  }

  /**
   * Lắng nghe sự kiện tương tác kích hoạt đọc và đóng bài viết
   * @param {HTMLElement} sectionElement - Vùng DOM chứa danh sách bài viết
   */
  bindCardEvents(sectionElement) {
    const viewport = sectionElement.querySelector('#md-content-viewport');
    const renderTarget = sectionElement.querySelector('#md-render-target');
    const closeBtn = sectionElement.querySelector('#close-viewport-btn');

    // Sự kiện Click vào từng Card bài viết riêng biệt
    sectionElement.querySelectorAll('.pure-article-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        const filePath = e.currentTarget.getAttribute('data-file');
        if (!viewport || !renderTarget) return;

        // Hiển thị khung Viewport nội dung bài viết
        viewport.classList.remove('md-viewport-hidden');
        viewport.classList.add('md-viewport-visible');
        
        // Gọi bộ chuyển đổi Markdown thuần để bắn nội dung vào DOM target
        const fullPath = `${this.config.baseEndpoint}/${filePath}`;
        await MarkdownParser.renderContainer(fullPath, 'md-render-target');
        
        // Cuộn mượt màn hình tới nội dung bài viết vừa mở
        viewport.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Sự kiện Click nút đóng khung nội dung bài viết
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (viewport) {
        viewport.classList.remove('md-viewport-visible');
        viewport.classList.add('md-viewport-hidden');
        if (renderTarget) renderTarget.innerHTML = '';
        
        // Cuộn ngược nhẹ nhàng về vùng thông tin chính
        this.container.querySelector('.cta-actions')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
 
