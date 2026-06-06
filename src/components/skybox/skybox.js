export class VRStatusSkybox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this._applyTextures();
    }

    _applyTextures() {
        const texturesPath = 'src/assets/textures/';
        const faces = {
            'front': 'pz.webp',
            'back': 'nz.webp',
            'left': 'px.webp',
            'right': 'nx.webp',
            'top': 'py.webp',
            'bottom': 'ny.webp'
        };

        for (const [faceClass, fileName] of Object.entries(faces)) {
            const element = this.shadowRoot.querySelector(`.${faceClass}`);
            if (element) {
                element.style.backgroundImage = `url('${texturesPath}${fileName}')`;
            }
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./src/components/skybox/skybox.css">
            <div class="skybox-cube">
                <div class="face front"></div>
                <div class="face back"></div>
                <div class="face left"></div>
                <div class="face right"></div>
                <div class="face top"></div>
                <div class="face bottom"></div>
            </div>
        `;
    }
}
