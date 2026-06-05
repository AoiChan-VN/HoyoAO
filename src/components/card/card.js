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
            console.error("[Card Core Fetch Failure]:", error);
            if (contentContainer) {
                contentContainer.innerHTML = `<p style="color:var(--text-secondary)">Failed to load data.</p>`;
            }
        }
    }

    ...
}
