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
            const requestUrl = `src/assets/content/${type}.md`;
            const response = await fetch(requestUrl);
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const markdown = await response.text();
            if (contentContainer) {
                contentContainer.innerHTML = this.parser.parse(markdown);
            }
        } catch (error) {
            console.error(error);
            if (contentContainer) {
                contentContainer.innerHTML = `<p style="color:var(--text-secondary)">Failed to load data.</p>`;
            }
        }
    }

    _triggerModal(e) {
        e.preventDefault();
        e.stopPropagation();
        
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
            <link rel="stylesheet" href="./src/components/card/card.css">
            <div class="card" id="main-card-element">
                <div class="card-title">${title}</div>
                <div class="card-content" id="card-content">Loading content...</div>
            </div>
        `;

        const cardElement = this.shadowRoot.getElementById('main-card-element');
        if (cardElement) {
            cardElement.addEventListener('click', (e) => this._triggerModal(e));
            cardElement.addEventListener('touchend', (e) => this._triggerModal(e));
        }
    }
}
 
