import { VRMarkdownParser } from '../../core/markdown.js';

export class VRStatusModal extends HTMLElement {
    static get observedAttributes() {
        return ['open', 'data-type', 'data-title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.parser = new VRMarkdownParser();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name) {
        if (name === 'open') {
            this._toggleVisibility();
        } else if (name === 'data-type') {
            this._loadFullContent();
        }
    }

    _toggleVisibility() {
        const isOpen = this.getAttribute('open') === 'true';
        const wrapper = this.shadowRoot.getElementById('modal-wrapper');
        if (!wrapper) return;

        if (isOpen) {
            wrapper.classList.add('visible');
        } else {
            wrapper.classList.remove('visible');
        }
    }

    async _loadFullContent() {
        const type = this.getAttribute('data-type');
        const contentContainer = this.shadowRoot.getElementById('modal-body');
        if (!type || !contentContainer) return;

        try {
            const response = await fetch(`./src/assets/content/${type}.md`);
            if (!response.ok) throw new Error();
            const markdown = await response.text();
            contentContainer.innerHTML = this.parser.parse(markdown);
        } catch {
            contentContainer.innerHTML = '<p style="color:var(--text-secondary)">Content error.</p>';
        }
    }

    _close() {
        this.setAttribute('open', 'false');
    }

    render() {
        const title = this.getAttribute('data-title') || 'Detail';
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    pointer-events: none;
                    transition: var(--transition-ui-normal);
                    z-index: var(--z-index-modal);
                }
                .modal-overlay.visible {
                    opacity: 1;
                    pointer-events: auto;
                }
                .modal-box {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color-active);
                    border-radius: var(--modal-radius);
                    width: 90vw;
                    max-width: 650px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-panel), var(--shadow-neon);
                    transform: scale(0.9) translateY(20px);
                    transition: var(--transition-ui-normal);
                }
                .modal-overlay.visible .modal-box {
                    transform: scale(1) translateY(0);
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-title {
                    font-size: 18px;
                    color: var(--text-accent);
                    font-family: var(--font-mono);
                }
                .close-btn {
                    color: var(--text-muted);
                    font-size: 24px;
                    line-height: 1;
                }
                .close-btn:hover {
                    color: var(--text-secondary);
                }
                .modal-body {
                    padding: 24px;
                    overflow-y: auto;
                    color: var(--text-main);
                    font-size: 15px;
                }
                .modal-body h1, .modal-body h2 { color: var(--text-accent); margin: 16px 0 8px; }
                .modal-body p { margin-bottom: 12px; line-height: 1.6; }
                .modal-body ul { margin-left: 20px; margin-bottom: 12px; list-style: square; }
                .modal-body li { margin-bottom: 6px; }
            </style>
            <div class="modal-overlay" id="modal-wrapper">
                <div class="modal-box">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                        <button class="close-btn" id="close-modal">&times;</button>
                    </div>
                    <div class="modal-body" id="modal-body">Loading...</div>
                </div>
            </div>
        `;

        this.shadowRoot.getElementById('close-modal').addEventListener('click', () => this._close());
        this.shadowRoot.getElementById('modal-wrapper').addEventListener('click', (e) => {
            if (e.target.id === 'modal-wrapper') this._close();
        });
    }
}
 
