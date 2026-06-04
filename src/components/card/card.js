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
            <link rel="stylesheet" href="./src/components/card/card.css">
            <div class="card" id="main-card-element">
                <div class="card-title">${title}</div>
                <div class="card-content" id="card-content">Loading content...</div>
            </div>
        `;

        this.shadowRoot.getElementById('main-card-element').addEventListener('click', () => this._triggerModal());
    }
}
