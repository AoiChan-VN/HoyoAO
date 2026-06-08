/**
 * ReaderPanel.js
 * Bảng hiển thị nội dung bài viết tĩnh đã xử lý qua bộ lọc bảo mật, spawn phía bên PHẢI.
 */
import { MarkdownSanitizer } from '../../infrastructure/MarkdownSanitizer.js';

export class ReaderPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('reader-panel');
        this.isSpawned = false;
    }

    setupDOM(title, cleanHtml) {
        this.element.innerHTML = `
            <div class="panel-header">📖 READING: ${title}</div>
            <div class="panel-content secure-dom-view">${cleanHtml}</div>
        `;
    }

    async spawnAndLoad(fileName, title) {
        this.element.style.display = 'block';
        this.setupDOM(title, "<p class='loading-text'>Cơ chế Sandbox: Đang tải và kiểm duyệt cấu trúc tệp dữ liệu an toàn...</p>");

        if (!this.isSpawned) {
            this.isSpawned = true;
            // Tự động định vị spawn lệch sang hướng bên PHẢI trong không gian phối cảnh 3D
            this.controller.physicsEngine.registerElement(this.element, 450, 0, -500);
        }

        try {
            // Thực hiện Fetch tài nguyên cục bộ đúng cấu trúc thư mục assets/posts/
            const response = await fetch(`./assets/posts/${fileName}`);
            if (!response.ok) throw new Error("Tệp mã nguồn bài viết tĩnh không tồn tại.");
            
            const rawMarkdown = await response.text();
            
            // Xử lý dịch ngược mã và thanh lọc XSS nghiêm ngặt qua lõi lọc Sanitizer
            const safeContentHtml = MarkdownSanitizer.parseAndSanitize(rawMarkdown);
            this.setupDOM(title, safeContentHtml);

        } catch (error) {
            this.setupDOM(title, `<p style="color: #ff6b6b;">Lỗi bảo mật/Hệ thống: ${error.message}</p>`);
        }
    }
}
 
