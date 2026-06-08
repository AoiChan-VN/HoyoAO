/**
 * ReaderPanel.js
 * Bảng xử lý đọc nội dung tệp tin, tự động định vị sang bên PHẢI không gian khi kích hoạt.
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
        this.setupDOM(title, "<p class='loading-text'>Cơ chế Sandbox: Đang tải dữ liệu tệp tin an toàn...</p>");

        // Đóng đăng ký tọa độ cố định lệch sang bên PHẢI (X: 420)
        this.controller.physicsEngine.registerElement(this.element, 420, 0, -450);
        this.isSpawned = true;

        try {
            const response = await fetch(`./assets/posts/${fileName}`);
            if (!response.ok) throw new Error("Tệp tin bài viết tĩnh không tồn tại hoặc bị lỗi tải.");
            
            const rawMarkdown = await response.text();
            const safeContentHtml = MarkdownSanitizer.parseAndSanitize(rawMarkdown);
            this.setupDOM(title, safeContentHtml);
        } catch (error) {
            this.setupDOM(title, `<p style="color: #ff6b6b; font-weight:bold;">Lỗi hệ thống: ${error.message}</p>`);
        }
    }
}
