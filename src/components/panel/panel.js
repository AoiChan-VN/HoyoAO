export class VRStatusPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 90vw;
                    max-width: 800px;
                    height: 80vh;
                    max-height: 600px;
                    transform-style: preserve-3d;
                    transform: translateZ(var(--panel-translate-z, -400px));
                    transition: var(--transition-ui-normal);
                }
                .panel-container {
                    width: 100%;
                    height: 100%;
                    background: var(--bg-surface);
                    backdrop-filter: var(--bg-surface-blur);
                    -webkit-backdrop-filter: var(--bg-surface-blur);
                    border: 1px solid var(--border-color);
                    border-radius: var(--panel-radius);
                    box-shadow: var(--shadow-panel), var(--shadow-neon);
                    padding: 32px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .panel-container::-webkit-scrollbar {
                    width: 6px;
                }
                .panel-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .panel-container::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 3px;
                }
                .panel-container::-webkit-scrollbar-thumb:hover {
                    background: var(--text-accent);
                }
            </style>
            <div class="panel-container">
                <slot></slot>
            </div>
        `;
    }
}
 
