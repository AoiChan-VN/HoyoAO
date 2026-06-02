// data/config.js

export const SITE_CONFIG = {
  // Lấy domain hoặc cấu hình từ môi trường/đường dẫn chạy thực tế của GitHub Pages
  baseEndpoint: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, ''),

  brand: {
    logoText: "PURE",
    logoUrl: "index.html",
    title: "Pure Vanilla Experience"
  },
  
  navigation: [
    { label: "Trang Chủ", path: "index.html" },
    { label: "Giới Thiệu", path: "about.html" },
    { label: "Liên Hệ", path: "contact.html" }
  ],

  settings: {
    themes: ["light", "dark", "cyberpunk"],
    defaultTheme: "dark",
    motionReduction: false
  },

  // Cấu hình tham số điều khiển hiệu ứng - TUYỆT ĐỐI KHÔNG CHỨA LINK ẢNH HARDCODE
  parallaxLayers: [
    { id: "bg-stars", speedX: 0.1, speedY: 0.1, depth: 1 },
    { id: "mg-mountains", speedX: 0.25, speedY: 0.15, depth: 3 },
    { id: "fg-content", speedX: 0.5, speedY: 0.3, depth: 5 }
  ],

  hardware: {
    gyroscope: {
      enabled: true,
      sensitivityX: 12,
      sensitivityY: 12
    }
  },

  // Đường dẫn nạp dữ liệu động tập trung (Data-Driven Architecture)
  manifestSources: {
    assets: "data/assets-manifest.json",  // Nơi quản lý toàn bộ link ảnh thật theo phiên bản
    articles: "data/articles-manifest.json" // Nơi quản lý danh mục bài viết .md thực tế
  }
};
