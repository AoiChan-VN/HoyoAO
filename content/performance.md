# Tối ưu hóa hiệu năng bằng Web Standards

Hiệu năng tối đa không đến từ việc cấu hình các trình biên dịch phức tạp, mà đến từ việc viết mã nguồn tương thích tự nhiên với trình duyệt.

## 1. Tận dụng sức mạnh phần cứng (Hardware Acceleration)
Hệ thống đồ họa phối cảnh 3D của dự án áp dụng trực tiếp thuộc tính `translate3d(x, y, 0)`. Biện pháp này ép buộc trình duyệt:
* Bỏ qua quá trình tính toán lại layout (Reflow) trên CPU.
* Chuyển trực tiếp các lớp hình ảnh (Layers) vào bộ nhớ VRAM của GPU.
* Kết xuất đồ họa với tần số quét tối đa của màn hình (60Hz - 120Hz).

## 2. Giải phóng bộ nhớ thông minh
Theo đúng các nguyên tắc lập trình hệ thống, bộ điều khiển trung tâm áp dụng cơ chế giải phóng sự kiện dứt điểm:
> "Khi người dùng tắt hoặc chuyển đổi các tính năng phần cứng (như cảm biến hướng Gyroscope), toàn bộ các bộ lắng nghe sự kiện (`Event Listeners`) sẽ được giải phóng lập tức để triệt tiêu rủi ro rò rỉ bộ nhớ (Memory Leak)."

## 3. Không nợ kỹ thuật bằng Native ESM
Việc sử dụng các thẻ `<script type="module">` giúp trình duyệt tự động tải bất đồng bộ (`async`) các cấu phần giao diện khi và chỉ khi trang web yêu cầu, giảm dung lượng tải ban đầu xuống mức tối thiểu.
 
