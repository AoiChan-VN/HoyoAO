import { Kernel } from './kernel.js';

// ══════ KHO DỮ LIỆU: vùng (zones) + bộ sưu tập + lịch sử ══════
// Nguyên tắc: code KHÔNG chứa dữ liệu — dữ liệu vào/ra qua đây.
const NS = 'hoyoao.webos.v1.';
export const CAP = 140;   // số mẫu giữ trong buffer visualization

const todayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

export const Store = {
  zones: new Map(),
  collections: { content: [], media: [], files: [] },
  history: {},                       // 'YYYY-MM-DD' -> { zoneId: số sự kiện }

  init(zoneDefs, seeds = {}){
    zoneDefs.forEach(def => this.zones.set(def.id, {
      def: { ...def }, buffer: [], events: [], total: 0, count: 0, peak: 0, last: null,
      value: def.base, scale: def.base * 2,
    }));
    this.restore();
    for (const [name, list] of Object.entries(seeds)) {
      if (!this.collections[name]) this.collections[name] = [];
      if (this.collections[name].length === 0) this.collections[name] = list.slice();
    }
    this.persistCollections();
    this.syncLocalTruth();
    for (const z of this.zones.values()) this.prefill(z);
  },

  // ── nạp/ghi bền ──
  restore(){
    try {
      const c = JSON.parse(localStorage.getItem(NS + 'counters') || '{}');
      for (const [id, v] of Object.entries(c)) {
        const z = this.zones.get(id); if (z) Object.assign(z, v);
      }
      this.history = JSON.parse(localStorage.getItem(NS + 'history') || '{}');
      for (const name of Object.keys(this.collections)) {
        const raw = localStorage.getItem(NS + 'col.' + name);
        if (raw) this.collections[name] = JSON.parse(raw);
      }
    } catch (e) { console.warn('[Store] restore lỗi:', e); }
  },
  flush(){
    try {
      const counters = Object.fromEntries([...this.zones].map(([id, z]) =>
        [id, { total: z.total, count: z.count, peak: z.peak }]));
      localStorage.setItem(NS + 'counters', JSON.stringify(counters));
      localStorage.setItem(NS + 'history', JSON.stringify(this.history));
      this.persistCollections();
    } catch (e) { /* storage đầy — bỏ qua */ }
  },
  persistCollections(){
    for (const name of Object.keys(this.collections)) {
      try { localStorage.setItem(NS + 'col.' + name, JSON.stringify(this.collections[name])); } catch (e) {}
    }
  },

  // ── tổng hợp dữ liệu lịch sử để visualization sống ngay khi boot ──
  prefill(z){
    const now = Date.now(); let v = z.def.base;
    for (let i = 90; i > 0; i--) {
      v = Math.max(2, v + (Math.random() - 0.5) * z.def.base * 0.35);
      z.buffer.push({ t: now - i * 1000, v });
    }
    z.value = v;
    z.scale = Math.max(10, Math.max(...z.buffer.map(p => p.v)) * 1.15);
  },

  // ── base của engine bám theo DỮ LIỆU THẬT (không hardcode) ──
  syncLocalTruth(){
    const rec = n => (this.collections[n] || []).length;
    const set = (id, base) => { const z = this.zones.get(id); if (z) z.def.base = base; };
    set('local',   14 + (rec('content') + rec('media') + rec('files')) * 1.6);
    set('content', 8 + rec('content') * 1.4);
    set('media',   7 + rec('media') * 1.2);
    set('storage', Math.min(96, 10 + this.bytesUsed() / 1024 / 6));
  },

  // ── LỐI VÀO DUY NHẤT của mọi dữ liệu → tự phân loại theo vùng ──
  ingest(zoneId, v, meta = {}){
    const z = this.zones.get(zoneId); if (!z) return;
    v = Math.max(0, +v || 0);
    const t = Date.now();
    z.buffer.push({ t, v }); if (z.buffer.length > CAP) z.buffer.shift();
    z.value = v; z.count++; z.total += v;
    z.peak = Math.max(z.peak, v); z.last = { t, v };
    z.scale = Math.max(10, z.peak * 1.12);
    z.events.unshift({ t, v, origin: meta.origin || 'sys' });
    if (z.events.length > 40) z.events.pop();
    const k = todayKey();
    (this.history[k] ||= {})[zoneId] = ((this.history[k] || {})[zoneId] || 0) + 1;
    Kernel.emit('zone:' + zoneId, z);
    Kernel.emit('zone:update', { id: zoneId, z });
  },

  // ── collections (content / media / files) ──
  addRecord(col, item){
    item.id ??= uid(); item.createdAt ??= Date.now();
    this.collections[col].unshift(item);
    this.persistCollections(); this.syncLocalTruth();
    this.ingest('local', 1, { origin: 'user' });
    return item;
  },
  mutateRecord(col, id, patch){
    const it = this.collections[col].find(x => x.id === id);
    if (it) { Object.assign(it, patch); this.persistCollections(); }
    return it;
  },
  removeRecord(col, id){
    this.collections[col] = this.collections[col].filter(x => x.id !== id);
    this.persistCollections(); this.syncLocalTruth();
    this.ingest('local', 1, { origin: 'user' });
  },

  // ── thống kê / truy vấn ──
  bytesUsed(){
    let b = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(NS)) b += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
    return b;
  },
  historySeries(zone, days){
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const k = todayKey(Date.now() - i * 864e5);
      const rec = this.history[k] || {};
      const total = zone === 'all'
        ? Object.values(rec).reduce((s, n) => s + n, 0)
        : (rec[zone] || 0);
      out.push({ k, label: k.slice(5).split('-').reverse().join('/'), total });
    }
    return out;
  },
  eventsByOrigin(){
    const m = {};
    for (const z of this.zones.values())
      for (const e of z.events) m[e.origin] = (m[e.origin] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  },

  // ── xuất / nhập / đặt lại ──
  exportAll(){
    return JSON.stringify({
      version: Kernel.meta.version, exportedAt: new Date().toISOString(),
      branding: JSON.parse(localStorage.getItem(NS + 'branding') || '{}'),
      collections: this.collections, history: this.history,
      counters: Object.fromEntries([...this.zones].map(([id, z]) => [id, { total: z.total, count: z.count, peak: z.peak }])),
    }, null, 2);
  },
  importAll(text){
    const d = JSON.parse(text);
    if (!d.collections) throw new Error('File không đúng định dạng backup.');
    localStorage.setItem(NS + 'branding', JSON.stringify(d.branding || {}));
    for (const [name, list] of Object.entries(d.collections))
      localStorage.setItem(NS + 'col.' + name, JSON.stringify(list));
    localStorage.setItem(NS + 'history', JSON.stringify(d.history || {}));
    localStorage.setItem(NS + 'counters', JSON.stringify(d.counters || {}));
    location.reload();
  },
  resetAll(){
    Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k));
    location.reload();
  },
}; 
