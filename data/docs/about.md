# Về HoyoAO

HoyoAO là một **Web 3D Environment** chạy hoàn toàn trên GitHub Pages — không cần backend, không cần build step, toàn bộ UI được khởi tạo từ các module ES thuần.

## Mục tiêu

- Xây dựng nền tảng web **sạch, modular, extensible** theo kiến trúc phân tầng.
- Môi trường 3D là module độc lập, có lifecycle riêng, không phá UI.
- Sẵn sàng chuyển sang **API / Backend / Database** trong tương lai mà không phải phá bỏ frontend hiện tại.

## Chủ sở hữu

- **Owner**: AoiChan-VN
- **Repository**: [github.com/AoiChan-VN/HoyoAO](https://github.com/AoiChan-VN/HoyoAO)
- **Website**: [aoichan-vn.github.io/HoyoAO](https://aoichan-vn.github.io/HoyoAO/)

## Kiến trúc phân tầng

1. *UI Layer* — shell, layout, component hiển thị.
2. *Presentation Layer* — CSS module theo token (`Clr_tok`, `Rps_*`, `Pnl`, `Mdl`, `Dsd`, `Crd`, `Nav`, `HF`).
3. *Application / Feature Layer* — các feature tự đăng ký qua registry: `home`, `dashboard`, `pages`, `menu`, `search`, `account`, `settings`.
4. *Data / State Layer* — store tập trung, event bus, data provider abstraction.
5. *Infrastructure Layer* — storage, responsive, charts, environment 3D.

Nguyên tắc cốt lõi:

- `index.html` **chỉ là shell**, không chứa business logic.
- Không hard-code dữ liệu vào UI — mọi thứ đọc từ `data/*.json` và `data/docs/*.md`.
- Component giao tiếp qua **event / state / service**, không truy cập DOM nội bộ của nhau.
- Thêm feature mới: *Add → Register → Application nhận → UI tự render*.

## Công nghệ

- **ES Modules** thuần, không framework, không bundler.
- **Canvas 2D** cho hệ thống biểu đồ (cột / sóng / đường) kiểu dashboard chứng khoán.
- **WebGL** cho môi trường 3D (tách hoàn toàn khỏi UI system).
- **CSS Custom Properties** làm design token: màu, spacing, radius, z-index, breakpoint.

## Các khu vực chính

- **Dashboard** — trang đích với biểu đồ tổng thể theo từng *ổ đĩa dữ liệu* (ổ Web, ổ người dùng...).
- **Trang chủ** — thông tin cơ bản về HoyoAO.
- **Thế giới** — môi trường 3D thời gian thực.
- **Bộ sưu tập** — thư viện nội dung, media.
- **Giới thiệu** — tài liệu bạn đang đọc.

## Trạng thái hiện tại

> Hệ thống hiện **chưa có authentication**. Account panel là UI shell để kiểm tra interaction, responsive và kiến trúc — không có login giả, không có token giả.

- Cài đặt người dùng (ngôn ngữ, theme, tên hiển thị...) lưu qua **storage service**.
- Dữ liệu biểu đồ nằm tại `data/drives.json`, có thể cập nhật hằng ngày hoặc nối API sau này.
- Tài liệu giới thiệu nằm tại `data/docs/*.md`, hiển thị qua card và modal chi tiết.

## Định hướng phát triển

1. Hệ thống **Account / authentication** thật.
2. **Ổ người dùng**: đồng bộ repository, stars, thông tin tài khoản.
3. **ApiDataProvider** thay thế LocalDataProvider mà không sửa UI.
4. Mở rộng scene 3D, nội dung và bộ sưu tập.

---

*Tài liệu này được nạp động từ `data/docs/about.md` — chỉnh sửa file để cập nhật nội dung, không cần đụng vào code.* 
