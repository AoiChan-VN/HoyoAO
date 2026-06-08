/**
 * PostListPanel.js
 * Bảng quản lý danh sách bài viết tĩnh, tự động định vị sang bên TRÁI không gian khi kích hoạt.
 */
export class PostListPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('post-list-panel');
        this.isSpawned = false;
        this.mockPosts = [
            { id: 'clear-architecture', title: '1. Clear Architecture in VR Core', file: 'post1.md' },
            { id: 'cyber-security-dom', title: '2. Cyber Security: Anti-XSS Engine', file: 'post2.md' },
            { id: 'hardware-gyro-filters', title: '3. Zero-Lag Gyroscope Filter', file: 'post3.md' }
        ];
    }

    setupDOM() {
        let itemsHtml = '';
        this.mockPosts.forEach(post => {
            itemsHtml += `<div class="post-item" data-file="${post.file}">${post.title}</div>`;
        });

        this.element.innerHTML = `
            <div class="panel-header">📂 INTERNAL LOCAL ARTICLES</div>
            <div class="panel-content">${itemsHtml}</div>
        `;

        this.element.querySelectorAll('.post-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const file = e.currentTarget.getAttribute('data-file');
                const title = e.currentTarget.innerText;
                this.controller.readerPanel.spawnAndLoad(file, title);
            });
        });
    }

    spawn() {
        this.element.style.display = 'block';
        this.setupDOM();
        this.isSpawned = true;
        // Đưa thực thể vào bộ xử lý vật lý kéo thả tự do, gán lệch sang bên TRÁI (X: -420)
        this.controller.physicsEngine.registerElement(this.element, -420, 0, -450);
    }
}
