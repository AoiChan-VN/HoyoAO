import { Kernel } from './kernel.js';

const KEY = 'hoyoao.webos.v1.branding';

// Đổi logo / icon / avatar / màu → 1 nơi, áp dụng toàn OS, lưu bền.
export const Branding = {
  load(){
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (o.logo)    Object.assign(Kernel.meta.logo, o.logo);
      if (o.accent)  Kernel.meta.accent = o.accent;
      if (o.avatar)  Kernel.meta.avatar = o.avatar;
      if (o.tagline) Kernel.meta.tagline = o.tagline;
    } catch (e) {}
    this.apply();
  },
  save(o){ localStorage.setItem(KEY, JSON.stringify(o)); this.load(); },
  reset(){ localStorage.removeItem(KEY); location.reload(); },
  current(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
  apply(){
    document.documentElement.style.setProperty('--accent', Kernel.meta.accent);
    document.title = `${Kernel.meta.logo.text || Kernel.meta.name} · ${Kernel.meta.product}`;
    Kernel.emit('branding:applied');
  },
}; 
