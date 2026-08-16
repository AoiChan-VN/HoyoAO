import { Store } from '../core/store.js';
import { Engine } from '../core/engine.js';
import { el, icon, fmt, download, confirmDialog, toast } from '../core/ui.js';

// Bảng màu theo loại file — muốn đổi chỉ sửa map này.
const TYPE_COLOR = { pdf:'#ff6b7a', zip:'#ffb454', json:'#7ae582', png:'#b48bf3', jpg:'#b48bf3', svg:'#4cc9f0', md:'#4cc9f0', txt:'#8aa7b1' };
const TYPE_ICON  = { md:'content', txt:'content', png:'media', jpg:'media', svg:'media' };

const M = {
  manifest: { id: 'files', group: 'NỘI DUNG', name: 'Files', icon: 'files', routes: ['files'] },
  state: { q: '', type: 'all' }, body: null,

  mount(root){
    this.body = el('tbody');
    const fileInput = el('input', { type: 'file', multiple: true, style: { display: 'none' },
      onchange: e => this.upload(e.target.files) });
    root.append(el('section', { class: 'panel pad' },
      el('header', { class: 'ctl-row wrap' },
        el('h2', { class: 'display' }, 'Files & Tài nguyên'),
        el('label', { class: 'field search' }, icon('search', 15),
          el('input', { placeholder: 'Tìm file…', oninput: e => { this.state.q = e.target.value; this.render(); } })),
        el('select', { class: 'field sel', onchange: e => { this.state.type = e.target.value; this.render(); } },
          el('option', { value: 'all' }, 'Mọi loại'),
          [...new Set(Store.collections.files.map(f => f.type))].map(t => el('option', { value: t }, '.' + t))),
        el('button', { class: 'btn primary', onclick: () => fileInput.click() }, icon('upload', 15), 'Thêm file')),
      fileInput,
      el('div', { class: 'tbl-wrap' }, el('table', {},
        el('thead', {}, el('tr', {},
          el('th', {}, 'Tên'), el('th', {}, 'Loại'), el('th', {}, 'Dung lượng'),
          el('th', {}, 'Cập nhật'), el('th', {}, 'Nguồn'), el('th', {}, ''))),
        this.body))));
    this.render();
  },

  render(){
    const { q, type } = this.state;
    const list = Store.collections.files.filter(f =>
      (type === 'all' || f.type === type) &&
      (!q || f.name.toLowerCase().includes(q.toLowerCase())));
    this.body.innerHTML = '';
    list.forEach(f => this.body.append(el('tr', {},
      el('td', {}, el('span', { class: 'file-name' },
        icon(TYPE_ICON[f.type] || 'files', 16), ' ', el('b', {}, f.name)))),
      el('td', {}, el('span', { class: 'badge', style: { color: TYPE_COLOR[f.type] || '#8aa7b1' } }, '.' + f.type)),
      el('td', { class: 'mono' }, fmt.bytes(f.sizeKB * 1024)),
      el('td', { class: 'mono' }, fmt.date(f.modified || f.createdAt)),
      el('td', {}, el('span', { class: 'badge' }, f.source || 'local')),
      el('td', { class: 'row-actions' },
        el('button', { class: 'icon-btn', title: 'Tải xuống', onclick: () => {
          download(f.name + '.manifest.txt',
            `HoyoAO WebOS — file manifest\n${JSON.stringify(f, null, 2)}`, 'text/plain');
          Engine.pulse('storage', 4); toast('Đã tạo manifest cho ' + f.name);
        } }, icon('download', 15)),
        el('button', { class: 'icon-btn danger', title: 'Xóa', onclick: () =>
          confirmDialog('Xóa file', `Xóa "${f.name}"?`, () => {
            Store.removeRecord('files', f.id); toast('Đã xóa file'); this.render();
          }) }, icon('trash', 15))))));
  },

  upload(files){
    if (!files?.length) return;
    for (const f of files) {
      const type = (f.name.split('.').pop() || 'bin').toLowerCase();
      Store.addRecord('files', {
        name: f.name, type, sizeKB: Math.max(1, Math.round(f.size / 1024)),
        modified: new Date().toISOString().slice(0, 10), source: 'upload',
      });
    }
    Store.ingest('storage', files.length * 3, { origin: 'upload' });
    Engine.pulse('runtime', 10);
    toast(`Đã thêm ${files.length} file vào vùng Files`);
    this.render();
  },
};
export default M; 
