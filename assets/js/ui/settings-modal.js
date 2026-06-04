import { BaseElement } from './base-element.js';
import { store } from '../core/store.js';

export class SettingsModal extends BaseElement {
    render() {
        this.innerHTML = `
            <div class="modal-overlay">
                <div class="panel-box">
                    <h2>Cấu hình Hệ thống</h2>
                    <label>
                        <input type="checkbox" id="gyro-toggle" ${store.state.vrEnabled ? 'checked' : ''}>
                        Kích hoạt Gyroscope 3D VR
                    </label>
                    <button class="btn-close" id="close-panel">Đóng</button>
                </div>
            </div>
        `;
    }
    bindEvents() {
        this.querySelector('#gyro-toggle').addEventListener('change', (e) => {
            store.set('vrEnabled', e.target.checked);
        });
    }
}
customElements.define('settings-modal', SettingsModal);
 
