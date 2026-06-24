/* js/pc/input-scroll.js */
import { PC_CONFIG } from './config.js';
import { PC_STATE } from './state.js';

export function initScrollInput() {
    window.addEventListener('wheel', (e) => {
        // e.deltaY sinh ra giá trị âm khi cuộn lên, dương khi cuộn xuống
        PC_STATE.scroll.targetY += e.deltaY * PC_CONFIG.SCROLL_SENSITIVITY;
    }, { passive: true });
}
 
