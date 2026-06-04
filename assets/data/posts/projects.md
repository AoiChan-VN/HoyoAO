# Danh Sách Dự Án Tiêu Biểu

Dưới đây là các hệ thống phần mềm và giải pháp kiến trúc đồ họa được nghiên cứu, tối ưu hóa và triển khai thực tế.

## 1. WebGL2 Core 3D Engine

Hệ thống kết xuất đồ họa không gian ba chiều sử dụng thuần **Native WebGL2 API** trên nền tảng trình duyệt, đạt hiệu năng tối đa 120 FPS trên thiết bị di động.

*   **Tính năng:** Nạp Texture 360 độ, xử lý ma trận chuyển động 3D, tích hợp Gyroscope.
*   **Công nghệ:** Vanilla JavaScript, GLSL WebGL Shaders, ES6 Modules.

```javascript
// Khối mã kiểm tra ma trận góc xoay Camera
const viewMatrix = new Float32Array(16);
const projectionMatrix = new Float32Array(16);
console.log("WebGL2 Engine initialized successfully.");
```

---

## 2. PWA Offline Core Framework

Kiến trúc framework tối giản tự quản lý dữ liệu lưu trữ dưới thiết bị người dùng, hỗ trợ ứng dụng hoạt động mượt mà ngay cả khi ngắt kết nối mạng hoàn toàn.

### Bảng So Sánh Công Nghệ Lưu Trữ


| Tiêu chí | LocalStorage | IndexedDB |
| :--- | :--- | :--- |
| **Kiểu dữ liệu** | String (Chuỗi tuần tự) | Cấu trúc đối tượng phức tạp |
| **Dung lượng** | Giới hạn nhỏ (~5MB) | Phụ thuộc bộ nhớ máy (>250MB) |
| **Cơ chế xử lý** | Đồng bộ (Blocking) | Bất đồng bộ (Non-blocking) |
| **Mục đích** | Lưu cấu hình hiển thị UI | Cache bài viết MD, Asset ảnh |

---

## 3. Secure Markdown Compiler

Bộ biên dịch mã nguồn Markdown sang phần tử HTML dạng cây DOM trực tiếp (DOM Renderer) tích hợp sẵn module lọc mã độc (XSS Sanitize Filter). Chặn đứng mọi hành vi tấn công chèn mã Script (XSS Injection), đảm bảo an toàn tuyệt đối cho ứng dụng Client-side.
 
