/* ==========================================================================
   js/parallax/parallax-engine.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class ParallaxEngine {

    constructor() {

        this.layerBack =
            document.getElementById(
                'parallax-layer-back'
            );

        this.layerMiddle =
            document.getElementById(
                'parallax-layer-middle'
            );

        this.layerFront =
            document.getElementById(
                'parallax-layer-front'
            );

        this.targetX = 0;
        this.targetY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.scrollOffset = 0;

        this.enabled = true;

        this.handlePointerMove =
            this.handlePointerMove.bind(
                this
            );

        this.handleScroll =
            this.handleScroll.bind(
                this
            );

        this.handleTouchMove =
            this.handleTouchMove.bind(
                this
            );

        this.bindEvents();

    }

    bindEvents() {

        window.addEventListener(
            'pointermove',
            this.handlePointerMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'touchmove',
            this.handleTouchMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'scroll',
            this.handleScroll,
            {
                passive: true
            }
        );

    }

    handlePointerMove(
        event
    ) {

        if (!this.enabled) {
            return;
        }

        const x =
            (
                event.clientX /
                window.innerWidth
            ) * 2 - 1;

        const y =
            (
                event.clientY /
                window.innerHeight
            ) * 2 - 1;

        this.targetX = x;
        this.targetY = y;

    }

    handleTouchMove(
        event
    ) {

        if (
            !this.enabled ||
            event.touches.length === 0
        ) {
            return;
        }

        const touch =
            event.touches[0];

        const x =
            (
                touch.clientX /
                window.innerWidth
            ) * 2 - 1;

        const y =
            (
                touch.clientY /
                window.innerHeight
            ) * 2 - 1;

        this.targetX = x;
        this.targetY = y;

    }

    handleScroll() {

        this.scrollOffset =
            window.scrollY ||
            window.pageYOffset ||
            0;

    }

    setInput(
        x,
        y
    ) {

        this.targetX = x;
        this.targetY = y;

    }

    update(
        deltaTime = 0.016
    ) {

        if (!this.enabled) {
            return;
        }

        const damping =
            Math.min(
                1,
                CONFIG.EXPERIENCE
                    .PARALLAX_DAMPING *
                (deltaTime * 60)
            );

        this.currentX +=
            (
                this.targetX -
                this.currentX
            ) * damping;

        this.currentY +=
            (
                this.targetY -
                this.currentY
            ) * damping;

        this.render();

    }

    render() {

        const scrollInfluence =
            this.scrollOffset *
            CONFIG.EXPERIENCE
                .PARALLAX_SCROLL_FACTOR;

        const backX =
            this.currentX * 12;

        const backY =
            this.currentY * 12 +
            scrollInfluence * 0.15;

        const midX =
            this.currentX * 28;

        const midY =
            this.currentY * 28 +
            scrollInfluence * 0.35;

        const frontX =
            this.currentX * 50;

        const frontY =
            this.currentY * 50 +
            scrollInfluence * 0.55;

        if (this.layerBack) {

            this.layerBack.style.transform =
                `
                translate3d(
                    ${backX}px,
                    ${backY}px,
                    0
                )
                `;

        }

        if (this.layerMiddle) {

            this.layerMiddle.style.transform =
                `
                translate3d(
                    ${midX}px,
                    ${midY}px,
                    0
                )
                `;

        }

        if (this.layerFront) {

            this.layerFront.style.transform =
                `
                translate3d(
                    ${frontX}px,
                    ${frontY}px,
                    0
                )
                `;

        }

    }

    reset() {

        this.targetX = 0;
        this.targetY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.scrollOffset = 0;

        this.render();

    }

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    destroy() {

        this.disable();

        window.removeEventListener(
            'pointermove',
            this.handlePointerMove
        );

        window.removeEventListener(
            'touchmove',
            this.handleTouchMove
        );

        window.removeEventListener(
            'scroll',
            this.handleScroll
        );

        this.layerBack = null;
        this.layerMiddle = null;
        this.layerFront = null;

    }

} 
