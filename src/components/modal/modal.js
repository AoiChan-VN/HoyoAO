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
            const isGitHubPages = window.location.hostname.includes('github.io');
            let basePath = '';
            
            if (isGitHubPages) {
                const pathSegments = window.location.pathname.split('/');
                const repoName = pathSegments[1];
                basePath = `/${repoName}/`;
            } else {
                basePath = '/';
            }

            const cleanBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
            const response = await fetch(`${window.location.origin}${cleanBasePath}src/assets/content/${type}.md`);
            
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
            <link rel="stylesheet" href="./src/components/modal/modal.css">
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
