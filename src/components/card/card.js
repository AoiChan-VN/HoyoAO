import { VRMarkdownParser } from '../../core/markdown.js';

export class VRStatusCard extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.parser = new VRMarkdownParser();
    }

    connectedCallback() {
        this.render();
        this._loadCardData();
    }

    attributeChangedCallback() {
        this.render();
    }

    async _loadCardData() {
        const type = this.getAttribute('type') || 'profile';
        const contentContainer = this.shadowRoot.getElementById('card-content');
        
        try {
            const response = await fetch(`./src/assets/content/${type}.md`);
            if (!response.ok) throw new Error();
            const markdown = await response.text();
            contentContainer.innerHTML = this.parser.parse(markdown);
        } catch {
            contentContainer.innerHTML = `<p style="color:var(--text-secondary)">Failed to load ${type}.md data.</p>`;
        }
    }

    _triggerModal() {
        const modal = document.getElementById('global-detail-modal');
        if (!modal) return;
        
        const type = this.getAttribute('type');
        const title = this.getAttribute('title');
        
        modal.setAttribute('data-type', type);
        modal.setAttribute('data-title', title);
        modal.setAttribute('open', 'true');
    }

    render() {
        const title = this.getAttribute('title') || 'Card';
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: var(--card-radius);
                    padding: 20px;
                    transition: var(--transition-ui-fast);
                    cursor: pointer;
                }
                .card:hover {
                    border-color: var(--border-color-active);
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-neon);
                }
                .card-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-accent);
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .card-content {
                    font-size: 14px;
                    color: var(--text-muted);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }
                .card-content h1, .card-content h2, .card-content h3 {
                    font-size: 15px;
                    margin: 8px 0;
                }
            </style>
            <div class="card" id="main-card-element">
                <div class="card-title">${title}</div>
                <div class="card-content" id="card-content">Loading content...</div>
            </div>
        `;

        this.shadowRoot.getElementById('main-card-element').addEventListener('click', () => this._triggerModal());
    }
}
 
