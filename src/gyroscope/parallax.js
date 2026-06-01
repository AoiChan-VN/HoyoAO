import { orientation } from "./orientation.js";

export class ParallaxEngine {

    constructor() {

        this.layers = [];

        this.enabled = false;

        this.unsubscribe =
            null;

        this.mouseX = 0;
        this.mouseY = 0;

        this.maxTilt = 18;

        this.mobileMode =
            false;

        this.reducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );

        this.animationFrame =
            null;

        this.boundMouseMove =
            this.handleMouseMove
                .bind(this);
    }

    async initialize() {

        if (
            this.reducedMotion.matches
        ) {

            return false;
        }

        const mobile =
            await orientation.initialize();

        this.mobileMode =
            mobile;

        if (mobile) {

            this.unsubscribe =
                orientation.subscribe(

                    data => {

                        this.updateFromOrientation(
                            data
                        );
                    }
                );

        } else {

            window.addEventListener(

                "mousemove",

                this.boundMouseMove,

                {
                    passive: true
                }
            );
        }

        this.enabled = true;

        return true;
    }

    register(
        selector,
        depth = 1
    ) {

        const elements =
            document.querySelectorAll(
                selector
            );

        elements.forEach(
            element => {

                element.style.willChange =
                    "transform";

                this.layers.push({

                    element,

                    depth
                });
            }
        );
    }

    handleMouseMove(
        event
    ) {

        const centerX =
            window.innerWidth / 2;

        const centerY =
            window.innerHeight / 2;

        this.mouseX =
            (
                event.clientX -
                centerX
            ) / centerX;

        this.mouseY =
            (
                event.clientY -
                centerY
            ) / centerY;

        this.render(
            this.mouseY *
                this.maxTilt,

            this.mouseX *
                this.maxTilt
        );
    }

    updateFromOrientation(
        data
    ) {

        const x =
            data.gamma;

        const y =
            data.beta;

        this.render(
            y * 0.3,

            x * 0.3
        );
    }

    render(
        rotateX,
        rotateY
    ) {

        cancelAnimationFrame(
            this.animationFrame
        );

        this.animationFrame =
            requestAnimationFrame(
                () => {

                    for (
                        const layer
                        of this.layers
                    ) {

                        const depth =
                            layer.depth;

                        const moveX =
                            rotateY *
                            depth;

                        const moveY =
                            rotateX *
                            depth;

                        layer.element
                            .style
                            .transform = `

translate3d(
${moveX}px,
${moveY}px,
0
)

rotateX(
${rotateX * 0.08}deg
)

rotateY(
${rotateY * 0.08}deg
)

`;
                    }
                }
            );
    }

    autoRegister() {

        this.register(
            "[data-depth='1']",
            1
        );

        this.register(
            "[data-depth='2']",
            2
        );

        this.register(
            "[data-depth='3']",
            3
        );

        this.register(
            "[data-depth='4']",
            4
        );

        this.register(
            "[data-depth='5']",
            5
        );
    }

    disableLowEndDevice() {

        const memory =
            navigator.deviceMemory;

        if (
            memory &&
            memory <= 2
        ) {

            this.destroy();

            return true;
        }

        return false;
    }

    setIntensity(
        value
    ) {

        this.maxTilt =
            Math.max(
                1,
                Math.min(
                    45,
                    value
                )
            );
    }

    clearLayers() {

        for (
            const layer
            of this.layers
        ) {

            layer.element
                .style
                .transform = "";

            layer.element
                .style
                .willChange = "";
        }

        this.layers = [];
    }

    destroy() {

        if (
            this.unsubscribe
        ) {

            this.unsubscribe();
        }

        window.removeEventListener(

            "mousemove",

            this.boundMouseMove
        );

        cancelAnimationFrame(
            this.animationFrame
        );

        this.clearLayers();

        this.enabled = false;
    }
}

export const parallax =
    new ParallaxEngine();

export default ParallaxEngine; 
