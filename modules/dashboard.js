import { Kernel } from '../core/kernel.js';
import { Store } from '../core/store.js';
import { Engine } from '../core/engine.js';
import { Router } from '../core/router.js';
import { el, icon, fmt, openModal, download } from '../core/ui.js';

const RANGES = [['2m', 120], ['5m', 300], ['10m', 600]];

const M = {
  manifest: { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', routes: ['dashboard'], group: 'VẬN HÀNH' },
  _raf: 0, _offs: [], sel: 'runtime', range: 120, hover: null,

  mount(root){
    const zones = [...Store.zones.values()];

    // ── Ticker tape (2 bản sao để chạy vòng, refs cập nhật cả hai) ──
    const mkSet = () => {
      const refs = {};
      const nodes = zones.map(z => {
        const v = el('span', { class: 'tv mono' }, '—'), c = el('span', { class: 'tc mono' }, '');
        refs[z.def.id] = { v, c };
        return el('span', { class: 'tape-item' },
          el('i', { class: 'zdot', style: { background: z.def.color } }), el('b', {}, z.def.label), v, c);
      });
      return { nodes, refs };
    };
    const a = mkSet(), b = mkSet();
    this.tapeRefs = [a.refs, b.refs];
    const tape = el('div', { class: 'tape' }, el('div', { class: 'tape-track' }, [...a.nodes, ...b.nodes]));

    // ── Panel kiểu chứng khoán: chart lớn + watchlist ──
    this.cv = el('canvas', { class: 'stock-cv' });
    this.tip = el('div', { class: 'xtip', style: { display: 'none' } });
    this.bigVal = el('span', { class: 'big-val mono' }, '—');
    this.bigChg = el('span', { class: 'chg mono' }, '');
    this.selLbl = el('b', { class: 'display' }, '');
    this.srcBadge = el('span', { class: 'badge' }, '');
    this.rangeChips = el('div', { class: 'chips' }, RANGES.map(([lb, n]) =>
      el('button', { class: 'chip' + (n === this.range ? ' on' : ''), onclick: e => {
        this.range = n;
        e.currentTarget.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
        e.currentTarget.classList.add('on');
      } }, lb)));

    this.watch = {};
    const watch = el('aside', { class: 'watch' }, zones.map(z => {
      const sp = el('canvas', { width: 96, height: 30, class: 'wspark' });
      const v = el('span', { class: 'wv mono' }, '—'), c = el('span', { class: 'wc mono' }, '');
      this.watch[z.def.id] = { sp, v, c };
      return el('button', { class: 'watch-row' + (z.def.id === this.sel ? ' on' : ''), 'data-z': z.def.id,
        onclick: () => this.select(z.def.id) },
        el('span', { class: 'wname' }, el('i', { class: 'zdot', style: { background: z.def.color } }), z.def.label),
        sp, el('span', { class: 'wcol' }, v, c));
    }));

    const stock = el('section', { class: 'panel stock' },
      el('div', { class: 'stock-main' },
        el('header', { class: 'stock-head' },
          el('div', { class: 'stock-id' }, this.selLbl, this.srcBadge),
          el('div', { class: 'stock-num' }, this.bigVal, this.bigChg),
          this.rangeChips),
        el('div', { class: 'stock-cv-wrap' }, this.cv, this.tip)),
      watch);

    // ── Cards KHO DỮ LIỆU: giá trị THẬT ──
    this.cards = {};
    const cards = el('section', {},
      el('h3', { class: 'sec-title' }, 'KHO DỮ LIỆU · GIÁ TRỊ THẬT'),
      el('div', { class: 'card-grid' }, this.cardDefs().map(cd => {
        const v = el('div', { class: 'zval mono' }, '—'), s = el('div', { class: 'zsub' }, '');
        this.cards[cd.id] = { v, s };
        return el('article', { class: 'zcard', style: { '--zc': cd.color }, onclick: cd.open || null },
          el('header', {}, el('span', { class: 'zname' }, icon(cd.icon, 15), ' ', cd.label),
            el('span', { class: 'badge' }, cd.badge)),
          v, s,
          el('footer', {}, cd.foot, icon('chevron', 13)));
      })));

    // ── Băng sự kiện thực ──
    this.tapeBody = el('tbody');
    const evt = el('section', { class: 'panel pad' },
      el('h3', { class: 'sec-title' }, 'BĂNG SỰ KIỆN THỰC'),
      el('div', { class: 'tbl-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Thời gian'), el('th', {}, 'Vùng'), el('th', {}, 'Giá trị'), el('th', {}, 'Nguồn'))),
        this.tapeBody)));

    root.append(tape, stock, cards, evt);

    this.cv.addEventListener('pointermove', e => {
      const r = this.cv.getBoundingClientRect();
      this.hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    }, { passive: true });
    this.cv.addEventListener('pointerleave', () => { this.hover = null; });

    this._offs.push(Kernel.on('engine:tick', () => this.onTick()));
    this.select('runtime');
    this.onTick();
    this.loop();
  },

  unmount(){ cancelAnimationFrame(this._raf); this._offs.forEach(f => f()); this._offs = []; },

  cardDefs(){
    const C = Store.collections, rec = n => (C[n] || []).length;
    return [
      { id: 'content', label: 'Content', icon: 'content', color: '#ff6b8b', badge: 'local', foot: 'Mở trang',
        open: () => Router.go('content'),
        get: () => { const l = C.content;
          return { v: fmt.num(l.length), s: `${fmt.compact(l.reduce((s, p) => s + (p.views || 0), 0))} lượt xem · ${new Set(l.map(p => p.category)).size} chuyên mục` }; } },
      { id: 'media', label: 'Media', icon: 'media', color: '#b48bf3', badge: 'local', foot: 'Mở trang',
        open: () => Router.go('media'),
        get: () => { const l = C.media;
          return { v: fmt.num(l.length), s: `${fmt.bytes(l.reduce((s, m) => s + m.sizeKB, 0) * 1024)} tổng dung lượng` }; } },
      { id: 'files', label: 'Files', icon: 'files', color: '#e8e6a3', badge: 'local', foot: 'Mở trang',
        open: () => Router.go('files'),
        get: () => { const l = C.files;
          return { v: fmt.num(l.length), s: `${fmt.bytes(l.reduce((s, f) => s + f.sizeKB, 0) * 1024)} · ${new Set(l.map(f => f.type)).size} định dạng` }; } },
      { id: 'storage', label: 'Storage', icon: 'db', color: '#ff6b8b', badge: 'real', foot: 'Chi tiết',
        open: () => this.openZone(Store.zones.get('storage')),
        get: () => ({ v: fmt.bytes(Store.bytesUsed()), s: 'localStorage đo trực tiếp' }) },
      { id: 'net', label: 'Network', icon: 'pulse', color: '#ffb454', badge: 'real', foot: 'Server',
        open: () => Router.go('server'),
        get: () => ({ v: Engine.online ? Engine.latency + ' ms' : 'OFFLINE', s: 'HEAD ping thực · ' + (Engine.online ? 'online' : 'mất mạng') }) },
      { id: 'session', label: 'Phiên', icon: 'clock', color: '#4cc9f0', badge: 'real', foot: 'Clients',
        open: () => Router.go('clients'),
        get: () => ({ v: fmt.uptime(Kernel.uptime()), s: `${fmt.compact(Kernel.events)} sự kiện bus` }) },
    ];
  },

  chg(z, back = 60){
    const b = z.buffer; if (b.length < 2) return 0;
    const cur = b.at(-1).v, prev = b[Math.max(0, b.length - 1 - back)].v || cur;
    return prev ? ((cur - prev) / prev) * 100 : 0;
  },
  chgEl(txt, d){
    txt.textContent = (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%';
    txt.className = txt.className.replace(/ ?(up|down)/g, '') + ' ' + (d >= 0 ? 'up' : 'down');
  },

  select(id){
    this.sel = id;
    const z = Store.zones.get(id);
    this.selLbl.textContent = z.def.label;
    this.srcBadge.textContent = z.def.source;
    document.querySelectorAll('.watch-row').forEach(r => r.classList.toggle('on', r.dataset.z === id));
    this.onTick();
  },

  onTick(){
    for (const z of Store.zones.values()) {
      const d = this.chg(z, 60);
      for (const refs of this.tapeRefs) {
        refs[z.def.id].v.textContent = fmt.val(z.value) + ' ' + z.def.unit;
        this.chgEl(refs[z.def.id].c, d);
      }
      const w = this.watch[z.def.id];
      w.v.textContent = fmt.val(z.value);
      this.chgEl(w.c, d);
      this.spark(w.sp, z);
    }
    const z = Store.zones.get(this.sel);
    this.bigVal.textContent = fmt.val(z.value) + ' ' + z.def.unit;
    this.chgEl(this.bigChg, this.chg(z, 60));
    for (const cd of this.cardDefs()) {
      const r = this.cards[cd.id]; if (!r) continue;
      const o = cd.get(); r.v.textContent = o.v; r.s.textContent = o.s;
    }
    // băng sự kiện
    const rows = [...Store.zones.values()]
      .flatMap(z => z.events.slice(0, 5).map(e => ({ t: e.t, z, e })))
      .sort((a, b) => b.t - a.t).slice(0, 10);
    this.tapeBody.innerHTML = '';
    rows.forEach(r => this.tapeBody.append(el('tr', {},
      el('td', { class: 'mono' }, fmt.time(r.t)),
      el('td', {}, el('i', { class: 'zdot', style: { background: r.z.def.color } }), ' ', r.z.def.label),
      el('td', { class: 'mono' }, fmt.val(r.e.v) + ' ' + r.z.def.unit),
      el('td', {}, el('span', { class: 'badge' }, r.e.origin)))));
  },

  spark(cv, z){
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    const b = z.buffer.slice(-60); if (b.length < 2) return;
    let mn = Math.min(...b.map(s => s.v)), mx = Math.max(...b.map(s => s.v));
    if (mx === mn) { mx += 1; mn = Math.max(0, mn - 1); }
    ctx.beginPath();
    b.forEach((s, i) => {
      const x = i / (b.length - 1) * w, y = h - 2 - (s.v - mn) / (mx - mn) * (h - 4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = z.def.color; ctx.lineWidth = 1.4; ctx.stroke();
  },

  loop(){ this.drawChart(); this._raf = requestAnimationFrame(() => this.loop()); },

  // ── Chart chính: trục giá, trục thời gian, last-price tag, crosshair ──
  drawChart(){
    const cv = this.cv; if (!cv?.isConnected) return;
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const z = Store.zones.get(this.sel), col = z.def.color;
    const slice = z.buffer.slice(-this.range);
    const padL = 52, padR = 66, padT = 14, padB = 24, pw = W - padL - padR, ph = H - padT - padB;
    if (slice.length < 2) {
      ctx.fillStyle = 'rgba(160,190,200,.6)'; ctx.font = '12px "Be Vietnam Pro",sans-serif';
      ctx.fillText('Đang thu thập dữ liệu thật…', padL + 8, padT + 22);
      return;
    }
    let mn = Infinity, mx = -Infinity;
    slice.forEach(s => { mn = Math.min(mn, s.v); mx = Math.max(mx, s.v); });
    if (mx - mn < 1e-9) { mx += 1; mn = Math.max(0, mn - 1); }
    const pad = (mx - mn) * 0.12; mx += pad; mn = Math.max(0, mn - pad);
    const X = i => padL + pw * i / (slice.length - 1);
    const Y = v => padT + ph - (v - mn) / (mx - mn) * ph;

    ctx.font = '10px "IBM Plex Mono",monospace';
    for (let g = 0; g <= 4; g++) {
      const v = mn + (mx - mn) * g / 4, y = Y(v);
      ctx.strokeStyle = 'rgba(150,195,205,.09)';
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
      ctx.fillStyle = 'rgba(160,190,200,.55)'; ctx.fillText(fmt.val(v), 8, y + 3);
    }
    const every = Math.ceil(slice.length / 5);
    for (let i = 0; i < slice.length; i += every) {
      ctx.fillStyle = 'rgba(160,190,200,.45)';
      ctx.fillText(fmt.time(slice[i].t), X(i) - 22, H - 7);
    }

    ctx.beginPath();
    slice.forEach((s, i) => i ? ctx.lineTo(X(i), Y(s.v)) : ctx.moveTo(X(0), Y(s.v)));
    const g2 = ctx.createLinearGradient(0, padT, 0, padT + ph);
    g2.addColorStop(0, col + '38'); g2.addColorStop(1, col + '00');
    ctx.save();
    ctx.lineTo(X(slice.length - 1), padT + ph); ctx.lineTo(X(0), padT + ph); ctx.closePath();
    ctx.fillStyle = g2; ctx.fill(); ctx.restore();
    ctx.beginPath();
    slice.forEach((s, i) => i ? ctx.lineTo(X(i), Y(s.v)) : ctx.moveTo(X(0), Y(s.v)));
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.stroke();

    // last-price line + tag (chuẩn trading)
    const lv = slice.at(-1).v, ly = Y(lv);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = col + '88';
    ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(padL + pw, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.fillRect(padL + pw + 6, ly - 9, 56, 18);
    ctx.fillStyle = '#06141a'; ctx.fillText(fmt.val(lv), padL + pw + 11, ly + 4);

    // crosshair + tooltip
    if (this.hover && this.hover.x >= padL && this.hover.x <= padL + pw) {
      const idx = Math.round((this.hover.x - padL) / pw * (slice.length - 1));
      const s = slice[idx];
      if (s) {
        const sx = X(idx), sy = Y(s.v);
        ctx.strokeStyle = 'rgba(230,242,244,.25)';
        ctx.beginPath(); ctx.moveTo(sx, padT); ctx.lineTo(sx, padT + ph); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 7); ctx.fill();
        this.tip.style.display = 'block';
        this.tip.style.left = Math.min(W - 170, sx + 12) + 'px';
        this.tip.style.top = Math.max(4, sy - 42) + 'px';
        this.tip.textContent = `${fmt.val(s.v)} ${z.def.unit} · ${fmt.time(s.t)}`;
        return;
      }
    }
    this.tip.style.display = 'none';
  },

  openZone(z){
    const b = z.buffer.map(s => s.v);
    const stats = [
      ['Hiện tại', fmt.val(z.value) + ' ' + z.def.unit],
      ['Thấp nhất', b.length ? fmt.val(Math.min(...b)) : '—'],
      ['Cao nhất', b.length ? fmt.val(Math.max(...b)) : '—'],
      ['Trung bình', b.length ? fmt.val(b.reduce((a, c) => a + c, 0) / b.length) : '—'],
      ['Mẫu', fmt.num(b.length)], ['Nguồn', z.def.source]];
    const spark = el('canvas', { width: 720, height: 90, class: 'spark' });
    openModal({
      title: `${z.def.label} · dữ liệu thật`, icon: 'db', wide: true,
      body: el('div', {},
        el('p', { class: 'zone-desc' }, z.def.desc),
        el('code', { class: 'zone-schema' }, z.def.schema),
        el('div', { class: 'stat-grid' }, stats.map(([k, v]) =>
          el('div', { class: 'stat' }, el('small', {}, k), el('b', { class: 'mono' }, v)))),
        spark,
        el('h4', { class: 'sub-h' }, 'SỰ KIỆN GẦN NHẤT'),
        el('div', { class: 'tbl-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, el('th', {}, 'Thời gian'), el('th', {}, 'Giá trị'), el('th', {}, 'Nguồn'))),
          el('tbody', {}, z.events.slice(0, 12).map(e => el('tr', {},
            el('td', { class: 'mono' }, fmt.time(e.t)),
            el('td', { class: 'mono' }, fmt.val(e.v) + ' ' + z.def.unit),
            el('td', {}, el('span', { class: 'badge' }, e.origin)))))))),
      footer: [el('button', { class: 'btn', onclick: () =>
        download(`zone-${z.def.id}.json`, JSON.stringify({ def: z.def, buffer: z.buffer }, null, 2)) },
        icon('download', 14), 'Xuất JSON')],
    });
    const ctx = spark.getContext('2d');
    if (b.length > 1) {
      const mn = Math.min(...b), mx = Math.max(...b) || 1;
      ctx.strokeStyle = z.def.color; ctx.lineWidth = 1.5; ctx.beginPath();
      b.forEach((v, i) => {
        const x = i / (b.length - 1) * 720, y = 84 - (v - mn) / ((mx - mn) || 1) * 76;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    }
  },
};
export default M;
