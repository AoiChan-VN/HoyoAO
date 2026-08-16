import { Kernel } from './kernel.js';
import { Store } from './store.js';

// ══════ ĐO THẬT, không sinh số giả ══════
export const Engine = {
  t: 0, timer: null, _raf: 0, frames: 0, lastEvents: 0,
  latency: 0, online: navigator.onLine,

  start(){
    if (this.timer) return;
    addEventListener('online',  () => { this.online = true;  Kernel.emit('net:change', true);  });
    addEventListener('offline', () => { this.online = false; Kernel.emit('net:change', false); });
    const loop = () => { this.frames++; this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
    this.timer = setInterval(() => this.tick(), 1000);
    this.ping();
  },
  stop(){ clearInterval(this.timer); cancelAnimationFrame(this._raf); this.timer = null; },

  async ping(){
    const t0 = performance.now();
    try {
      await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
      this.latency = Math.max(1, Math.round(performance.now() - t0));
    } catch { this.latency = 0; }
  },

  tick(){
    this.t++;
    const fps = this.frames; this.frames = 0;                       // FPS thật
    const ops = Kernel.events - this.lastEvents; this.lastEvents = Kernel.events; // bus ops thật
    if (this.t % 5 === 0) this.ping();
    const rec = n => (Store.collections[n] || []).length;
    const samples = {
      runtime: ops,
      fps,
      network: this.online ? this.latency : 0,
      memory: performance.memory
        ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
        : document.getElementsByTagName('*').length,
      storage: +(Store.bytesUsed() / 1024).toFixed(1),
      local: rec('content') + rec('media') + rec('files') + rec('scores'),
    };
    for (const [id, v] of Object.entries(samples)) Store.ingest(id, v, { origin: 'telemetry' });
    if (this.t % 5 === 0) Store.flush();
    Kernel.emit('engine:tick', this.t);
  },
};
