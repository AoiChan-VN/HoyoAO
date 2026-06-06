/**
 * ==========================================================================
 * ULTRA-COMPATIBLE SPATIAL SKYBOX SUBSYSTEM (MOBILE RE-INDEX)
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
        const styleLink = document.createElement('link');
        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'src/components/skybox/skybox.css');

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

        this.shadowRoot.appendChild(styleLink);
        this.shadowRoot.appendChild(container);
    }
}
