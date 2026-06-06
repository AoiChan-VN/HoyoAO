/**
 * ==========================================================================
 * SPATIAL SKYBOX COMPONENT (ENVIRONMENT SUBSYSTEM)
 * Khối lập phương 3D chứa 6 mặt không gian vũ trụ Cyberpunk kỹ thuật số.
 * Tự động đồng bộ hóa hệ tọa độ cục bộ và cô lập hiệu năng hiển thị.
 * ==========================================================================
 */

export class SpatialSkybox extends HTMLElement {
    constructor() {
        super();
        // Khởi tạo Shadow DOM ở chế độ mở (open) để quản lý cô lập phần tử
        this.attachShadow({ mode: 'open' });
        this.isLoaded = false;
    }

    /**
     * Chu kỳ sống của Web Component: Kích hoạt khi thực thể được gắn vào DOM chính
     */
    connectedCallback() {
        if (this.isLoaded) return;
        this.render();
        this.isLoaded = true;
    }

    /**
     * Kết xuất cấu trúc cơ học 6 mặt của khối Skybox lập phương lộn ngược.
     * Sử dụng đường dẫn tương đối cục bộ chuẩn xác và liên kết file định dạng ngoài (Điều 1 & Điều 2).
     */
    render() {
        // Bước 1: Nạp tệp định dạng CSS biệt lập bên ngoài thông qua liên kết thẻ link (Tuyệt đối không inline style)
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'src/components/skybox/skybox.css');

        // Bước 2: Tạo lập cấu trúc DOM chứa 6 mặt hộp của khối không gian vũ trụ
        const container = document.createElement('div');
        container.setAttribute('class', 'skybox-container');

        // Mảng định nghĩa mã định danh và nhãn hướng cho 6 mặt của khối lập phương (X, Y, Z)
        const faces = [
            { class: 'face-front', name: 'pz' }, // Mặt trước (+Z)
            { class: 'face-back', name: 'nz' },  // Mặt sau (-Z)
            { class: 'face-left', name: 'px' },  // Mặt trái (+X)
            { class: 'face-right', name: 'nx' }, // Mặt phải (-X)
            { class: 'face-top', name: 'py' },   // Mặt trên (+Y)
            { class: 'face-bottom', name: 'ny' } // Mặt dưới (-Y)
        ];

        // Tạo dựng thực tế từng mặt phẳng không gian và gán hình nền trực tiếp bằng mã độc lập
        faces.forEach(faceData => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `skybox-face ${faceData.class}`;
            
            // Thiết lập tài nguyên texture cục bộ WebP nén tối ưu (Phần 2 cấu trúc tài nguyên assets)
            faceDiv.style.backgroundImage = `url('src/assets/textures/${faceData.name}.webp')`;
            
            container.appendChild(faceDiv);
        });

        // Bước 3: Đẩy hạ tầng hoàn chỉnh vào vùng Shadow DOM cô lập an toàn
        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(container);
    }
}
 
