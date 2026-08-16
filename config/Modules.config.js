// ═══════════════════════════════════════════════════════════════
// OS sẽ tự nạp + khởi chạy mọi module trong danh sách này.
// MỞ RỘNG: tạo file trong /modules rồi thêm 1 dòng bên dưới.
// Nhân (core/) không bao giờ phải sửa.
// ═══════════════════════════════════════════════════════════════
export const MODULES = [
  { id: 'dashboard', path: 'modules/dashboard.js', enabled: true },
  { id: 'analytics', path: 'modules/analytics.js', enabled: true },
  { id: 'content',   path: 'modules/content.js',   enabled: true },
  { id: 'media',     path: 'modules/media.js',     enabled: true },
  { id: 'files',     path: 'modules/files.js',     enabled: true },
  { id: 'settings',  path: 'modules/settings.js',  enabled: true },
]; 
