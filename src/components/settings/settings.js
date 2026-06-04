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
            <link rel="stylesheet" href="./src/components/settings/settings.css">
            <div class="settings-panel">
                <button class="btn" id="gyro-toggle">GYRO: OFF</button>
            </div>
        `;
    }
}
