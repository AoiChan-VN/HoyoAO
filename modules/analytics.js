import { Kernel } from '../core/kernel.js';
import { Store } from '../core/store.js';
import { el, fmt } from '../core/ui.js';

const M = {
  manifest: { id: 'analytics', name: 'Analytics', icon: 'analytics', routes: ['analytics'] },
  state: { zone: 'all', days: 14 }, _off: null, chart: null,

  mount(root){
    const zones = [...Store.zones.values()];
    this.chart = el('canvas', { class: 'chart' });
    this.dist = el('div', { class: 'dist' });
    this.origins = el('div', { class: 'dist' });
    this.totalLbl = el('span', { class: 'mono range-total' }, '');

    root.append(
      el('section', { class: 'panel pad' },
        el('header', { class: 'ctl-row' },
          el('h2', { class: 'display' }, 'Analytics'),
          el('select', { class: 'field sel', onchange: e => { this.state.zone = e.target.value; this.render(); } },
            el('option', { value: 'all' }, 'Tất cả vùng'),
            zones.map(z => el('option', { value: z.def.id }, z.def.label))),
          el('div', { class: 'chips' }, [7, 14, 30].map(d =>
            el('button', { class: 'chip' + (d === this.state.days ? ' on' : ''), onclick: e => {
              this.state.days = d;
              e.currentTarget.parentNode.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
              e.currentTarget.classList.add('on'); this.render();
            } }, d + ' ngày'))),
          this.totalLbl),
        this.chart),
      el('div', { class: 'duo' },
        el('section', { class: 'panel pad' }, el('h3', { class: 'sec-title' }, 'PHÂN BỔ THEO VÙNG'), this.dist),
        el('section', { class: 'panel pad' }, el('h3', { class: 'sec-title' }, 'NGUỒN PHÁT SINH'), this.origins)));
    this.render();
    this._off = Kernel.on('engine:tick', () => this.t++ % 3 === 0 && this.render());
    this.t = 0;
  },
  unmount(){ this._off?.(); },

  render(){
    const { zone, days } = this.state;
    const series = Store.historySeries(zone, days);
    this.totalLbl.textContent = 'Σ ' + fmt.compact(series.reduce((s, d) => s + d.total, 0)) + ' sự kiện';
    this.drawBars(series, zone);
    // phân bổ vùng
    const zones = [...Store.zones.values()];
    const totals = zones.map(z => ({ z, v: Store.historySeries(z.def.id, days).reduce((s, d) => s + d.total, 0) }));
    const grand = Math.max(1, totals.reduce((s, t) => s + t.v, 0));
    this.dist.innerHTML = '';
    totals.forEach(({ z, v }) => this.dist.append(
      el('div', { class: 'dist-row' },
        el('span', { class: 'dist-lb' }, el('i', { class: 'zdot', style: { background: z.def.color } }), z.def.label),
        el('div', { class: 'dist-bar' }, el('span', { style: { width: (v / grand * 100) + '%', background: z.def.color } })),
        el('span', { class: 'mono' }, fmt.compact(v)))));
    this.origins.innerHTML = '';
    const org = Store.eventsByOrigin(), omax = Math.max(1, org[0]?.[1] || 1);
    org.forEach(([k, v]) => this.origins.append(
      el('div', { class: 'dist-row' },
        el('span', { class: 'dist-lb' }, el('span', { class: 'badge' }, k)),
        el('div', { class: 'dist-bar' }, el('span', { style: { width: (v / omax * 100) + '%', background: 'var(--accent)' } })),
        el('span', { class: 'mono' }, fmt.num(v)))));
  },

  drawBars(series, zone){
    const cv = this.chart, dpr = devicePixelRatio || 1;
    const W = cv.clientWidth || 800, H = 260;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const padL = 46, padB = 26, padT = 12, pw = W - padL - 12, ph = H - padT - padB;
    const max = Math.max(1, ...series.map(d => d.total));
    ctx.font = '10px "IBM Plex Mono", monospace';
    for (let g = 0; g <= 4; g++) {
      const y = padT + ph - ph * g / 4;
      ctx.strokeStyle = 'rgba(150,195,205,.09)';
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 12, y); ctx.stroke();
      ctx.fillStyle = 'rgba(160,190,200,.5)'; ctx.fillText(fmt.compact(max * g / 4), 6, y + 3);
    }
    const color = zone === 'all' ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      : Store.zones.get(zone)?.def.color || '#4cc9f0';
    const bw = pw / series.length * 0.62;
    series.forEach((d, i) => {
      const h = Math.max(2, d.total / max * ph);
      const x = padL + pw / series.length * (i + 0.5) - bw / 2, y = padT + ph - h;
      ctx.fillStyle = color + (i === series.length - 1 ? 'ff' : '99');
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, bw, h, [4, 4, 0, 0]) : ctx.rect(x, y, bw, h);
      ctx.fill();
      const every = Math.ceil(series.length / 10);
      if (i % every === 0) {
        ctx.fillStyle = 'rgba(160,190,200,.55)';
        ctx.fillText(d.label, x + bw / 2 - 14, H - 8);
      }
    });
  },
};
export default M; 
