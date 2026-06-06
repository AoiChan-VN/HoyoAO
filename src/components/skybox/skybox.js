/**
 * ==========================================================================
 * ULTRA-COMPATIBLE SPATIAL SKYBOX SUBSYSTEM
 * Khối lập phương 3D chứa 6 mặt không gian vũ trụ Cyberpunk.
 * Tích hợp bộ giải phân giải đường dẫn động (Dynamic Origin Engine)
 * Tương thích tuyệt đối: GitHub Pages, VSCode Live Server, và Local Node.
 * ==========================================================================
 */

export class SpatialSkybox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isLoaded = false;
    }

    connectedCallback() {
        if (this.isLoaded) return;
        this.render();
        this.isLoaded = true;
    }

    /**
     * Thuật toán tự động định vị và xây dựng đường dẫn gốc tuyệt đối cho tài nguyên.
     * Giải quyết triệt để lỗi 404 khi triển khai trên subfolder của GitHub Pages.
     * @returns {string} Đường dẫn gốc chuẩn xác của ứng dụng (ví dụ: '/ten-du-an/')
     */
    getAbsoluteAssetPath() {
        const origin = window.location.origin;
        let pathname = window.location.pathname;

        // Nếu kết thúc bằng index.html, cắt bỏ để lấy thư mục cha
        if (pathname.endsWith('index.html')) {
            pathname = pathname.substring(0, pathname.lastIndexOf('/'));
        }
        
        // Đảm bảo đường dẫn luôn kết thúc bằng dấu gạch chéo
        if (!pathname.endsWith('/')) {
            pathname += '/';
        }

        // Trả về URL tuyệt đối hoàn chỉnh dẫn thẳng vào thư mục textures
        return `${origin}${pathname}src/assets/textures/`;
    }

    render() {
        // Nạp tệp định dạng CSS bên ngoài thông qua liên kết Shadow DOM
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'src/components/skybox/skybox.css');

        const container = document.createElement('div');
        container.setAttribute('class', 'skybox-container');

        // Mảng cấu trúc khớp chính xác tên tệp ảnh pz, nz,... với ma trận 3D của CSS
        const faces = [
            { className: 'face-front', fileName: 'pz.webp' },
            { className: 'face-back', fileName: 'nz.webp' },
            { className: 'face-left', fileName: 'px.webp' },
            { className: 'face-right', fileName: 'nx.webp' },
            { className: 'face-top', fileName: 'py.webp' },
            { className: 'face-bottom', fileName: 'ny.webp' }
        ];

        // Lấy đường dẫn cơ sở đã được tính toán động theo môi trường thực tế
        const baseTextureUrl = this.getAbsoluteAssetPath();

        faces.forEach(faceData => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `skybox-face ${faceData.className}`;
            
            // Ép trực tiếp URL tuyệt đối đã giải mã vào thuộc tính inline style của phần tử con.
            // Điều này vượt qua sự giới hạn phân giải đường dẫn tương đối sai lệch của Shadow DOM.
            const targetImageUrl = `${baseTextureUrl}${faceData.fileName}`;
            faceDiv.style.backgroundImage = `url('${targetImageUrl}')`;
            
            container.appendChild(faceDiv);
        });

        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(container);
    }
}
