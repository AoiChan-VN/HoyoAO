// js/utils/helpers.js

/**
 * Quản lý trạng thái cấu hình xuyên trang (Giải quyết lỗi số 3)
 * Lưu trữ và đồng bộ thiết lập người dùng vào LocalStorage
 */
export const StateManager = {
  save(key, value) {
    try {
      localStorage.setItem(`pure_cfg_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Không thể lưu trạng thái hệ thống:", e);
    }
  },

  load(key, defaultValue) {
    try {
      const saved = localStorage.getItem(`pure_cfg_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error("Không thể tải trạng thái hệ thống:", e);
      return defaultValue;
    }
  }
};

/**
 * Bộ biên dịch Markdown thuần siêu nhẹ (Giải quyết lỗi số 4)
 * Biến đổi chuỗi ký tự thô từ file .md thành cấu trúc HTML5 hợp lệ
 */
export const MarkdownParser = {
  parse(markdownText) {
    if (!markdownText) return "";

    let html = markdownText;

    // 1. Khử mã độc XSS để bảo vệ an toàn hệ thống (Tuân thủ Điều 7)
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Chuyển đổi thẻ Tiêu đề (Headers) từ # đến ###
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // 3. Chuyển đổi chữ đậm (**text**) và chữ nghiêng (*text*)
    html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>");
    html = html.replace(/\*(.*)\*/gim, "<em>$1</em>");

    // 4. Chuyển đổi định dạng khối trích dẫn (Blockquotes: > text)
    html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

    // 5. Chuyển đổi danh sách không thứ tự (Unordered Lists: * item)
    html = html.replace(/^\* (.*$)/gim, "<ul>\n<li>$1</li>\n</ul>");
    html = html.replace(/<\/ul>\s*<ul>/gim, ""); // Gộp các thẻ ul liền kề

    // 6. Chuyển đổi đoạn văn (Paragraphs) cho các dòng văn bản thuần
    html = html.replace(/^\s*(\n)?(.+)/gim, (m, p1, p2) => {
      if (p2.trim().startsWith("<")) return m; // Không bọc nếu đã là thẻ HTML
      return `\n<p>${p2.trim()}</p>`;
    });

    return html.trim();
  },

  /**
   * Đọc file .md từ xa (từ thư mục dự án trên GitHub Pages) và render vào DOM
   * @param {string} filePath - Đường dẫn tới file .md (ví dụ: 'content/blog1.md')
   * @param {string} targetElementId - ID của phần tử nhận HTML kết quả
   */
  async renderContainer(filePath, targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Lỗi tải file: ${response.status}`);
      
      const rawMarkdown = await response.text();
      container.innerHTML = this.parse(rawMarkdown);
    } catch (error) {
      console.error(`Không thể nạp bài viết từ ${filePath}:`, error);
      container.innerHTML = `<div class="error-msg">Không thể tải nội dung bài viết này. Vui lòng thử lại sau.</div>`;
    }
  }
};
 
