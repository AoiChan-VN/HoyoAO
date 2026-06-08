export class PostListPanel {
    constructor(controller) {
        this.controller = controller;
        this.element = document.getElementById('post-list-panel');
        this.isSpawned = false;
        this.mockPosts = [
            { id: 'clear-architecture', title: '1. Clear Architecture VR', file: 'post1.md' },
            { id: 'cyber-security-dom', title: '2. Cyber Security DOM', file: 'post2.md' }
        ];
    }

    setupDOM() {
        let itemsHtml = '';
        this.mockPosts.forEach(post => {
            itemsHtml += `<div class="post-item" data-file="${post.file}">${post.title}</div>`;
        });

        this.element.innerHTML = `
            <div class="panel-header">📂 ARTICLES LIST</div>
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
        this.element.style.display = 'block';
        if (this.isSpawned) return;
        this.isSpawned = true;
        this.setupDOM();
        // Thực hiện nạp phần tử vào engine tính toán tọa độ vật lý (đẩy sang bên TRÁI)
        this.controller.physicsEngine.registerElement(this.element, -420, 0, -450);
    }
}
