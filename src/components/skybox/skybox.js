/**
 * ==========================================================================
 * SPATIAL SKYBOX COMPONENT (PATCHED)
 * Khối lập phương 3D chứa 6 mặt không gian vũ trụ Cyberpunk.
 * Đã sửa lỗi đồng bộ chính xác tên tệp ảnh gốc và cấu trúc hình học CSS.
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

    render() {
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'src/components/skybox/skybox.css');

        const container = document.createElement('div');
        container.setAttribute('class', 'skybox-container');

        // Khai báo mảng khớp chính xác tên tệp ảnh pz.webp, nz.webp... với selector CSS
        const faces = [
            { className: 'face-front', fileName: 'pz' },
            { className: 'face-back', fileName: 'nz' },
            { className: 'face-left', fileName: 'px' },
            { className: 'face-right', fileName: 'nx' },
            { className: 'face-top', fileName: 'py' },
            { className: 'face-bottom', fileName: 'ny' }
        ];

        faces.forEach(faceData => {
            const faceDiv = document.createElement('div');
            // Gán cả hai lớp để vừa nhận tọa độ 3D từ CSS, vừa cô lập thuộc tính nền
            faceDiv.className = `skybox-face ${faceData.className}`;
            
            // Ép đường dẫn tuyệt đối tính từ gốc dự án để survives mọi deployment path
            faceDiv.style.backgroundImage = `url('src/assets/textures/${faceData.fileName}.webp')`;
            
            container.appendChild(faceDiv);
        });

        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(container);
    }
}
