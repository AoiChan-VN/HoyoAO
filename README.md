🚀 PHẦN 1: PROMPT BIÊN DỊCH TOÀN DỰ ÁN (DÀNH CHO ENGINE / AI BUILDER)
```txt
ROLE & CONTEXT:
You are an expert WebXR and Spatial Computing Engineer. Build a production-ready, ultra-optimized personal portfolio web platform using pure HTML5, CSS4 3D transforms, and Vanilla ES6+ JavaScript. No Three.js or external WebGL wrappers allowed to achieve maximum performance and low-latency on mobile hardware.

CORE SYSTEM HYPOTHESIS & CONSTRANTS:
1. SPATIAL ELEMENT REGISTRY: Absolutely zero flat 2D HUD overlays. Every single UI component (Menu, Settings, Profiles, Document Viewers) must be registered as a standalone 3D Spatial Entity floating inside a true 3D Coordinate Matrix System.
2. MATRIX-DRIVEN RENDERING: Use a hardware-accelerated Matrix3D trigonometric translation layer inside a requestAnimationFrame rendering loop to simulate 360-degree camera yaw/pitch and spatial parallax drag/inertia.
3. ABSOLUTE FILE SEPARATION: Strictly split JavaScript business logic and CSS styling rules into separate files for every Custom Web Element. No inline `<style>` tags or HTML strings containing CSS inside Shadow DOM allowed.
4. ASSET LOCALIZATION & FALLBACKS: All textures (Skybox 6-sided WebP faces) and SVG logos are loaded strictly via relative local paths inside Web Components (`src/assets/...`), optimized with absolute origin references to survive subfolder deployment paths like GitHub Pages without sifting through 404 dead-locks.
5. IMMERSION ENGINE: Content panels must react to physics-based Drag-and-Move input behaviors (mouse and touch events) with independent spatial transforms, allowing users to toss, arrange, and push interfaces deep into the Z-axis in a fictional Cyberpunk grid.
```
📁 PHẦN 2: PROJECT STRUCTURE CHUẨN INTERNATIONAL PRODUCTION (PURE VR-XR)
```txt
Website/
├── .github/
│   └── workflows/
│       └── deploy.yml               # Luồng CI/CD tự động build tĩnh qua GitHub Actions
├── src/
│   ├── app.js                       # Bootstrap Spatial Core - Hạt nhân điều phối luồng thực thể ảo
│   ├── core/
│   │   ├── matrix.js                # Matrix3D Math - Bộ tính toán ma trận lượng giác & phối cảnh camera
│   │   ├── gyroscope.js             # Low-pass Sensor Core - Kết nối phần cứng cảm biến & lọc nhiễu di động
│   │   └── markdown.js              # Tokenizer Engine - Trình dịch văn bản Markdown tĩnh sang HTML5 bảo mật
│   ├── components/
│   │   ├── skybox/
│   │   │   ├── skybox.js            # Khối lập phương 3D chứa 6 mặt không gian vũ trụ
│   │   │   └── skybox.css           # Định dạng hình học khối hộp lộn ngược úp vào tâm nhìn
│   │   ├── panel/
│   │   │   ├── panel.js             # Thực thể bảng nội dung 3D lơ lửng, tiếp nhận luồng Slot
│   │   │   └── panel.css            # Khung viền Neon, Glassmorphism nhòe kính mờ và gia tốc phần cứng
│   │   ├── card/
│   │   │   ├── card.js              # Thực thể thẻ bài viết tóm tắt nằm trong không gian 3D
│   │   │   └── card.css             # Định dạng typography, nén khoảng đệm, làm mờ chân chữ gradient
│   │   ├── dashboard/
│   │   │   ├── dashboard.js         # HUD Dashboard VR 3D - Bảng menu, thanh điều hướng lơ lửng góc nhìn
│   │   │   └── dashboard.css        # Khung lưới HUD game viễn tưởng, nút bấm trạng thái cảm biến LED
│   │   └── spatial-viewer/
│   │       ├── spatial-viewer.js    # Thực thể xem tài liệu chi tiết (Thay thế hoàn toàn Modal 2D cũ)
│   │       └── spatial-viewer.css   # Tấm nền 3D cong bọc văn bản, cố định trục tiêu cự khi đọc
│   └── assets/
│       ├── content/
│       │   ├── profile.md           # Dữ liệu nội dung: Hồ sơ cá nhân của developer
│       │   └── projects.md          # Dữ liệu nội dung: Danh sách dự án công nghệ tiêu biểu
│       └── textures/
│           ├── logo.svg             # File vector nhận diện thương hiệu cá nhân của bạn
│           ├── pz.webp              # Texture Skybox: Khung mặt trước không gian
│           ├── nz.webp              # Texture Skybox: Khung mặt sau không gian
│           ├── px.webp              # Texture Skybox: Khung mặt trái không gian
│           ├── nx.webp              # Texture Skybox: Khung mặt phải không gian
│           ├── py.webp              # Texture Skybox: Khung mặt trên không gian
│           └── ny.webp              # Texture Skybox: Khung mặt dưới không gian
├── styles/
│   ├── base/
│   │   ├── reset.css                # Triệt tiêu thuộc tính mặc định, khóa zoom pan thô bạo của Mobile
│   │   └── variables.css            # Mã hóa bảng màu Neon Cyberpunk, token chiều sâu trường ảnh (FOV)
│   └── layout/
│       └── viewport.css             # Kích hoạt trường phối cảnh 3D tối cao trên lớp cha Viewport
├── main.js                          # Điểm kích hoạt tối cao - Đăng ký mảng Custom Elements vào Registry
├── index.html                       # Khung xương HTML tĩnh sạch sẽ chứa các thẻ thực thể không gian
└── package.json                     # Định nghĩa script chạy local máy chủ tĩnh chuẩn Production
```

