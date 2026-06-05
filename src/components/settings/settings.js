export class VRStatusSettings extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.gyroActive = false;
    }

    connectedCallback() {
        this.render();
        this._bindDashboardEvents();
    }

    _bindDashboardEvents() {
        const toggleBtn = this.shadowRoot.getElementById('gyro-toggle');
        if (toggleBtn) {
            const handleGyro = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.gyroActive = !this.gyroActive;
                if (this.gyroActive) {
                    toggleBtn.classList.add('active');
                    toggleBtn.innerText = 'GYRO: ACTIVE';
                    window.dispatchEvent(new CustomEvent('vr-gyro-request', { detail: { action: 'start' } }));
                } else {
                    toggleBtn.classList.remove('active');
                    toggleBtn.innerText = 'GYRO: DISABLED';
                    window.dispatchEvent(new CustomEvent('vr-gyro-request', { detail: { action: 'stop' } }));
                }
            };
            toggleBtn.addEventListener('click', handleGyro);
            toggleBtn.addEventListener('touchend', handleGyro);
        }

        const navButtons = this.shadowRoot.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const handleNav = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetType = btn.getAttribute('data-target');
                const targetTitle = btn.innerText;
                
                const modal = document.getElementById('global-detail-modal');
                if (modal && targetType) {
                    modal.setAttribute('data-type', targetType);
                    modal.setAttribute('data-title', targetTitle);
                    modal.setAttribute('open', 'true');
                }
            };
            btn.addEventListener('click', handleNav);
            btn.addEventListener('touchend', handleNav);
        });

        const resetBtn = this.shadowRoot.getElementById('space-reset');
        if (resetBtn) {
            const handleReset = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.reload();
            };
            resetBtn.addEventListener('click', handleReset);
            resetBtn.addEventListener('touchend', handleReset);
        }

        const interactiveElements = this.shadowRoot.querySelectorAll('.nav-btn, .sys-btn');
        interactiveElements.forEach(el => {
            el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
            el.addEventListener('mousedown', (e) => e.stopPropagation());
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./src/components/settings/settings.css">
            <div class="vr-dashboard-container">
                <div class="dashboard-header">
                    <div class="status-dot"></div>
                    <span class="title">CORE INTERFACE v1.0</span>
                </div>
                
                <div class="nav-section">
                    <button class="nav-btn" data-target="profile">DEVELOPER PROFILE</button>
                    <button class="nav-btn" data-target="projects">FEATURED PROJECTS</button>
                </div>
                
                <div class="system-section">
                    <button class="sys-btn" id="gyro-toggle">GYRO: DISABLED</button>
                    <button class="sys-btn reset" id="space-reset">RESET VIEW</button>
                </div>
            </div>
        `;
    }
}
 
