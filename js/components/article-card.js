// js/components/article-card.js
import { MarkdownParser } from '../utils/helpers.js';

export class ArticleCardComponent {
  /**
   * Khởi tạo cấu phần quản lý Card bài viết tương tác VR
   * @param {Object} config - Cấu hình SITE_CONFIG toàn cục
   */
  constructor(config) {
    this.config = config;
    this.container = document.getElementById('layer-fg-content');
    this.articlesData = null;
  }

  /**
   * Nạp danh mục dữ liệu và render các khối Card biệt lập lơ lửng
   * @param {Object} articlesManifest - Dữ liệu tải từ articles-manifest.json
   */
  render(articlesManifest) {
    if (!this.container || !articlesManifest || !articlesManifest.articles) return;
    this.articlesData = articlesManifest.articles;

    // Duyệt mảng dữ liệu để sinh ra từng khối Card độc lập lơ lửng trong lớp tiền cảnh
    this.articlesData.forEach((article, index) => {
      const cardElement = document.createElement('article');
      cardElement.className = 'pure-article-card';
      cardElement.id = `card-${article.id}`;
      
      // Tính toán vị trí so le ban đầu để các card không đè lên nhau khi khởi động
      const offsetTop = 120 + (index * 160);
      const offsetLeft = 40 + (index * 30);
      cardElement.style.top = `${offsetTop}px`;
      cardElement.style.left = `${offsetLeft}px`;

      // Cấu trúc HTML của card biệt lập (Sửa lỗi số 2)
      cardElement.innerHTML = `
        <div class="card-header-drag">
          <span class="card-badge">.MD VR Content</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">☰ Drag</span>
        </div>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.description}</p>
        <button class="read-more-btn" data-file="${article.filePath}">Mở nội dung</button>
      `;

      this.container.appendChild(cardElement);
      
      // Kích hoạt tính năng kéo thả cho riêng khối Card này (Sửa lỗi số 3)
      this.makeElementDraggable(cardElement);
    });

    // Tạo sẵn một khối Viewport đọc bài viết dạng Modal bay tự do trong không gian
    this.createViewportModal();
  }

  // Khởi tạo khung hiển thị văn bản Markdown dạng một vật thể lơ lửng tự do
  createViewportModal() {
    const viewport = document.createElement('div');
    viewport.id = 'md-content-viewport';
    viewport.className = 'md-viewport-hidden';
    viewport.style.top = '150px';
    viewport.style.right = '40px'; // Định vị ban đầu ở bên sườn phải màn hình

    viewport.innerHTML = `
      <div class="card-header-drag" style="cursor: grab;">
        <span style="font-size: 0.7rem; color: var(--accent-color); font-weight: 700;">📄 Bài viết (.md)</span>
        <button class="viewport-close-btn">✕</button>
      </div>
      <div id="md-render-target"></div>
    `;

    this.container.appendChild(viewport);
    this.makeElementDraggable(viewport); // Khung đọc bài viết cũng có thể kéo vứt đi chỗ khác được
    this.bindViewportEvents(viewport);
  }

  // Lắng nghe sự kiện click mở nội dung bài viết
  bindViewportEvents(viewport) {
    const renderTarget = viewport.querySelector('#md-render-target');
    const closeBtn = viewport.querySelector('.viewport-close-btn');

    // Bắt sự kiện click nút "Mở nội dung" trên tất cả các Card
    this.container.addEventListener('click', async (e) => {
      if (e.target && e.target.classList.contains('read-more-btn')) {
        const filePath = e.target.getAttribute('data-file');
        if (!renderTarget) return;

        viewport.classList.remove('md-viewport-hidden');
        viewport.classList.add('md-viewport-visible');

        // Biên dịch Markdown sang HTML và đẩy vào target
        const fullPath = `${this.config.baseEndpoint}/${filePath}`;
        await MarkdownParser.renderContainer(fullPath, 'md-render-target');
      }
    });

    // Đóng khung viewport
    closeBtn?.addEventListener('click', () => {
      viewport.classList.remove('md-viewport-visible');
      viewport.classList.add('md-viewport-hidden');
      if (renderTarget) renderTarget.innerHTML = '';
    });
  }

  /**
   * Bộ Thuật Toán Kéo Thả Vật Thể Tương Thích PC (Chuột) & Mobile (Touch) (Sửa lỗi số 3)
   * @param {HTMLElement} el - Phần tử DOM cần kích hoạt tính năng nắm gắp di chuyển
   */
  makeElementDraggable(el) {
    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    // Tìm kiếm vùng ghim kéo tiêu đề, nếu không có thì cho phép kéo toàn card
    const dragHeader = el.querySelector('.card-header-drag');
    if (dragHeader) {
      dragHeader.addEventListener('mousedown', dragMouseDown);
      dragHeader.addEventListener('touchstart', dragTouchStart, { passive: false });
    } else {
      el.addEventListener('mousedown', dragMouseDown);
      el.addEventListener('touchstart', dragTouchStart, { passive: false });
    }

    // --- XỬ LÝ TRÊN MÁY TÍNH (MOUSE) ---
    function dragMouseDown(e) {
      e.preventDefault();
      // Đưa card lên trên cùng bằng cách tăng z-index khi tương tác
      document.querySelectorAll('.pure-article-card, #md-content-viewport').forEach(c => c.style.zIndex = '10');
      el.style.zIndex = '40';

      mouseX = e.clientX;
      mouseY = e.clientY;
      
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
      e.preventDefault();
      posX = mouseX - e.clientX;
      posY = mouseY - e.clientY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Gán tọa độ dịch chuyển trực tiếp lên style vật thể
      el.style.top = `${el.offsetTop - posY}px`;
      el.style.left = `${el.offsetLeft - posX}px`;
    }

    function closeDragElement() {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    }

    // --- XỬ LÝ TRÊN ĐIỆN THOẠI (TOUCH CRITICAL) ---
    function dragTouchStart(e) {
      // Đưa card lên trên cùng
      document.querySelectorAll('.pure-article-card, #md-content-viewport').forEach(c => c.style.zIndex = '10');
      el.style.zIndex = '40';

      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;

      el.addEventListener('touchend', closeTouchElement, { passive: true });
      el.addEventListener('touchmove', elementTouchDrag, { passive: false });
    }

    function elementTouchDrag(e) {
      e.preventDefault(); // Ngăn trình duyệt cuộn trang mặc định, giữ độ bám cho ngón tay kéo card VR
      const touch = e.touches[0];
      
      posX = mouseX - touch.clientX;
      posY = mouseY - touch.clientY;
      mouseX = touch.clientX;
      mouseY = touch.clientY;

      el.style.top = `${el.offsetTop - posY}px`;
      el.style.left = `${el.offsetLeft - posX}px`;
    }

    function closeTouchElement() {
      el.removeEventListener('touchend', closeTouchElement);
      el.removeEventListener('touchmove', elementTouchDrag);
    }
  }
}
