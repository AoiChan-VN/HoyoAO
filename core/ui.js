import { Kernel } from './kernel.js';

// Bộ công cụ UI dùng chung cho mọi module.
export function el(tag, attrs = {}, ...kids){
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'value' || k === 'checked' || k === 'disabled') n[k] = v;
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return n;
}

export function icon(name, size = 18){
  const s = el('svg', { viewBox:'0 0 24 24', width:size, height:size, fill:'none',
    stroke:'currentColor', 'stroke-width':1.8, 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true' });
  s.innerHTML = Kernel.icons[name] || '';
  return s;
}

export function openModal({ title, icon: ic = 'hex', body, footer, wide = false }){
  const layer = document.getElementById('modalLayer');
  const close = () => { layer.innerHTML = ''; document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  const bodyEl = el('div', { class: 'm-body' });
  const panel = el('div', { class: 'modal' + (wide ? ' wide' : '') },
    el('header', { class: 'm-head' },
      el('div', { class: 'm-title' }, icon(ic, 18), el('h3', { class: 'display' }, title)),
      el('button', { class: 'icon-btn', onclick: close, 'aria-label': 'Đóng' }, icon('close', 16))),
    bodyEl,
    footer ? el('footer', { class: 'm-foot' }, footer) : null);
  const ov = el('div', { class: 'overlay', onclick: e => { if (e.target === ov) close(); } }, panel);
  layer.append(ov);
  if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.append(body);
  return { close, panel };
}

export function confirmDialog(title, msg, onYes, danger = true){
  const { close } = openModal({
    title, icon: 'shield',
    body: el('p', { class: 'confirm-msg' }, msg),
    footer: [
      el('button', { class: 'btn', onclick: () => close() }, 'Hủy'),
      el('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => { close(); onYes(); } }, 'Xác nhận'),
    ],
  });
}

export function toast(msg, type = 'ok'){
  const t = el('div', { class: 'toast ' + type }, icon(type === 'err' ? 'close' : 'check', 14), el('span', {}, msg));
  document.getElementById('toastLayer').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
}

export function download(filename, text, mime = 'application/json'){
  const blob = new Blob([text], { type: mime });
  const a = el('a', { href: URL.createObjectURL(blob), download: filename });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const fmt = {
  num: (n, d = 0) => (+n || 0).toLocaleString('vi-VN', { maximumFractionDigits: d }),
  compact(n){ n = +n || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n)); },
  bytes(b){ if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
    if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
    if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB'; return b + ' B'; },
  val(n){ return n < 100 ? n.toFixed(1) : fmt.num(Math.round(n)); },
  time: t => new Date(t).toLocaleTimeString('vi-VN', { hour12: false }),
  date: t => new Date(t).toLocaleDateString('vi-VN'),
  dayDate(t){
    const d = new Date(t);
    const days = ['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    return `${days[d.getDay()]} · ${fmt.date(t)}`; },
  ago(t){
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'vừa xong'; if (s < 3600) return Math.floor(s / 60) + ' phút trước';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
    return Math.floor(s / 86400) + ' ngày trước'; },
  uptime(ms){
    const s = Math.floor(ms / 1000);
    const p = x => String(x).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`; },
}; 
