import { Kernel } from '../core/kernel.js';
import { el, fmt } from '../core/ui.js';

const browser = () => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge'; if (/OPR\//.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox'; if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari'; return 'Khác';
};

const M = {
  manifest: { id: 'clients', name: 'Clients', icon: 'user', routes: ['clients'], group: 'MỞ RỘNG' },
  mount(root){
    const vp = el('b', { class: 'mono' }, `${innerWidth}×${innerHeight}`);
    const env = [
      ['Trình duyệt', browser()], ['Nền tảng', navigator.platform || '—'],
      ['Ngôn ngữ', navigator.language], ['Múi giờ', Intl.DateTimeFormat().resolvedOptions().timezone],
      ['Màn hình', `${screen.width}×${screen.height} · ${devicePixelRatio}x`], ['Viewport', vp],
      ['Nhân CPU', navigator.hardwareConcurrency || '—'],
      ['Bộ nhớ (ước)', navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'],
      ['Cảm ứng', navigator.maxTouchPoints ? navigator.maxTouchPoints + ' điểm' : 'không'],
      ['Cookie', navigator.cookieEnabled ? 'bật' : 'tắt'],
    ];
    root.append(
      el('section', { class: 'panel pad' },
        el('h3', { class: 'sec-title' }, 'MÔI TRƯỜNG CLIENT · ĐỌC THẬT TỪ TRÌNH DUYỆT'),
        el('div', { class: 'env-grid' }, env.map(([k, v]) =>
          el('div', { class: 'stat' }, el('small', {}, k), typeof v === 'string' ? el('b', { class: 'mono' }, v) : v)))),
      el('section', { class: 'panel pad' },
        el('h3', { class: 'sec-title' }, 'PHIÊN HIỆN TẠI'),
        el('div', { class: 'stat-grid two' },
          el('div', { class: 'stat' }, el('small', {}, 'Uptime'), el('b', { class: 'mono', id: 'clUp' }, fmt.uptime(Kernel.uptime()))),
          el('div', { class: 'stat' }, el('small', {}, 'Sự kiện bus'), el('b', { class: 'mono', id: 'clEv' }, fmt.num(Kernel.events)))),
        el('p', { class: 'hint', style: { marginTop: '12px' } }, 'UA: ' + navigator.userAgent)));
    this.onRs = () => { vp.textContent = `${innerWidth}×${innerHeight}`; };
    addEventListener('resize', this.onRs, { passive: true });
    this.timer = setInterval(() => {
      const u = document.getElementById('clUp');
      if (u) { u.textContent = fmt.uptime(Kernel.uptime());
        document.getElementById('clEv').textContent = fmt.num(Kernel.events); }
    }, 1000);
  },
  unmount(){ removeEventListener('resize', this.onRs); clearInterval(this.timer); },
};
export default M; 
