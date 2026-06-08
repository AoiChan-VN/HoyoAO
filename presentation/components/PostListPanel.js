/**
 * PostListPanel.js
 * Bảng danh sách bài viết cục bộ, tự động spawn về phía bên TRÁI.
 */
export class PostListPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('post-list-panel');
        this.isSpawned = false;
        
        // Mock cơ sở dữ liệu danh sách bài viết tĩnh nội bộ chạy cục bộ
        this.mockPosts = [
            { id: 'clear-architecture', title: '1. Clear Architecture in VR Core Development', file: 'post1.md' },
            { id: 'cyber-security-dom', title: '2. Cyber Security: Defending DOM against XSS Vectors', file: 'post2.md' },
            { id: 'hardware-gyro-filters', title: '3. Zero-Lag Gyroscope Complementary Filter Logic', file: 'post3.md' }
        ];
    }

    setupDOM() {
        let itemsHtml = '';
        this.mockPosts.forEach(post => {
            itemsHtml += `<div class="post-item" data-id="${post.id}" data-file="${post.file}">${post.title}</div>`;
        });

        this.element.innerHTML = `
            <div class="panel-header">📂 INTERNAL LOCAL ARTICLES</div>
            <div class="panel-content">${itemsHtml}</div>
        `;

        this.element.querySelectorAll('.post-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const file = e.target.getAttribute('data-file');
                const title = e.target.innerText;
                this.controller.readerPanel.spawnAndLoad(file, title);
            });
        });
    }

    spawn() {
        if (this.isSpawned) return;
        this.isSpawned = true;
        this.element.style.display = 'block';
        this.setupDOM();

        // Spawn định vị tự động lệch về hướng bên TRÁI không gian VR
        this.controller.physicsEngine.registerElement(this.element, -450, 0, -500);
    }
}
 
