import { Kernel } from '../core/kernel.js';
import { Store } from '../core/store.js';
import { Engine } from '../core/engine.js';
import { el, icon, fmt } from '../core/ui.js';

const M = {
  manifest: { id: 'server', name: 'Server', icon: 'shield', routes: ['server'], group: 'MỞ RỘNG' },
  mount(root){
    const n = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource').sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
    const totalB = res.reduce((s, r) => s + (r.transferSize || 0), 0) + (n.transferSize || 0);
    this.online = el('span', { class: 'badge', style: { color: '#7ae582' } }, navigator.onLine ? 'ONLINE' : 'OFFLINE');
    this.lat = el('b', { class: 'mono', style: { fontSize: '22px' } }, '—');
    this.latStat = el('span', { class: 'mono' }, '');
    this.spark = el('canvas', { width: 520, height: 46, style: { width: '100%', height: '46px' } });
    const c = navigator.connection;
    root.append(
      el('section', { class: 'panel pad' },
        el('header', { class: 'ctl-row' },
          el('h2', { class: 'display' }, 'Server / Máy chủ'), this.online,
          el('button', { class: 'btn', style: { marginLeft: 'auto' },
            onclick: () => Engine.ping().then(() => this.tick()) }, icon('pulse', 14), 'Ping lại')),
        el('div', { class: 'stat-grid' },
          el('div', { class: 'stat' }, el('small', {}, 'Host'), el('b', { class: 'mono' }, location.host)),
          el('div', { class: 'stat' }, el('small', {}, 'Giao thức'), el('b', { class: 'mono' }, location.protocol)),
          el('div', { class: 'stat' }, el('small', {}, 'Hạ tầng'),
            el('b', { class: 'mono' }, /github\.io$/.test(location.host) ? 'GitHub Pages' : 'Static host')),
          el('div', { class: 'stat' }, el('small', {}, 'TTFB'),
            el('b', { class: 'mono' }, n.responseStart ? Math.round(n.responseStart) + ' ms' : '—')),
          el('div', { class: 'stat' }, el('small', {}, 'DOMContentLoaded'),
            el('b', { class: 'mono' }, n.domContentLoadedEventEnd ? Math.round(n.domContentLoadedEventEnd) + ' ms' : '—')),
          el('div', { class: 'stat' }, el('small', {}, 'Load hoàn tất'),
            el('b', { class: 'mono' }, n.loadEventEnd ? Math.round(n.loadEventEnd) + ' ms' : '—')),
          el('div', { class: 'stat' }, el('small', {}, 'Kết nối mạng'),
            el('b', { class: 'mono' }, c ? `${c.effectiveType || '—'} · ${c.downlink || '—'} Mbps · RTT ${c.rtt ?? '—'} ms` : 'API không hỗ trợ')),
          el('div', { class: 'stat' }, el('small', {}, 'Tải xuống'),
            el('b', { class: 'mono' }, `${fmt.bytes(totalB)} · ${res.length + 1} tài nguyên`))),
        el('h4', { class: 'sub-h' }, 'ĐỘ TRỄ THỰC · HEAD PING MỖI 5S'),
        el('div', { class: 'ctl-row' }, this.lat, this.latStat),
        this.spark),
      el('section', { class: 'panel pad' },
        el('h3', { class: 'sec-title' }, 'TÀI NGUYÊN ĐÃ NẠP · TOP THEO DUNG LƯỢNG'),
        el('div', { class: 'tbl-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, el('th', {}, 'Tài nguyên'), el('th', {}, 'Loại'), el('th', {}, 'KB'), el('th', {}, 'ms'))),
          el('tbody', {}, res.slice(0, 8).map(r => el('tr', {},
            el('td', { class: 'mono' }, r.name.split('/').slice(-2).join('/')),
            el('td', {}, el('span', { class: 'badge' }, r.initiatorType)),
            el('td', { class: 'mono' }, ((r.transferSize || 0) / 1024).toFixed(1)),
            el('td', { class: 'mono' }, Math.round(r.duration)))))))));
    this.tick();
    this._offs = [
      Kernel.on('engine:tick', e => { if (e.detail % 2 === 0) this.tick(); }),
      Kernel.on('net:change', e => {
        this.online.textContent = e.detail ? 'ONLINE' : 'OFFLINE';
        this.online.style.color = e.detail ? '#7ae582' : '#ff6b7a';
      }),
    ];
  },
  unmount(){ this._offs?.forEach(f => f()); },
  tick(){
    this.lat.textContent = Engine.online ? Engine.latency + ' ms' : 'OFFLINE';
    const b = Store.zones.get('network')?.buffer.slice(-120).map(s => s.v).filter(v => v > 0) || [];
    if (b.length)
      this.latStat.textContent = `min ${Math.min(...b)} · avg ${Math.round(b.reduce((a, c) => a + c, 0) / b.length)} · max ${Math.max(...b)} ms`;
    const cv = this.spark, ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (b.length > 1) {
      const mn = Math.min(...b), mx = Math.max(...b) || 1;
      ctx.beginPath();
      b.forEach((v, i) => {
        const x = i / (b.length - 1) * cv.width, y = 42 - (v - mn) / ((mx - mn) || 1) * 36;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = '#ffb454'; ctx.lineWidth = 1.6; ctx.stroke();
    }
  },
};
export default M; 
