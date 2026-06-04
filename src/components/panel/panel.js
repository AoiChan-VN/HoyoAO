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
            <link rel="stylesheet" href="./src/components/panel/panel.css">
            <div class="panel-container">
                <slot></slot>
            </div>
        `;
    }
}
