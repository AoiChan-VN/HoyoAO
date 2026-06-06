import { MatrixCamera } from "./core/matrix.js";

export class App {
    constructor() {
        this.viewport = null;
        this.root = null;

        this.camera = new MatrixCamera();

        this.pointer = {
            active: false,
            startX: 0,
            startY: 0
        };

        this.animationFrame = null;

        this.update = this.update.bind(this);
    }

    bootstrap() {
        this.viewport = document.getElementById("viewport");
        this.root = document.getElementById("spatial-root");

        if (!this.viewport) {
            throw new Error(
                "[SpatialEngine] viewport not found."
            );
        }

        this.bindInput();

        this.animationFrame = requestAnimationFrame(
            this.update
        );
    }

    bindInput() {
        window.addEventListener(
            "pointerdown",
            (event) => {
                this.pointer.active = true;

                this.pointer.startX = event.clientX;
                this.pointer.startY = event.clientY;
            },
            { passive: true }
        );

        window.addEventListener(
            "pointermove",
            (event) => {
                if (!this.pointer.active) {
                    return;
                }

                const dx =
                    event.clientX - this.pointer.startX;

                const dy =
                    event.clientY - this.pointer.startY;

                this.pointer.startX = event.clientX;
                this.pointer.startY = event.clientY;

                this.camera.rotate(
                    dx * 0.15,
                    dy * 0.15
                );
            },
            { passive: true }
        );

        window.addEventListener(
            "pointerup",
            () => {
                this.pointer.active = false;
            },
            { passive: true }
        );

        window.addEventListener(
            "pointercancel",
            () => {
                this.pointer.active = false;
            },
            { passive: true }
        );
    }

    update() {
        this.camera.tick();

        document.documentElement.style.setProperty(
            "--camera-rotate-x",
            `${this.camera.pitch}deg`
        );

        document.documentElement.style.setProperty(
            "--camera-rotate-y",
            `${this.camera.yaw}deg`
        );

        this.animationFrame = requestAnimationFrame(
            this.update
        );
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(
                this.animationFrame
            );
        }
    }
} 
