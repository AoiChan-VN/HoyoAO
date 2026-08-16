import { Kernel } from './kernel.js';
import { Store } from './store.js';
import { Engine } from './engine.js';
import { Router } from './router.js';
import { Branding } from './branding.js';
import { el, icon, fmt, toast } from './ui.js';
import { MODULES } from '../config/modules.config.js';
import { ZONES } from '../data/zones.js';
import { CONTENT_SEED } from '../data/content.seed.js';
import { MEDIA_SEED } from '../data/media.seed.js';
import { FILES_SEED } from '../data/files.seed.js';

// ══════ COMPOSITION ROOT: nơi duy nhất ghép mọi thứ lại ══════
async function boot(){
  Branding.load();
  Store.init(ZONES, { content: CONTENT_SEED, media: MEDIA_SEED, files: FILES_SEED });
  Kernel.service('store', Store); Kernel.service('engine', Engine);
  await Kernel.loadModules(MODULES);
  buildChrome();
  Engine.start();
  Router.start();

  Kernel.on('route:changed', d => { Engine.pulse('runtime', 12); updateNav(d); });
  Kernel.on('branding:applied', renderBrand);
  addEventListener('beforeunload', () => Store.flush());
  toast(`Kernel khởi động · ${Kernel.modules.length} module đã nạp`, 'ok');
}

function renderBrand(){
  const { logo, name, product, avatar } = Kernel.meta;
  const brand = document.getElementById('brand');
  brand.innerHTML = '';
  brand.append(
    el('span', { class: 'logo-chip' }, icon(logo.icon || 'hex', 20)),
    el('div', { class: 'brand-txt' }, el('strong', { class: 'display' }, logo.text || name), el('small', {}, product)));
  const av = document.getElementById('avatarChip');
  av.innerHTML = '';
  if (avatar.kind === 'image' && avatar.src) av.append(el('img', { src: avatar.src, alt: 'avatar' }));
  else av.append(el('span', {}, avatar.value || name[0] || 'H'));
}

function buildChrome(){
  renderBrand();

  // ── Đồng hồ hệ thống (System / Date) ──
  const clock = document.getElementById('sysClock');
  const tickClock = () => {
    const t = Date.now();
    clock.innerHTML = `<b class="mono">${fmt.time(t)}</b><small>${fmt.dayDate(t)}</small>`;
  };
  tickClock(); setInterval(tickClock, 1000);

  // ── Menu trái: sinh từ manifest module, không hardcode ──
  const nav = document.getElementById('sidenav');
  const item = m => el('button', {
    class: 'snav-item', 'data-path': m.manifest.routes[0],
    onclick: () => Router.go(m.manifest.routes[0]),
  }, icon(m.manifest.icon, 18), el('span', {}, m.manifest.name));
  const ops = Kernel.modules.filter(m => m.manifest.id !== 'settings');
  const sys = Kernel.modules.filter(m => m.manifest.id === 'settings');
  nav.append(el('div', { class: 'snav-label' }, 'VẬN HÀNH'), ops.map(item),
             el('div', { class: 'snav-label' }, 'HỆ THỐNG'), sys.map(item));

  // ── Status bar ──
  const sb = document.getElementById('statusbar');
  sb.append(
    el('div', { class: 'st-left' },
      el('span', { class: 'st-dot' }),
      el('span', { class: 'mono', id: 'stUp' }, '00:00:00'),
      el('span', { class: 'st-sep' }),
      el('span', { class: 'mono', id: 'stEv' }, '0 sự kiện')),
    el('div', { class: 'st-mid' },
      `${Kernel.modules.length} module · ${Store.zones.size} vùng dữ liệu · v${Kernel.meta.version}`),
    el('div', { class: 'st-right' },
      el('a', { href: Kernel.meta.links.support }, 'Support'),
      el('a', { href: Kernel.meta.links.community }, 'Community'),
      el('span', { class: 'st-sep' }),
      el('span', {}, Kernel.meta.copyright)));
  setInterval(() => {
    document.getElementById('stUp').textContent = fmt.uptime(Kernel.uptime());
    document.getElementById('stEv').textContent = fmt.compact(Kernel.events) + ' sự kiện';
  }, 1000);
}

function updateNav({ path, manifest }){
  document.querySelectorAll('.snav-item').forEach(b =>
    b.classList.toggle('on', b.dataset.path === path));
  document.getElementById('pageTitle').textContent = manifest.name;
}

boot(); 
