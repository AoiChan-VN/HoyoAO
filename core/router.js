import { Kernel } from './kernel.js';

// Route do chính module ĐĂNG KÝ — shell không biết trước trang nào tồn tại.
export const Router = {
  current: null,
  start(){
    addEventListener('hashchange', () => this.resolve());
    if (!location.hash) history.replaceState(null, '', '#/dashboard');
    this.resolve();
  },
  path(){ return location.hash.replace(/^#\/?/, '') || 'dashboard'; },

  async resolve(){
    const path = this.path();
    const mod = Kernel.routes.get(path) || Kernel.routes.get('dashboard');
    if (!mod) return;
    const main = document.getElementById('main');
    if (this.current && this.current !== mod) await this.current.unmount?.();
    if (this.current !== mod) { main.innerHTML = ''; await mod.mount?.(main); }
    this.current = mod;
    Kernel.emit('route:changed', { path, manifest: mod.manifest });
  },

  go(p){ location.hash = '#/' + p; },
}; 
