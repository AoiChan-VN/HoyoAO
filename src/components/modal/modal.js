import { VRMarkdownParser } from '../../core/markdown.js';

export class VRStatusModal extends HTMLElement {
    static get observedAttributes() {
        return ['open', 'data-type', 'data-title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.parser = new VRMarkdownParser();
        this._initialized = false;
        this._handleCloseIntent = this._handleCloseIntent.bind(this);
    }

    connectedCallback() {
        if (!this._initialized) {
            this.render();
            this._setupEventDelegation();
            this._initialized = true;
        }
    }

    disconnectedCallback() {
        const wrapper = this.shadowRoot.getElementById('modal-wrapper');
        if (wrapper) {
            wrapper.removeEventListener('click', this._handleCloseIntent);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        if (name === 'open') {
            this._toggleVisibility();
        } else if (name === 'data-type' && this._initialized) {
            this._loadFullContent();
        }
    }

    _toggleVisibility() {
        const wrapper = this.shadowRoot.getElementById('modal-wrapper');
        if (!wrapper) return;

        const isOpen = this.getAttribute('open') === 'true';
        if (isOpen) {
            wrapper.classList.add('visible');
            const titleNode = this.shadowRoot.getElementById('modal-title-text');
            if (titleNode) {
                titleNode.innerText = this.getAttribute('data-title') || 'Detail';
            }
            this._loadFullContent();
        } else {
            wrapper.classList.remove('visible');
        }
    }

    async _loadFullContent() {
        const type = this.getAttribute('data-type');
        const contentContainer = this.shadowRoot.getElementById('modal-body');
        if (!type || !contentContainer) return;

        try {
            contentContainer.innerHTML = '<p style="color:var(--text-accent)">LOADING DATABASE...</p>';
            
            const isGitHubPages = window.location.hostname.includes('github.io');
            let basePath = '';
            
            if (isGitHubPages) {
                const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
                if (pathSegments.length > 0) {
                    basePath = `/${pathSegments[0]}/`;
                } else {
                    basePath = '/';
                }
            } else {
                basePath = '/';
            }

            const cleanBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
            const requestUrl = `${window.location.origin}${cleanBasePath}src/assets/content/${type}.md`;
            
            const response = await fetch(requestUrl);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const markdown = await response.text();
            contentContainer.innerHTML = this.parser.parse(markdown);
        } catch (error) {
            console.error("[Modal Core Fetch Failure]:", error);
            contentContainer.innerHTML = '<p style="color:var(--text-secondary)">SYSTEM ERROR: FAILED TO LOAD DOCUMENT.</p>';
        }
    }

    _setupEventDelegation() {
        const wrapper = this.shadowRoot.getElementById('modal-wrapper');
        if (wrapper) {
            wrapper.addEventListener('click', this._handleCloseIntent);
        }
    }

    _handleCloseIntent(e) {
        e.stopPropagation();
        const isCloseBtn = e.target.id === 'close-modal';
        const isOverlay = e.target.id === 'modal-wrapper';
        
        if (isCloseBtn || isOverlay) {
            this.setAttribute('open', 'false');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./src/components/modal/modal.css">
            <div class="modal-overlay" id="modal-wrapper">
                <div class="modal-box">
                    <div class="modal-header">
                        <div class="modal-title" id="modal-title-text">Detail</div>
                        <button class="close-btn" id="close-modal">&times;</button>
                    </div>
                    <div class="modal-body" id="modal-body">Loading...</div>
                </div>
            </div>
        `;
    }
}
 
