export class VRStatusSkybox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    transform-style: preserve-3d;
                    z-index: var(--z-index-skybox, 1);
                    pointer-events: none;
                }
                .skybox-cube {
                    position: absolute;
                    transform-style: preserve-3d;
                    width: var(--skybox-size, 2000px);
                    height: var(--skybox-size, 2000px);
                    top: calc(var(--skybox-negative-half-size, -1000px));
                    left: calc(var(--skybox-negative-half-size, -1000px));
                }
                .face {
                    position: absolute;
                    width: var(--skybox-size, 2000px);
                    height: var(--skybox-size, 2000px);
                    background-size: 100% 100%;
                    background-position: center;
                    background-repeat: no-repeat;
                    backface-visibility: hidden;
                }
                .front  { transform: rotateY(180deg) translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/pz.webp'); }
                .back   { transform: rotateY(0deg)   translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/nz.webp'); }
                .left   { transform: rotateY(90deg)  translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/px.webp'); }
                .right  { transform: rotateY(-90deg) translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/nx.webp'); }
                .top    { transform: rotateX(-90deg) translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/py.webp'); }
                .bottom { transform: rotateX(90deg)  translateZ(var(--skybox-half-size, 1000px)); background-image: url('./src/assets/textures/ny.webp'); }
            </style>
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
 
