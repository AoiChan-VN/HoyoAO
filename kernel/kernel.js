// kernel/kernel.js — NHÂN: registry, lifecycle, cấp ctx giới hạn theo permissions
import { createBus } from './bus.js';
import { createVFS, scopedVFS } from './vfs.js';
import { createProcessManager } from './process.js';
import { bridge } from './bridge.js';

export const Kernel = {
  bus: createBus(),
  vfs: null, procs: null,
  apps: [], routes: new Map(),
  meta: {}, startedAt: Date.now(), events: 0,

  async init({ branding, adapter }){
    this.meta = branding;
    this.vfs = createVFS(bridge.pickAdapter(adapter));
    this.procs = createProcessManager(this.bus);
    // đếm sự kiện bus → telemetry ops
    this.bus.on('*', () => { this.events++; });
  },

  can(manifest, perm){
    const set = new Set(manifest.permissions || []);
    return set.has('*') || set.has(perm);
  },

  // Context giới hạn — thứ DUY NHẤT app nhận được
  makeContext(manifest, system){
    const can = p => this.can(manifest, p);
    return {
      manifest,
      bus: this.bus,
      router: system.router,
      ui: system.ui,
      telemetry: can('telemetry') ? system.telemetry : null,
      notify: can('notify') ? system.notify : null,
      vfs: (can('vfs.read') || can('vfs.write')) ? scopedVFS(this.vfs, manifest.id, can) : null,
      bridge,
    };
  },

  async loadApp(entry, system){
    const url = new URL(entry.path, import.meta.url).href;
    const mod = await import(url);
    const app = mod.default;
    app.__entry = entry;
    // inject CSS của app
    for (const css of (app.manifest.styles || [])){
      const href = new URL(css, url).href;
      if (!document.querySelector(`link[data-app="${app.manifest.id}"]`)){
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = href; l.dataset.app = app.manifest.id;
        document.head.append(l);
      }
    }
    (app.manifest.routes || []).forEach(r => this.routes.set(r, app));
    this.apps.push(app);
    return app;
  },

  mountApp(app, rootEl, system){
    const ctx = this.makeContext(app.manifest, system);
    const proc = this.procs.spawn(app);
    app.__ctx = ctx; app.__proc = proc;
    app.mount?.(ctx, rootEl);
    return proc;
  },
  unmountApp(app){
    app.unmount?.(app.__ctx);
    if (app.__proc) this.procs.kill(app.__proc.pid);
    // gỡ CSS
    document.querySelectorAll(`link[data-app="${app.manifest.id}"]`).forEach(l => l.remove());
  },
}; 
