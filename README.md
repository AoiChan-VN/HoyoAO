<div align="center">

<img
  src="assets/icons/aoi-logo.svg"
  alt="AoiChan Logo"
  width="50"
  style="border-radius:50%;"
/>

# 𝓐𝓸𝓲𝓒𝓱𝓪𝓷︵❤

### ✦ Production VR-XR Platform ✦

</div>

<details>
  <summary><b>【Hướng dẫn】</b></summary>

  ### Các bước thực hiện:
  1. Chạy lệnh `npm install`
  2. Tạo file `.env`
  3. Chạy `npm start` để khởi động dự án.
</details>

<table width="100%">
  <tr>
    <td width="50%">
      <h3>Giao diện「Máy tính」</h3>
      <img src="https://placeholder.com" alt="Desktop View">
    </td>
    <td width="50%">
      <h3>Giao diện「Điện thoại」</h3>
      <img src="https://placeholder.com" alt="Mobile View">
    </td>
  </tr>
</table>

```txt
parallax-cube-world/
│
├── index.html                      # Điểm nhập ứng dụng, kiểm tra User Agent để chuyển hướng/tải mã tương ứng
│
├── assets/                         # Nơi lưu trữ tài nguyên tĩnh (Static Assets)
│   └── skybox/
│       ├── pc/
│       │   ├── near/               # 6 mặt ảnh cho lớp Cube Gần (Nhỏ) trên PC (front, back, left, right, top, bottom)
│       │   ├── medium/             # 6 mặt ảnh cho lớp Cube Vừa trên PC
│       │   └── far/                # 6 mặt ảnh cho lớp Cube Xa (To) trên PC
│       └── mobile/
│           ├── near/               # 6 mặt ảnh tối ưu dung lượng/độ phân giải cho Mobile
│           ├── medium/             # 6 mặt ảnh lớp Vừa cho Mobile
│           └── far/                # 6 mặt ảnh lớp Xa cho Mobile
│
├── css/                            # Tầng quản lý giao diện phân tách theo nền tảng
│   ├── common/                     # CSS dùng chung cho cả PC và Mobile
│   │   ├── reset.css               # Khởi tạo lại CSS mặc định của trình duyệt
│   │   └── variables.css           # Định nghĩa các biến CSS dùng chung
│   ├── pc/                         # CSS đặc thù cho máy tính (Giao diện rộng, hiệu ứng đổ bóng phức tạp)
│   │   ├── viewport.css            # Khởi tạo không gian Perspective 3D diện rộng cho PC
│   │   ├── layers.css              # Ma trận 3D cho 3 tầng Cube trên PC
│   │   ├── cube-face.css           # Khai báo background ảnh từ assets/skybox/pc/
│   │   └── main.css                # File tổng hợp CSS dành riêng cho PC
│   └── mobile/                     # CSS đặc thù cho điện thoại (Tối ưu màn hình dọc, GPU Mobile)
│       ├── viewport.css            # Khởi tạo không gian Perspective 3D dọc cho Mobile
│       ├── layers.css              # Ma trận 3D tinh chỉnh khoảng cách cho Mobile
│       ├── cube-face.css           # Khai báo background ảnh từ assets/skybox/mobile/
│       └── main.css                # File tổng hợp CSS dành riêng cho Mobile
│
└── js/                             # Tầng xử lý logic mã nguồn tách biệt
    ├── common/                     # Logic dùng chung
    │   ├── constants.js            # Các hằng số toán học hệ thống
    │   ├── state.js                # Quản lý trạng thái tọa độ và góc xoay mục tiêu
    │   └── loop.js                 # Vòng lặp đồ họa chung bằng requestAnimationFrame
    ├── pc/                         # Logic xử lý điều khiển dành riêng cho PC
    │   ├── config.js               # Cấu hình tham số Parallax, độ nhạy chuột, tốc độ cuộn cho PC
    │   ├── input-mouse.js          # Lắng nghe sự kiện di chuyển chuột (Mousemove)
    │   ├── input-scroll.js         # Lắng nghe sự kiện cuộn trang (Wheel/Scroll)
    │   ├── transformer.js          # Tính toán ma trận CSS Transform cho PC dựa trên chuột/cuộn
    │   ├── dom-updater.js          # Thực thi cập nhật thuộc tính CSS vào DOM cho PC
    │   └── app.js                  # Điểm khởi chạy (Bootstrapper) hệ thống trên PC
    └── mobile/                     # Logic xử lý điều khiển dành riêng cho Mobile
        ├── config.js               # Cấu hình tham số Parallax, độ nhạy cảm ứng, Gyroscope cho Mobile
        ├── input-touch.js          # Lắng nghe sự kiện vuốt chạm (Touchmove) thay cho chuột
        ├── input-gyro.js           # Lắng nghe cảm biến gia tốc/góc nghiêng thiết bị (DeviceOrientation)
        ├── transformer.js          # Tính toán ma trận CSS Transform tối ưu cho chip xử lý Mobile
        ├── dom-updater.js          # Thực thi cập nhật thuộc tính CSS vào DOM cho Mobile
        └── app.js                  # Điểm khởi chạy (Bootstrapper) hệ thống trên Mobile
```
