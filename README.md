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
├── index.html                      # Điểm nhập ứng dụng, điều hướng luồng tải CSS/JS theo thiết bị
│
├── assets/                         # Thư mục chứa ảnh cục bộ (Đồng bộ cho cả PC và Mobile)
│   └── skybox/
│       ├── near/                   # Tầng GẦN: Chứa các vật thể như cây cối, chi tiết tiền cảnh (Hỗ trợ PNG trong suốt, WEBP)
│       │   ├── front.png
│       │   ├── back.png
│       │   ├── left.png
│       │   ├── right.png
│       │   ├── top.png
│       │   └── bottom.png
│       ├── medium/                 # Tầng VỪA: Chứa cảnh quan tầm trung (Hỗ trợ JPEG, WEBP)
│       │   ├── front.webp
│       │   ├── back.webp
│       │   ├── left.webp
│       │   ├── right.webp
│       │   ├── top.webp
│       │   └── bottom.webp
│       └── far/                    # Tầng XA/SIÊU XA: Chứa bầu trời, mây dải ngân hà (Hỗ trợ HDRI, JPEG kích thước lớn)
│           ├── front.hdr
│           ├── back.hdr
│           ├── left.hdr
│           ├── right.hdr
│           ├── top.hdr
│           └── bottom.hdr
│
├── css/                            # Tầng giao diện - TÁCH BIỆT HOÀN TOÀN FILE
│   ├── pc/                         # CSS chuyên biệt cho PC (Xử lý không gian rộng, hiệu ứng desktop)
│   │   ├── reset.css
│   │   ├── variables.css           # Cấu hình tiêu cự phối cảnh (Perspective) cho màn hình ngang
│   │   ├── viewport.css
│   │   ├── layers.css              # Quản lý tỷ lệ khoảng cách 3 lớp Cube trên PC
│   │   ├── cube-face.css           # Đổ map ảnh tương ứng (PNG/JPEG/HDRI) lên các mặt Cube PC
│   │   └── main.css                # File tổng hợp CSS của PC
│   └── mobile/                     # CSS chuyên biệt cho Mobile (Tối ưu màn hình dọc, GPU di động)
│       ├── reset.css
│       ├── variables.css           # Cấu hình tiêu cự phối cảnh (Perspective) cho màn hình dọc
│       ├── viewport.css
│       ├── layers.css              # Quản lý tỷ lệ khoảng cách 3 lớp Cube trên Mobile
│       ├── cube-face.css           # Đổ map ảnh tương ứng (PNG/JPEG/HDRI) lên các mặt Cube Mobile
│       └── main.css                # File tổng hợp CSS của Mobile
│
└── js/                             # Logic xử lý - TÁCH BIỆT HOÀN TOÀN FILE
    ├── pc/                         # Mã nguồn điều khiển trên Máy tính
    │   ├── config.js               # Tham số độ nhạy chuột, ma trận cuộn Parallax của PC
    │   ├── state.js                # Trạng thái tọa độ con trỏ và vị trí cuộn trang
    │   ├── input-mouse.js          # Lắng nghe sự kiện Mousemove
    │   ├── input-scroll.js         # Lắng nghe sự kiện Wheel/Scroll
    │   ├── transformer.js          # Tính toán ma trận CSS Transform 3D dựa trên chuột/cuộn cho PC
    │   ├── dom-updater.js          # Ghi trực tiếp thuộc tính transform vào DOM
    │   └── app.js                  # Khởi chạy logic PC
    └── mobile/                     # Mã nguồn điều khiển trên Điện thoại/Máy tính bảng
        ├── config.js               # Tham số độ nhạy vuốt, bộ lọc nhiễu cảm biến Gyroscope
        ├── state.js                # Trạng thái tọa độ cảm ứng và góc nghiêng thiết bị
        ├── input-touch.js          # Lắng nghe sự kiện Touchmove thay thế chuột
        ├── input-gyro.js           # Lắng nghe cảm biến độ nghiêng (DeviceOrientation)
        ├── transformer.js          # Tính toán ma trận CSS Transform 3D mượt mà cho phần cứng di động
        ├── dom-updater.js          # Ghi trực tiếp thuộc tính transform vào DOM
        └── app.js                  # Khởi chạy logic Mobile
```
