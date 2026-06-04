export class VRStatusSettings extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.gyroActive = false;
    }

    connectedCallback() {
        this.render();
        this._bindEvents();
    }

    _bindEvents() {
        const toggleBtn = this.shadowRoot.getElementById('gyro-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const appRoot = document.querySelector('script[type="module"]');
            if (!appRoot) return;

            this.gyroActive = !this.gyroActive;
            
            if (this.gyroActive) {
                toggleBtn.classList.add('active');
                toggleBtn.innerText = 'GYRO: ON';
                window.dispatchEvent(new CustomEvent('vr-gyro-request', { detail: { action: 'start' } }));
            } else {
                toggleBtn.classList.remove('active');
                toggleBtn.innerText = 'GYRO: OFF';
                window.dispatchEvent(new CustomEvent('vr-gyro-request', { detail: { action: 'stop' } }));
            }
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .settings-panel {
                    background: var(--bg-surface);
                    backdrop-filter: var(--bg-surface-blur);
                    -webkit-backdrop-filter: var(--bg-surface-blur);
                    border: 1px solid var(--border-color);
                    border-radius: var(--card-radius);
                    padding: 12px;
                    box-shadow: var(--shadow-panel);
                }
                .btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    padding: 8px 16px;
                    font-size: 12px;
                    font-family: var(--font-mono);
                    letter-spacing: 1px;
                    border-radius: 4px;
                    transition: var(--transition-ui-fast);
                }
                .btn:hover {
                    border-color: var(--border-color-active);
                    box-shadow: var(--shadow-neon);
                }
                .btn.active {
                    background: rgba(0, 255, 204, 0.2);
                    border-color: var(--text-accent);
                    color: var(--text-accent);
                }
            </style>
            <div class="settings-panel">
                <button class="btn" id="gyro-toggle">GYRO: OFF</button>
            </div>
        `;
    }
}
 
