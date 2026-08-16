// Mỗi vùng = 1 lane trên visualization + 1 card + 1 modal chi tiết.
// Thêm vùng mới tại đây → Dashboard TỰ nhận biết, không sửa code.
export const ZONES = [
  { id: 'runtime', label: 'Runtime', unit: 'ops',   visual: 'poly',    pattern: 'burst',  color: '#4cc9f0', source: 'realtime',   base: 34,
    desc: 'Luồng sự kiện thực thi của kernel: điều hướng, thao tác người dùng, vòng lặp engine. Sinh ra trong phiên chạy, không ghi đĩa.',
    schema: 't: thời điểm (ms) · v: cường độ ops · origin: engine | user' },
  { id: 'local',   label: 'Local',   unit: 'rec',   visual: 'columns', pattern: 'steady', color: '#ffb454', source: 'local',      base: 30,
    desc: 'Bản ghi bền vững trong localStorage: bài viết, media, file, thiết lập. Sống sót sau khi tải lại trang và được đồng bộ vào visualization.',
    schema: 't: thời điểm (ms) · v: bản ghi · origin: user | seed' },
  { id: 'content', label: 'Content', unit: 'items', visual: 'wave',    pattern: 'pulse',  color: '#ff6b8b', source: 'local',      base: 22,
    desc: 'Dữ liệu nội dung: bài viết, chuyên mục, lượt đọc. Dao động tăng khi có bài mới hoặc có người mở bài.',
    schema: 't: thời điểm (ms) · v: item/lượt · origin: user | reader' },
  { id: 'media',   label: 'Media',   unit: 'assets',visual: 'threads', pattern: 'tidal',  color: '#b48bf3', source: 'local',      base: 18,
    desc: 'Tài nguyên trực quan: ảnh nền, texture, render, asset upload. Mỗi upload đẩy một nhịp vào luồng này.',
    schema: 't: thời điểm (ms) · v: asset · origin: user | seed' },
  { id: 'storage', label: 'Storage', unit: 'KB',    visual: 'area',    pattern: 'drift',  color: '#7ae582', source: 'historical', base: 20,
    desc: 'Dung lượng lưu trữ thực tế của toàn bộ dữ liệu (đo trực tiếp từ localStorage). Tăng khi có bản ghi mới, giảm khi dọn dữ liệu.',
    schema: 't: thời điểm (ms) · v: KB · origin: persist' },
]; 
