import { Kernel } from '../core/kernel.js';
import { Store, CAP } from '../core/store.js';
import { el, icon, fmt, openModal, download } from '../core/ui.js';

// ══════ Trang chủ: 1 màn hình visualization + readouts + cards ══════
const M = {
  manifest: { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', routes: ['dashboard'] },
  _raf: 0, _offs: [], _ro: {}, _bars: {}, _cardVals: {}, canvas: null,

  mount(root){
    const zones = [...Store.zones.values()];
    this.canvas = el('canvas');
    const sources = [...new Set(zones.map(z => z.def.source))];

    root.append(
      el('section', { class: 'panel viz' },
        el('header', { class: 'viz-head' },
          el('div', { class: 'viz-title' },
            el('h2', { class: 'display' }, 'DATA VISUALIZATION'),
            el('span', { class: 'live-dot' }, 'LIVE')),
          el('div', { class: 'viz-legend' }, sources.map(s => el('span', { class: 'badge' }, s)))),
        el('div', { class: 'viz-body' },
          el('div', { class: 'viz-canvas' }, this.canvas),
          el('aside', { class: 'readouts' }, zones.map(z => this.readoutRow(z))))),
      el('section', {},
        el('h3', { class: 'sec-title' }, 'PHÂN VÙNG DỮ LIỆU'),
        el('div', { class: 'card-grid' }, zones.map(z => this.card(z)))));

    // Subscribe từng vùng — vùng mới thêm vào data/zones.js tự xuất hiện
    for (const z of zones) {
      this._offs.push(Kernel.on('zone:' + z.def.id, () => this.updateReadout(z.def.id)));
      this._offs.push(Kernel.on('zone:update', d => { if (d.id === z.def.id) this.updateCard(z.def.id); }));
      this.updateReadout(z.def.id); this.updateCard(z.def.id);
    }
    this.draw();
  },

  unmount(){ cancelAnimationFrame(this._raf); this._offs.forEach(off => off()); this._offs = []; },

  // ── readout bên phải: thông số + giờ + ngày/tháng/năm theo từng vùng ──
  readoutRow(z){
    const refs = {};
    const row = el('div', { class: 'readout', style: { '--zc': z.def.color } },
      el('div', { class: 'ro-top' },
        el('i', { class: 'zdot' }), el('b', {}, z.def.label),
        el('span', { class: 'badge' }, z.def.source)),
      el('div', { class: 'ro-val mono' }, refs.val = el('span', {}, '—'),
        el('small', {}, ' ' + z.def.unit), el('em', { class: 'delta' }, refs.delta = el('span', {}, ''))),
      el('div', { class: 'ro-sum' }, refs.sum = el('span', {}, '')),
      el('div', { class: 'ro-time mono' }, refs.time = el('span', {}, '')));
    this._ro[z.def.id] = refs;
    return row;
  },
  updateReadout(id){
    const z = Store.zones.get(id), r = this._ro[id]; if (!z || !r) return;
    r.val.textContent = fmt.val(z.value);
    const prev = z.buffer.at(-2)?.v || z.value;
    const d = prev ? ((z.value - prev) / prev) * 100 : 0;
    r.delta.textContent = (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%';
    r.delta.className = 'delta ' + (d >= 0 ? 'up' : 'down');
    r.sum.textContent = `Σ ${fmt.compact(z.total)} ${z.def.unit} · ${fmt.num(z.count)} sự kiện`;
    r.time.textContent = z.last ? `${fmt.time(z.last.t)} · ${fmt.date(z.last.t)}` : '—';
  },

  // ── card bên dưới → click mở modal chi tiết vùng ──
  card(z){
    const bars = el('div', { class: 'zbars' });
    this._bars[z.def.id] = bars;
    this._cardVals[z.def.id] = {};
    const c = el('article', { class: 'zcard', style: { '--zc': z.def.color }, onclick: () => this.openZone(z) },
      el('header', {},
        el('span', { class: 'zname' }, el('i', { class: 'zdot' }), z.def.label),
        el('span', { class: 'badge' }, z.def.source)),
      el('div', { class: 'zval mono' }, this._cardVals[z.def.id].total = el('span', {}, '—')),
      el('div', { class: 'zsub' }, this._cardVals[z.def.id].sub = el('span', {}, '')),
      bars,
      el('footer', {}, 'Chi tiết vùng', icon('chevron', 14)));
    return c;
  },
  updateCard(id){
    const z = Store.zones.get(id), r = this._cardVals[id], bars = this._bars[id];
    if (!z || !r) return;
    r.total.textContent = fmt.compact(z.total) + ' ' + z.def.unit;
    r.sub.textContent = `${fmt.num(z.count)} sự kiện · đỉnh ${fmt.compact(z.peak)} ${z.def.unit}`;
    const slice = z.buffer.slice(-22);
    bars.innerHTML = '';
    for (const s of slice)
      bars.append(el('span', { style: { height: Math.max(6, Math.min(1, s.v / z.scale) * 100) + '%' } }));
  },

  // ── Modal chi tiết: giúp người dùng hiểu TOÀN BỘ về vùng dữ liệu ──
  openZone(z){
    const stats = [
      ['Tổng', fmt.compact(z.total) + ' ' + z.def.unit], ['Sự kiện', fmt.num(z.count)],
      ['Đỉnh', fmt.val(z.peak) + ' ' + z.def.unit], ['Trung bình', z.count ? fmt.val(z.total / z.count) : '—'],
      ['Cập nhật', z.last ? fmt.time(z.last.t) : '—'], ['Nguồn', z.def.source]];
    const spark = el('canvas', { width: 660, height: 84, class: 'spark' });
    const rows = z.events.slice(0, 12).map(e =>
      el('tr', {}, el('td', { class: 'mono' }, fmt.time(e.t)),
        el('td', { class: 'mono' }, fmt.val(e.v) + ' ' + z.def.unit),
        el('td', {}, el('span', { class: 'badge' }, e.origin))));
    const body = el('div', {},
      el('p', { class: 'zone-desc' }, z.def.desc),
      el('code', { class: 'zone-schema' }, z.def.schema),
      el('div', { class: 'stat-grid' }, stats.map(([k, v]) =>
        el('div', { class: 'stat' }, el('small', {}, k), el('b', { class: 'mono' }, v)))),
      spark,
      el('h4', { class: 'sub-h' }, 'SỰ KIỆN GẦN NHẤT'),
      el('div', { class: 'tbl-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Thời gian'), el('th', {}, 'Giá trị'), el('th', {}, 'Nguồn'))),
        el('tbody', {}, rows))));
    openModal({
      title: `${z.def.label} · ${z.def.source}`, icon: 'db', wide: true, body,
      footer: [
        el('button', { class: 'btn', onclick: () =>
          download(`zone-${z.def.id}.json`, JSON.stringify({ def: z.def, total: z.total, count: z.count, events: z.events }, null, 2)) },
          icon('download', 14), 'Xuất JSON'),
      ],
    });
    // vẽ sparkline
    const ctx = spark.getContext('2d'), buf = z.buffer;
    if (buf.length > 1) {
      ctx.strokeStyle = z.def.color; ctx.lineWidth = 1.6; ctx.beginPath();
      buf.forEach((s, i) => {
        const x = i / (buf.length - 1) * 660, y = 78 - Math.min(1, s.v / z.scale) * 68;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    }
  },

  // ══════ CANVAS: Cột - Sóng - Sợi - Gấp khúc, cuộn theo thời gian thực ══════
  draw(){
    const cv = this.canvas; if (!cv?.isConnected) return;
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const zones = [...Store.zones.values()], n = zones.length, laneH = H / n, now = Date.now();

    zones.forEach((z, i) => {
      const top = i * laneH, pad = laneH * 0.16;
      const base = top + laneH - pad * 0.7, amp = laneH - pad * 1.9;
      if (i > 0) { ctx.strokeStyle = 'rgba(150,195,205,.10)'; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke(); }
      ctx.setLineDash([2, 6]); ctx.strokeStyle = 'rgba(150,195,205,.08)';
      ctx.beginPath(); ctx.moveTo(0, base - amp / 2); ctx.lineTo(W, base - amp / 2); ctx.stroke(); ctx.setLineDash([]);

      const buf = z.buffer; if (buf.length < 2) return;
      const yFor = v => base - Math.min(1, v / z.scale) * amp;
      const step = W / (CAP - 1);
      const phase = Math.min(1, (now - (z.last?.t || now)) / 1000);
      const pts = buf.map((s, idx) => ({ x: W - (buf.length - 1 - idx) * step - phase * step, y: yFor(s.v) }));
      const prevS = buf.at(-2), lastS = buf.at(-1);
      const head = { x: W, y: yFor(prevS.v + (lastS.v - prevS.v) * phase) };

      const P = [...pts, head];
      if (z.def.visual === 'columns') this.drawColumns(ctx, pts, head, base, z);
      else if (z.def.visual === 'wave') this.drawWave(ctx, P, base, z);
      else if (z.def.visual === 'threads') this.drawThreads(ctx, pts, head, base, z);
      else if (z.def.visual === 'area') this.drawArea(ctx, P, base, z);
      else this.drawPoly(ctx, P, z);

      ctx.fillStyle = z.def.color + '33'; ctx.beginPath(); ctx.arc(head.x - 2, head.y, 8, 0, 7); ctx.fill();
      ctx.fillStyle = z.def.color; ctx.beginPath(); ctx.arc(head.x - 2, head.y, 3, 0, 7); ctx.fill();

      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillStyle = z.def.color + 'cc'; ctx.fillText(z.def.label.toUpperCase(), 12, top + 15);
      ctx.fillStyle = 'rgba(160,190,200,.45)';
      ctx.fillText(z.def.unit, 12 + ctx.measureText(z.def.label.toUpperCase()).width + 8, top + 15);
    });

    // vệt quét tạo cảm giác sống
    const sx = (now / 18) % (W + 120) - 60;
    const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
    g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(.5, 'rgba(120,220,255,.05)'); g.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - 40, 0, 80, H);

    this._raf = requestAnimationFrame(() => this.draw());
  },

  drawPoly(ctx, P, z){
    ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = z.def.color + '3d'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = z.def.color; ctx.lineWidth = 1.7; ctx.stroke();
  },
  smooth(ctx, P){
    ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i].x + P[i + 1].x) / 2, my = (P[i].y + P[i + 1].y) / 2;
      ctx.quadraticCurveTo(P[i].x, P[i].y, mx, my);
    }
    ctx.lineTo(P.at(-1).x, P.at(-1).y);
  },
  drawWave(ctx, P, base, z){
    this.smooth(ctx, P);
    ctx.lineTo(P.at(-1).x, base); ctx.lineTo(P[0].x, base); ctx.closePath();
    const g = ctx.createLinearGradient(0, base - 90, 0, base);
    g.addColorStop(0, z.def.color + '40'); g.addColorStop(1, z.def.color + '00');
    ctx.fillStyle = g; ctx.fill();
    this.smooth(ctx, P); ctx.strokeStyle = z.def.color; ctx.lineWidth = 1.8; ctx.stroke();
  },
  drawColumns(ctx, pts, head, base, z){
    const dx = pts.length > 1 ? pts[1].x - pts[0].x : 6, bw = Math.max(2, dx * 0.55);
    pts.forEach((p, i) => {
      ctx.fillStyle = i >= pts.length - 3 ? z.def.color + 'aa' : z.def.color + '48';
      ctx.fillRect(p.x - bw / 2, p.y, bw, base - p.y);
    });
    ctx.fillStyle = z.def.color; ctx.fillRect(head.x - bw, head.y, bw, base - head.y);
  },
  drawThreads(ctx, pts, head, base, z){
    [[1, 'ee'], [0.64, '66'], [0.4, '33']].forEach(([f, a], k) => {
      ctx.beginPath();
      const P = [...pts, head].map(p => ({ x: p.x, y: base - (base - p.y) * f + Math.sin(p.x * 0.02 + k * 2) * 3 }));
      P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = z.def.color + a; ctx.lineWidth = k ? 1 : 1.6; ctx.stroke();
    });
  },
  drawArea(ctx, P, base, z){
    ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length; i++) { ctx.lineTo(P[i].x, P[i - 1].y); ctx.lineTo(P[i].x, P[i].y); }
    ctx.strokeStyle = z.def.color + 'bb'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.lineTo(P.at(-1).x, base); ctx.lineTo(P[0].x, base); ctx.closePath();
    ctx.fillStyle = z.def.color + '22'; ctx.fill();
  },
};
export default M; 
