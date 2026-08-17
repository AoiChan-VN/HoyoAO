// boot/boot.js — BOOTLOADER: kernel → system → apps → chrome
import { Kernel } from '../kernel/kernel.js';
import { localStorageAdapter } from '../kernel/vfs.js';
import { APP } from '../config/branding.config.js';
import { APPS } from '../config/apps.config.js';
import * as ui from '../system/ui/index.js';
import * as telemetry from '../kernel/telemetry.js';

const system = { ui, telemetry, router: null, notify: null };

async function boot(){
  await Kernel.init({ branding: APP, adapter: localStorageAdapter() });

  // system services (router/notify khởi tạo ở đây, truyền vào ctx)
  const { Router } = await import('../kernel/router.js');
  const { notify } = await import('../system/notify.js');
  system.router = Router; system.notify = notify;

  // nạp apps theo config
  for (const entry of APPS.filter(a => a.enabled !== false)){
    try { await Kernel.loadApp(entry, system); }
    catch (e) { console.error(`[boot] app "${entry.id}" fail:`, e); }
  }

  buildChrome();
  telemetry.start(Kernel);
  Router.start(Kernel);
  Kernel.bus.on('route:changed', e => updateNav(e.detail));
}

function buildChrome(){ /* topbar / sidenav / statusbar — sinh từ Kernel.apps */ }
function updateNav({ path, manifest }){
  document.querySelectorAll('.snav-item').forEach(b => b.classList.toggle('on', b.dataset.path === path));
  document.getElementById('pageTitle').textContent = manifest?.name || '';
}

boot(); 
