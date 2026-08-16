// ═══════════════════════════════════════════════════════════════
// NGUỒN DUY NHẤT về nhận diện. Sửa ở đây → toàn OS cập nhật.
// KHÔNG cần tìm từng dòng code. Settings cũng ghi đè vào đây.
// ═══════════════════════════════════════════════════════════════
export const APP = {
  name: 'HoyoAO',
  product: 'Web Admin',
  codename: 'Aurora OS',
  version: '1.0.0',
  tagline: 'Dữ liệu đổ vào — trật tự hiện ra.',
  copyright: '© 2026 HoyoAO',
  logo:   { icon: 'hex', text: 'HoyoAO' },      // icon: bất kỳ key nào trong ICONS
  avatar: { kind: 'letter', value: 'H' },        // kind: 'letter' | 'image' (+ src)
  accent: '#4cc9f0',
  links: { support: '#support', community: '#community' },
};

export const ICONS = {
  hex:      `<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>`,
  dashboard:`<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z"/>`,
  analytics:`<path d="M5 20v-6M10 20V8M15 20v-9M20 20V5M3 20h18"/>`,
  content:  `<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>`,
  media:    `<path d="M4 5h16v14H4zM4 15l4-4 3 3 5-5 4 4"/><circle cx="9" cy="9.5" r="1.4"/>`,
  files:    `<path d="M3 6h6l2 2h10v11H3z"/>`,
  settings: `<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>`,
  search:   `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>`,
  close:    `<path d="M6 6l12 12M18 6L6 18"/>`,
  check:    `<path d="M5 12l5 5 9-10"/>`,
  upload:   `<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>`,
  download: `<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>`,
  trash:    `<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>`,
  heart:    `<path d="M12 20s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7C9.5 4 11 5.5 12 7c1-1.5 2.5-3 4.5-3C20 4 22.5 7.5 21 11c-2 4.5-9 9-9 9z"/>`,
  clock:    `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  plus:     `<path d="M12 5v14M5 12h14"/>`,
  chevron:  `<path d="M9 6l6 6-6 6"/>`,
  user:     `<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/>`,
  pulse:    `<path d="M2 12h4l2-6 4 12 3-8 2 2h5"/>`,
  db:       `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>`,
  shield:   `<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>`,
  spark:    `<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/>`,
}; 
