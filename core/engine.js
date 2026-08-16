import { Kernel } from './kernel.js';
import { Store } from './store.js';

// ══════ BỘ MÁY REALTIME: sinh luồng ra/vào cho mọi vùng ══════
export const Engine = {
  t: 0, timer: null,

  start(){ this.timer = setInterval(() => this.tick(), 1000); },

  tick(){
    this.t++;
    for (const [id, z] of Store.zones) Store.ingest(id, this.generate(z, this.t), { origin: 'engine' });
    if (this.t % 5 === 0) Store.flush();
    Kernel.emit('engine:tick', this.t);
  },

  generate(z, t){
    const base = z.def.base || 20, r = Math.random();
    switch (z.def.pattern) {
      case 'burst':  return base * (0.6 + r * 0.5) + (Math.random() < 0.08 ? base * (0.8 + Math.random() * 1.5) : 0);
      case 'pulse':  return base * (0.7 + 0.5 * Math.abs(Math.sin(t / 6))) * (0.9 + r * 0.2);
      case 'tidal':  return base * (0.8 + 0.35 * Math.sin(t / 15) + r * 0.1);
      case 'drift':
        z._walk = Math.min(base * 1.8, Math.max(base * 0.4, (z._walk ?? base) + (r - 0.48) * base * 0.12));
        return z._walk;
      default:       return base * (0.85 + r * 0.3); // steady
    }
  },

  // Hoạt động THẬT của người dùng → đẩy nhịp vào vùng tương ứng
  pulse(zoneId = 'runtime', boost = 10){
    const z = Store.zones.get(zoneId); if (!z) return;
    Store.ingest(zoneId, z.def.base * 0.6 + z.value * 0.4 + boost + Math.random() * boost, { origin: 'user' });
  },
}; 
