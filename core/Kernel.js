import { APP, ICONS } from '../config/app.config.js';

// ══════ NHÂN OS: registry + event bus + module loader ══════
// Bất biến: thêm bao nhiêu module cũng không cần sửa file này.
const bus = new EventTarget();

export const Kernel = {
  meta: JSON.parse(JSON.stringify(APP)),   // bản sao độc lập với config gốc
  icons: ICONS,
  modules: [],                              // manifest đã nạp, theo thứ tự config
  routes: new Map(),
  services: new Map(),
  startedAt: Date.now(),
  events: 0,

  on(ev, fn){ bus.addEventListener(ev, fn); return () => bus.removeEventListener(ev, fn); },
  emit(ev, detail){ this.events++; bus.dispatchEvent(new CustomEvent(ev, { detail })); },

  service(name, impl){ if (impl !== undefined) this.services.set(name, impl); return this.services.get(name); },

  async loadModules(list){
    for (const entry of list.filter(m => m.enabled !== false)) {
      try {
        const mod = await import(new URL('../' + entry.path, import.meta.url).href);
        const inst = mod.default;
        inst.__entry = entry;
        this.modules.push(inst);
        (inst.manifest.routes || []).forEach(r => this.routes.set(r, inst));
        await inst.init?.(this);
      } catch (err) {
        console.error(`[Kernel] Không nạp được module "${entry.id}":`, err);
        this.emit('kernel:module-error', { id: entry.id });
      }
    }
  },

  module(id){ return this.modules.find(m => m.manifest.id === id); },
  uptime(){ return Date.now() - this.startedAt; },
}; 
