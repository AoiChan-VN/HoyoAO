export class VRStatusPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
    }

    connectedCallback() {
        if (!this._initialized) {
            this.render();
            this._setupScrollIsolation();
            this._initialized = true;
        }
    }

    _setupScrollIsolation() {
        const container = this.shadowRoot.getElementById('panel-container-element');
        if (!container) return;

        const isolateEvent = (e) => {
            const isScrollable = container.scrollHeight > container.clientHeight;
            if (isScrollable) {
                e.stopPropagation();
            }
        };

        container.addEventListener('mousemove', isolateEvent);
        container.addEventListener('touchmove', isolateEvent, { passive: true });
        container.addEventListener('mousedown', isolateEvent);
        container.addEventListener('touchstart', isolateEvent, { passive: true });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./src/components/panel/panel.css">
            <div class="panel-container" id="panel-container-element">
                <slot></slot>
            </div>
        `;
    }
}
