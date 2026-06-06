import { VRMarkdownParser } from '../../core/markdown.js';

export class VRSpatialViewer extends HTMLElement {
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
        const wrapper = this.shadowRoot.getElementById('viewer-wrapper');
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
        const wrapper = this.shadowRoot.getElementById('viewer-wrapper');
        if (!wrapper) return;

        const isOpen = this.getAttribute('open') === 'true';
        if (isOpen) {
            wrapper.classList.add('visible');
            const titleNode = this.shadowRoot.getElementById('viewer-title-text');
            if (titleNode) {
                titleNode.innerText = this.getAttribute('data-title') || 'Document';
            }
            this._loadFullContent();
        } else {
            wrapper.classList.remove('visible');
        }
    }

    async _loadFullContent() {
        const type = this.getAttribute('data-type');
        const contentContainer = this.shadowRoot.getElementById('viewer-body');
        if (!type || !contentContainer) return;

        try {
            contentContainer.innerHTML = '<p style="color:var(--text-accent)">RETRIEVING DATA CORES...</p>';
            
            const requestUrl = `src/assets/content/${type}.md`;
            const response = await fetch(requestUrl);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const markdown = await response.text();
            contentContainer.innerHTML = this.parser.parse(markdown);
        } catch (error) {
            console.error(error);
            contentContainer.innerHTML = '<p style="color:var(--text-secondary)">CRITICAL ERROR: ACCESS DENIED.</p>';
        }
    }

    _setupEventDelegation() {
        const wrapper = this.shadowRoot.getElementById('viewer-wrapper');
        if (wrapper) {
            wrapper.addEventListener('click', this._handleCloseIntent);
        }
    }

    _handleCloseIntent(e) {
        e.stopPropagation();
        const isCloseBtn = e.target.id === 'close-viewer';
        
        if (isCloseBtn) {
            this.setAttribute('open', 'false');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./src/components/spatial-viewer/spatial-viewer.css">
            <div class="spatial-viewer-overlay" id="viewer-wrapper">
                <div class="spatial-viewer-box">
                    <div class="viewer-header">
                        <div class="viewer-title" id="viewer-title-text">Document</div>
                        <button class="close-btn" id="close-viewer">&times;</button>
                    </div>
                    <div class="viewer-body" id="viewer-body">Loading...</div>
                </div>
            </div>
        `;
    }
}
 
