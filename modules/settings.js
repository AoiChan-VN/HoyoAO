import { Kernel } from '../core/kernel.js';
import { Store } from '../core/store.js';
import { Branding } from '../core/branding.js';
import { el, icon, fmt, download, confirmDialog, toast } from '../core/ui.js';

const SWATCHES = ['#4cc9f0', '#7ae582', '#ffb454', '#ff6b8b', '#b48bf3', '#e8e6a3'];

const M = {
  manifest: { id: 'settings', name: 'Settings', icon: 'settings', routes: ['settings'] },
  _timer: null,

  mount(root){
    root.append(el('div', { class: 'set-grid' }, this.brandPanel(), this.dataPanel(), this.osPanel()));
    this._timer = setInterval(() => {
      const up = document.getElementById('setUp'); if (up) up.textContent = fmt.uptime(Kernel.uptime());
    }, 1000);
  },
  unmount(){ clearInterval(this._timer); },

  // ── 1) Nhận diện: đổi logo/icon/avatar tại đây, áp dụng ngay ──
  brandPanel(){
    const cur = { logo: { ...Kernel.meta.logo }, avatar: { ...Kernel.meta.avatar }, accent: Kernel.meta.accent,
      ...(Branding.current()) };
    const save = () => { Branding.save(cur); toast('Đã áp dụng nhận diện mới'); };

    const iconGrid = el('div', { class: 'icon-grid' },
      Object.keys(Kernel.icons).map(name => el('button', {
        class: 'icon-opt' + (cur.logo.icon === name ? ' on' : ''), title: name,
        onclick: e => { cur.logo.icon = name;
          e.currentTarget.parentNode.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('on'));
          e.currentTarget.classList.add('on'); save(); },
      }, icon(name, 17))));

    const avatarFile = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { cur.avatar = { kind: 'image', src: rd.result }; save(); };
      rd.readAsDataURL(f);
    }});

    return el('section', { class: 'panel pad' },
      el('h3', { class: 'sec-title' }, 'NHẬN DIỆN THƯƠNG HIỆU'),
      el('label', { class: 'f-label' }, 'Chữ logo'),
      el('input', { class: 'field', value: cur.logo.text || '', oninput: e => { cur.logo.text = e.target.value; save(); } }),
      el('label', { class: 'f-label' }, 'Icon logo'), iconGrid,
      el('label', { class: 'f-label' }, 'Màu nhấn'),
      el('div', { class: 'swatches' }, SWATCHES.map(c => el('button', {
        class: 'swatch' + (cur.accent === c ? ' on' : ''), style: { background: c },
        onclick: e => { cur.accent = c;
          e.currentTarget.parentNode.querySelectorAll('.swatch').forEach(b => b.classList.remove('on'));
          e.currentTarget.classList.add('on'); save(); },
      }))),
      el('label', { class: 'f-label' }, 'Avatar'),
      el('div', { class: 'ctl-row' },
        el('input', { class: 'field', placeholder: 'Chữ avatar (vd: H)', value: cur.avatar.value || '',
          oninput: e => { cur.avatar = { kind: 'letter', value: e.target.value }; save(); } }),
        el('button', { class: 'btn', onclick: () => avatarFile.click() }, icon('upload', 14), 'Ảnh'),
        avatarFile),
      el('button', { class: 'btn ghost', onclick: () => confirmDialog('Về mặc định', 'Khôi phục nhận diện gốc?', () => Branding.reset(), false) },
        'Đặt lại mặc định'));
  },

  // ── 2) Dữ liệu: xuất / nhập / reset — chứng minh data tách khỏi code ──
  dataPanel(){
    const importFile = el('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { Store.importAll(rd.result); } catch (err) { toast(err.message, 'err'); } };
      rd.readAsText(f);
    }});
    return el('section', { class: 'panel pad' },
      el('h3', { class: 'sec-title' }, 'DỮ LIỆU & LƯU TRỮ'),
      el('div', { class: 'stat-grid two' },
        el('div', { class: 'stat' }, el('small', {}, 'Dung lượng đã dùng'), el('b', { class: 'mono' }, fmt.bytes(Store.bytesUsed()))),
        el('div', { class: 'stat' }, el('small', {}, 'Bản ghi'),
          el('b', { class: 'mono' }, fmt.num(Object.values(Store.collections).reduce((s, c) => s + c.length, 0))))),
      el('p', { class: 'hint' }, 'Toàn bộ dữ liệu nằm trong localStorage, độc lập với code. Xuất ra để sao lưu hoặc mang sang thiết bị khác.'),
      el('div', { class: 'ctl-row' },
        el('button', { class: 'btn primary', onclick: () =>
          download((Kernel.meta.name + '-backup.json').toLowerCase(), Store.exportAll()) },
          icon('download', 14), 'Xuất backup'),
        el('button', { class: 'btn', onclick: () => importFile.click() }, icon('upload', 14), 'Nhập backup'),
        importFile,
        el('button', { class: 'btn danger', onclick: () =>
          confirmDialog('Xóa toàn bộ', 'Xóa sạch dữ liệu và về trạng thái seed ban đầu?', () => Store.resetAll()) },
          icon('trash', 14), 'Reset')));
  },

  // ── 3) Hệ thống: OS đang chạy gì ──
  osPanel(){
    return el('section', { class: 'panel pad' },
      el('h3', { class: 'sec-title' }, 'HỆ THỐNG / OS'),
      el('div', { class: 'stat-grid two' },
        el('div', { class: 'stat' }, el('small', {}, 'Uptime'), el('b', { class: 'mono', id: 'setUp' }, fmt.uptime(Kernel.uptime()))),
        el('div', { class: 'stat' }, el('small', {}, 'Phiên bản'), el('b', { class: 'mono' }, 'v' + Kernel.meta.version))),
      el('h4', { class: 'sub-h' }, 'MODULE ĐÃ NẠP'),
      el('div', { class: 'tbl-wrap' }, el('table', {},
        el('tbody', {}, Kernel.modules.map(m => el('tr', {},
          el('td', {}, el('span', { class: 'file-name' }, icon(m.manifest.icon, 15), ' ', el('b', {}, m.manifest.name))),
          el('td', { class: 'mono' }, m.manifest.routes.join(', ')),
          el('td', {}, el('span', { class: 'badge', style: { color: '#7ae582' } }, 'running'))))))),
      el('h4', { class: 'sub-h' }, 'VÙNG DỮ LIỆU'),
      el('div', { class: 'tbl-wrap' }, el('table', {},
        el('tbody', {}, [...Store.zones.values()].map(z => el('tr', {},
          el('td', {}, el('i', { class: 'zdot', style: { background: z.def.color } }), ' ', z.def.label),
          el('td', { class: 'mono' }, fmt.num(z.count)),
          el('td', {}, el('span', { class: 'badge' }, z.def.source))))))));
  },
};
export default M; 
