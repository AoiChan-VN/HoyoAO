import { BaseComponent } from './BaseComponent.js';
import { MarkdownParser } from '../parsers/MarkdownParser.js';

export class Modal extends BaseComponent {
    constructor(container, store, eventBus) {
        super(container, store, eventBus);
        this.parser = new MarkdownParser();
    }

    shouldUpdate(currentState, prevState) {
        return currentState.activeModalPost !== prevState.activeModalPost;
    }

    async render() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'modal-overlay interactive-element';
            this.container.appendChild(this.element);
        }

        const { activeModalPost } = this.store.state;

        if (!activeModalPost) {
            this.element.classList.remove('open');
            document.body.classList.remove('body-locked');
            this.element.innerHTML = '';
            return;
        }

        this.element.classList.add('open');
        document.body.classList.add('body-locked');

        this.element.innerHTML = `
            <div class="modal-container glass-panel">
                <div class="modal-header">
                    <h3 id="modal-title">Đang tải nội dung...</h3>
                    <button class="close-btn" id="modal-close-idx">&times;</button>
                </div>
                <div class="modal-content no-scrollbar" id="modal-body-content">
                    <p style="color: var(--text-secondary);">Vui lòng đợi trong giây lát...</p>
                </div>
            </div>
        `;

        this.setupEventListeners();
        await this.loadAndParseContent(activeModalPost);
    }

    async loadAndParseContent(fileName) {
        const titleElement = this.element.querySelector('#modal-title');
        const contentElement = this.element.querySelector('#modal-body-content');

        try {
            const response = await fetch(`./assets/data/posts/${fileName}`);
            if (!response.ok) {
                throw new Error(`Failed to load markdown file: ${response.status}`);
            }
            
            const rawMarkdown = await response.text();
            const compiledHtml = this.parser.parse(rawMarkdown);
            
            if (contentElement) {
                contentElement.innerHTML = compiledHtml;
                
                const firstHeading = contentElement.querySelector('h1, h2');
                if (firstHeading && titleElement) {
                    titleElement.textContent = firstHeading.textContent;
                    firstHeading.remove();
                } else if (titleElement) {
                    titleElement.textContent = 'Chi tiết nội dung';
                }
            }
        } catch (error) {
            console.error(error);
            if (contentElement) {
                contentElement.innerHTML = `<p style="color: var(--danger);">Không thể nạp nội dung bài viết ngoại tuyến.</p>`;
            }
            if (titleElement) {
                titleElement.textContent = 'Lỗi hệ thống';
            }
        }
    }

    setupEventListeners() {
        const closeBtn = this.element.querySelector('#modal-close-idx');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.eventBus.emit('UI_CLOSE_MODAL');
            });
        }

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.eventBus.emit('UI_CLOSE_MODAL');
            }
        });
    }
}
 
