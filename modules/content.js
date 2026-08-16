import { Kernel } from '../core/kernel.js';
import { Store } from '../core/store.js';
import { Engine } from '../core/engine.js';
import { el, icon, fmt, openModal, toast } from '../core/ui.js';

// ══════ Trang content: danh sách bài viết chuẩn web chuyên content ══════
const M = {
  manifest: { id: 'content', group: 'NỘI DUNG', name: 'Content', icon: 'content', routes: ['content'] },
  state: { q: '', cat: 'all', sort: 'new' }, grid: null, countLbl: null,

  mount(root){
    this.grid = el('div', { class: 'post-grid' });
    this.countLbl = el('span', { class: 'count-lbl mono' }, '');
    root.append(
      el('section', { class: 'panel pad' },
        el('header', { class: 'ctl-row wrap' },
          el('h2', { class: 'display' }, 'Bài viết'),
          el('label', { class: 'field search' }, icon('search', 15),
            el('input', { placeholder: 'Tìm tiêu đề, thẻ…', oninput: e => { this.state.q = e.target.value; this.render(); } })),
          el('select', { class: 'field sel', onchange: e => { this.state.sort = e.target.value; this.render(); } },
            el('option', { value: 'new' }, 'Mới nhất'),
            el('option', { value: 'views' }, 'Xem nhiều'),
            el('option', { value: 'title' }, 'A → Z')),
          el('button', { class: 'btn primary', onclick: () => this.composer() }, icon('plus', 15), 'Bài viết'),
          this.countLbl),
        el('div', { class: 'chips', id: 'catChips' })),
      this.grid);
    this.renderChips(); this.render();
  },

  items(){ return Store.collections.content; },

  renderChips(){
    const cats = ['all', ...new Set(this.items().map(p => p.category))];
    const wrap = document.getElementById('catChips'); wrap.innerHTML = '';
    cats.forEach(c => wrap.append(el('button', {
      class: 'chip' + (c === this.state.cat ? ' on' : ''),
      onclick: e => { this.state.cat = c; this.renderChips(); this.render(); },
    }, c === 'all' ? 'Tất cả' : c)));
  },

  render(){
    const { q, cat, sort } = this.state;
    let list = this.items().filter(p =>
      (cat === 'all' || p.category === cat) &&
      (!q || (p.title + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q.toLowerCase())));
    if (sort === 'views') list = [...list].sort((a, b) => b.views - a.views);
    if (sort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    this.countLbl.textContent = list.length + ' bài';
    this.grid.innerHTML = '';
    list.forEach(p => this.grid.append(this.card(p)));
  },

  card(p){
    return el('article', { class: 'post-card', onclick: () => this.openPost(p) },
      el('div', { class: 'post-cover', style: {
        background: `linear-gradient(135deg, hsl(${p.hue} 70% 46%), hsl(${(p.hue + 42) % 360} 68% 30%))` } },
        el('span', { class: 'cover-letter display' }, p.title[0]),
        el('span', { class: 'badge solid' }, p.category)),
      el('div', { class: 'post-body' },
        el('h3', {}, p.title),
        el('p', {}, p.excerpt),
        el('div', { class: 'post-meta' },
          el('span', { class: 'author' }, el('i', { style: { background: `hsl(${p.hue} 60% 55%)` } }), p.author),
          el('span', { class: 'mono' }, fmt.date(p.date || p.createdAt)),
          el('span', { class: 'mono' }, icon('clock', 12), ' ', fmt.compact(p.views || 0))),
        el('button', { class: 'fav-btn' + (p.fav ? ' on' : ''), onclick: e => {
          e.stopPropagation();
          Store.mutateRecord('content', p.id, { fav: !p.fav });
          Engine.pulse('content', 4); this.render();
        } }, icon('heart', 15))));
  },

  openPost(p){
    Store.mutateRecord('content', p.id, { views: (p.views || 0) + 1 });
    Store.ingest('content', 4, { origin: 'reader' });   // lượt đọc = dữ liệu thật đổ vào
    openModal({
      title: p.title, icon: 'content', wide: true,
      body: el('div', {},
        el('div', { class: 'post-meta big' },
          el('span', {}, '✍ ' + p.author), el('span', { class: 'mono' }, fmt.date(p.date || p.createdAt)),
          el('span', { class: 'badge' }, p.category)),
        (p.body || []).map(par => el('p', { class: 'prose' }, par)),
        el('div', { class: 'chips' }, (p.tags || []).map(t => el('span', { class: 'chip' }, '#' + t)))),
    });
    this.render();
  },

  composer(){
    const cats = [...new Set(this.items().map(p => p.category))];
    const fTitle = el('input', { class: 'field', placeholder: 'Tiêu đề bài viết' });
    const fCat = el('input', { class: 'field', placeholder: 'Chuyên mục (mặc định: ' + (cats[0] || 'Tin tức') + ')' , list: 'catlist' });
    const fAuthor = el('input', { class: 'field', placeholder: 'Tác giả', value: Kernel.meta.name });
    const fTags = el('input', { class: 'field', placeholder: 'Thẻ, cách nhau dấu phẩy' });
    const fBody = el('textarea', { class: 'field area', rows: 6, placeholder: 'Nội dung… (mỗi dòng trống tách đoạn)' });
    openModal({
      title: 'Soạn bài viết', icon: 'plus', wide: true,
      body: el('div', { class: 'form-grid' },
        el('datalist', { id: 'catlist' }, cats.map(c => el('option', { value: c }))),
        fTitle, fCat, fAuthor, fTags, fBody),
      footer: [
        el('button', { class: 'btn', onclick: e => e.target.closest('.overlay').querySelector('.icon-btn').click() }, 'Hủy'),
        el('button', { class: 'btn primary', onclick: () => {
          if (!fTitle.value.trim() || !fBody.value.trim()) return toast('Cần tiêu đề và nội dung', 'err');
          const body = fBody.value.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
          Store.addRecord('content', {
            title: fTitle.value.trim(), category: fCat.value.trim() || cats[0] || 'Tin tức',
            author: fAuthor.value.trim() || Kernel.meta.name,
            excerpt: body[0].slice(0, 130) + '…', body,
            tags: fTags.value.split(',').map(s => s.trim()).filter(Boolean),
            hue: Math.floor(Math.random() * 360), views: 0,
            date: new Date().toISOString().slice(0, 10),
          });
          Store.ingest('content', 8, { origin: 'user' }); Engine.pulse('runtime', 14);
          document.querySelector('.overlay .icon-btn').click();
          toast('Đã đăng bài — dữ liệu vào vùng Content');
          this.renderChips(); this.render();
        } }, icon('check', 14), 'Đăng bài'),
      ],
    });
  },
};
export default M; 
