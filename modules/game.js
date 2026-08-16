import { Store } from '../core/store.js';
import { el, fmt, toast } from '../core/ui.js';

const M = {
  manifest: { id: 'game', name: 'Game', icon: 'spark', routes: ['game'], group: 'MỞ RỘNG' },
  mount(root){
    this.rounds = []; this.state = 'idle';
    this.pad = el('div', { class: 'game-pad', onclick: () => this.click() }, 'CHẠM ĐỂ BẮT ĐẦU');
    this.roundLbl = el('span', { class: 'mono' }, 'Lượt 0/5');
    this.board = el('tbody');
    root.append(
      el('section', { class: 'panel pad' },
        el('h2', { class: 'display', style: { fontSize: '20px', marginBottom: '10px' } }, 'Reaction Test'),
        el('p', { class: 'hint' }, '5 lượt · chờ pad chuyển XANH rồi chạm · điểm = ms trung bình. Kết quả THẬT, lưu bền.'),
        this.pad,
        el('div', { class: 'chips', style: { marginTop: '14px' } }, this.roundLbl)),
      el('section', { class: 'panel pad' },
        el('h3', { class: 'sec-title' }, 'BẢNG XẾP HẠNG'),
        el('div', { class: 'tbl-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Điểm'), el('th', {}, 'Ngày'))),
          this.board))));
    this.renderBoard();
  },
  unmount(){ clearTimeout(this.to); },
  arm(){
    this.state = 'wait'; this.pad.className = 'game-pad wait'; this.pad.textContent = 'CHỜ…';
    this.to = setTimeout(() => {
      this.state = 'go'; this.t0 = performance.now();
      this.pad.className = 'game-pad go'; this.pad.textContent = 'CHẠM!';
    }, 1200 + Math.random() * 2200);
  },
  click(){
    if (this.state === 'idle' || this.state === 'done') { this.rounds = []; this.arm(); this.upd(); return; }
    if (this.state === 'wait') {
      clearTimeout(this.to); this.state = 'idle';
      this.pad.className = 'game-pad'; this.pad.textContent = 'QUÁ SỚM — chạm để thử lại'; return;
    }
    const ms = Math.round(performance.now() - this.t0);
    this.rounds.push(ms);
    if (this.rounds.length >= 5) {
      const avg = Math.round(this.rounds.reduce((a, b) => a + b, 0) / 5);
      Store.addRecord('scores', { ms: avg });
      this.state = 'done'; this.pad.className = 'game-pad';
      this.pad.textContent = `${avg} ms — chạm để chơi lại`;
      toast(`Phản xạ trung bình: ${avg} ms`); this.renderBoard();
    } else {
      this.pad.textContent = `${ms} ms · chờ…`; this.arm();
    }
    this.upd();
  },
  upd(){ this.roundLbl.textContent = `Lượt ${this.rounds.length}/5` + (this.rounds.length ? ` · gần nhất ${this.rounds.at(-1)} ms` : ''); },
  renderBoard(){
    const list = [...(Store.collections.scores || [])].sort((a, b) => a.ms - b.ms).slice(0, 8);
    this.board.innerHTML = '';
    list.forEach((s, i) => this.board.append(el('tr', {},
      el('td', { class: 'mono' }, i + 1),
      el('td', { class: 'mono' }, s.ms + ' ms'),
      el('td', { class: 'mono' }, fmt.date(s.createdAt)))));
  },
};
export default M; 
