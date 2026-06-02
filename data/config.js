// data/config.js

export const SITE_CONFIG = {
  brand: {
    logoText: "PURE",
    logoUrl: "#",
    title: "Pure Vanilla Experience"
  },
  
  // Điều hướng hệ thống Multi-Page Application (MPA)
  navigation: [
    { label: "Trang Chủ", path: "index.html" },
    { label: "Giới Thiệu", path: "about.html" },
    { label: "Liên Hệ", path: "contact.html" }
  ],

  // Cấu hình mặc định cho Menu Settings
  settings: {
    themes: ["light", "dark", "cyberpunk"],
    defaultTheme: "dark",
    motionReduction: false // Giảm hiệu ứng cho người dùng nhạy cảm
  },

  // Dữ liệu và tham số điều khiển hiệu ứng Parallax / Gyroscope / Camera
  parallaxLayers: [
    { id: "bg-stars", speedX: 0.05, speedY: 0.05, depth: 1, color: "#0b0f19" },
    { id: "mg-mountains", speedX: 0.2, speedY: 0.1, depth: 3, color: "#1f2937" },
    { id: "fg-content", speedX: 0.4, speedY: 0.3, depth: 5, color: "transparent" }
  ],

  // Thiết lập phần cứng nhạy cảm
  hardware: {
    gyroscope: {
      enabled: true,
      sensitivityX: 15,
      sensitivityY: 15
    },
    camera: {
      enabled: false, // Mặc định tắt, chỉ bật khi user cấp quyền
      constraints: { video: { facingMode: "user" } }
    }
  }
};
 
