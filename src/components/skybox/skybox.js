/**
 * ==========================================================================
 * ULTRA-COMPATIBLE LIGHT-DOM SPATIAL SKYBOX
 * Khai tử hoàn toàn Shadow DOM để cứu luồng ma trận 3D trên trình duyệt di động.
 * Tự động nạp trực tiếp các mặt phẳng không gian vào Light DOM của Stage cha.
 * ==========================================================================
 */

export class SpatialSkybox extends HTMLElement {
    constructor() {
        super();
        this.isLoaded = false;
    }

    connectedCallback() {
        if (this.isLoaded) return;
        this.render();
        this.isLoaded = true;
    }

    getAbsoluteAssetPath() {
        const origin = window.location.origin;
        let pathname = window.location.pathname;
        if (pathname.endsWith('index.html')) {
            pathname = pathname.substring(0, pathname.lastIndexOf('/'));
        }
        if (!pathname.endsWith('/')) pathname += '/';
        return `${origin}${pathname}src/assets/textures/`;
    }

    render() {
        // Tạo thùng chứa nội bộ bằng thẻ div thường thay vì Shadow Root
        const container = document.createElement('div');
        container.setAttribute('class', 'skybox-container');

        const faces = [
            { className: 'face-front', fileName: 'pz.webp' },
            { className: 'face-back', fileName: 'nz.webp' },
            { className: 'face-left', fileName: 'px.webp' },
            { className: 'face-right', fileName: 'nx.webp' },
            { className: 'face-top', fileName: 'py.webp' },
            { className: 'face-bottom', fileName: 'ny.webp' }
        ];

        const baseTextureUrl = this.getAbsoluteAssetPath();

        faces.forEach(faceData => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `skybox-face ${faceData.className}`;
            faceDiv.style.backgroundImage = `url('${baseTextureUrl}${faceData.fileName}')`;
            container.appendChild(faceDiv);
        });

        // Đẩy thẳng container vào thân thẻ (Light DOM) giúp giữ liên kết preserve-3d với stage cha
        this.appendChild(container);
    }
}
