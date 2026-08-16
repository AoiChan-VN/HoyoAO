# HoyoAO Web Admin — Web vận hành như OS

## Chạy
ES Modules cần HTTP server (không mở trực tiếp file://):
  npx serve .          hoặc      python -m http.server 8080
Mở http://localhost:8080 (hoặc Live Server trong VS Code).

## Mở rộng (không đụng nhân)
1. Thêm "ứng dụng": tạo modules/xxx.js (export default { manifest, mount, unmount })
   → thêm 1 dòng vào config/modules.config.js. OS tự nạp, tự thêm menu + route.
2. Thêm vùng dữ liệu: khai báo trong data/zones.js → Dashboard/Analytics tự nhận.
3. Đổi Logo/Icon/Avatar: Settings → Nhận diện, hoặc sửa config/app.config.js.
4. Thay nội dung: sửa data/*.seed.js hoặc Settings → Nhập backup.

## Tương thích offline / app độc lập
Toàn bộ Vanilla JS + localStorage, không framework, không build bắt buộc.
Muốn thành browser/app offline: nhúng nguyên thư mục vào WebView/Electron/Tauri — shell giữ nguyên.
