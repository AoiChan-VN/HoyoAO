import { Store } from '../core/store.js';
import { Engine } from '../core/engine.js';
import { el, icon, fmt, openModal, confirmDialog, toast } from '../core/ui.js';

// Sinh cover SVG theo dữ liệu (hue/pattern) — không cần file ảnh, không hardcode asset.
function cover(item, w = 480, h = 340){
  const hue = item.hue ?? 200; let art = '';
  if (item.pattern === 'rings')
    for (let i = 6; i > 0; i--)
      art += `<circle cx='${w*0.68}' cy='${h*0.42}' r='${i*26}' fill='none' stroke='hsl(${hue} 80% ${45+i*6}%)' stroke-opacity='.${9-i}' stroke-width='2'/>`;
  if (item.pattern === 'waves')
    for (let k = 0; k < 5; k++) {
      let d = `M0 ${h*0.5 + k*22}`;
      for (let x = 0; x < w; x += 40) d += ` Q ${x+20} ${h*0.5 + k*22 + (k%2 ? 18 : -18)} ${x+40} ${h*0.5 + k*22}`;
      art += `<path d='${d}' stroke='hsl(${hue} 85% ${60-k*7}%)' fill='none' stroke-opacity='.${8-k}' stroke-width='2.5'/>`;
    }
  if (item.pattern === 'peaks') {
    let d = `M0 ${h}`;
    for (let i = 0; i <= 8; i++)
      d += ` L ${w*i/8} ${h - (i%2 ? h*0.55 : h*0.25) * (0.5 + ((hue + i*13) % 10)/14)}`;
    art += `<path d='${d} L ${w} ${h} Z' fill='hsl(${hue} 60% 30% / .55)'/><path d='${d}' stroke='hsl(${hue} 90% 66%)' fill='none' stroke-width='2.5'/>`;
  }
  if (item.pattern === 'grid')
    for (let x = 20; x < w; x += 34) for (let y = 20; y < h; y += 34)
      art += `<circle cx='${x}' cy='${y}' r='${(x+y)%3 ? 1.6 : 2.6}' fill='hsl(${hue} 85% 62%)' fill-opacity='.5'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='hsl(${hue} 45% 14%)'/><stop offset='1' stop-color='hsl(${hue+30} 50% 9%)'/></linearGradient></defs>
    <rect width='${w}' height='${h}' fill='url(#g)'/>${art}
    <text x='20' y='${h-18}' font-family='monospace' font-size='13' fill='hsl(${hue} 30% 78%)' fill-opacity='.8'>${item.title}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const M = {
  manifest: { id: 'media', name: 'Media', icon: 'media', routes: ['media'] },
  state: { kind: 'all' }, grid: null,

  mount(root){
    this.grid = el('div', { class: 'media-grid' });
    this.chips = el('div', { class: 'chips' });
    const fileInput = el('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' },
      onchange: e => this.upload(e.target.files) });
    root.append(
      el('section', { class: 'panel pad' },
        el('header', { class: 'ctl-row wrap' },
          el('h2', { class: 'display' }, 'Media'),
          this.chips,
          el('button', { class: 'btn primary', onclick: () => fileInput.click() }, icon('upload', 15), 'Tải lên')),
        fileInput),
      this.grid);
    this.renderChips(); this.render();
  },

  kinds(){ return ['all', ...new Set(Store.collections.media.map(m => m.kind))]; },
  renderChips(){
    this.chips.innerHTML = '';
    this.kinds().forEach(k => this.chips.append(el('button', {
      class: 'chip' + (k === this.state.kind ? ' on' : ''),
      onclick: () => { this.state.kind = k; this.renderChips(); this.render(); },
    }, k === 'all' ? 'Tất cả' : k)));
  },
  render(){
    const list = Store.collections.media.filter(m => this.state.kind === 'all' || m.kind === this.state.kind);
    this.grid.innerHTML = '';
    list.forEach(m => this.grid.append(
      el('figure', { class: 'media-card', onclick: () => this.lightbox(m) },
        el('img', { src: cover(m), alt: m.title, loading: 'lazy' }),
        el('figcaption', {},
          el('b', {}, m.title),
          el('span', { class: 'mono' }, m.kind + ' · ' + fmt.bytes(m.sizeKB * 1024)),
          m.fav ? icon('heart', 13) : null))));
  },

  lightbox(m){
    const { close } = openModal({
      title: m.title, icon: 'media', wide: true,
      body: el('div', { class: 'lightbox' },
        el('img', { src: cover(m, 880, 560), alt: m.title }),
        el('div', { class: 'post-meta big' },
          el('span', { class: 'badge' }, m.kind),
          el('span', { class: 'mono' }, fmt.bytes(m.sizeKB * 1024)),
          el('span', { class: 'mono' }, fmt.date(m.date || m.createdAt)),
          el('span', {}, (m.tags || []).map(t => '#' + t).join(' ')))),
      footer: [
        el('button', { class: 'btn', onclick: () => {
          Store.mutateRecord('media', m.id, { fav: !m.fav }); close(); this.render();
        } }, icon('heart', 14), m.fav ? 'Bỏ thích' : 'Yêu thích'),
        el('button', { class: 'btn danger', onclick: () => {
          close();
          confirmDialog('Xóa asset', `Xóa "${m.title}" khỏi vùng Media?`, () => {
            Store.removeRecord('media', m.id); toast('Đã xóa asset'); this.render();
          });
        } }, icon('trash', 14), 'Xóa'),
      ],
    });
  },

  upload(files){
    if (!files?.length) return;
    const patterns = ['waves', 'rings', 'grid', 'peaks'];
    for (const f of files) {
      Store.addRecord('media', {
        title: f.name.replace(/\.[^.]+$/, ''), kind: 'Upload',
        hue: Math.floor(Math.random() * 360), pattern: patterns[Math.floor(Math.random() * 4)],
        sizeKB: Math.max(1, Math.round(f.size / 1024)), date: new Date().toISOString().slice(0, 10), tags: ['upload'],
      });
    }
    Store.ingest('media', files.length * 5, { origin: 'upload' });
    Engine.pulse('runtime', 10);
    toast(`Đã thêm ${files.length} asset vào vùng Media`);
    this.renderChips(); this.render();
  },
};
export default M; 
