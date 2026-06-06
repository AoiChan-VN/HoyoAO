export default class InputSystem {

    constructor(camera) {

        this.camera = camera;

        this.pointerDown = false;

        this.lastX = 0;
        this.lastY = 0;

        this.bind();
    }

    bind() {

        window.addEventListener(
            "pointerdown",
            e => {

                this.pointerDown = true;

                this.lastX = e.clientX;
                this.lastY = e.clientY;
            },
            { passive:true }
        );

        window.addEventListener(
            "pointermove",
            e => {

                if (!this.pointerDown)
                    return;

                const dx =
                    e.clientX -
                    this.lastX;

                const dy =
                    e.clientY -
                    this.lastY;

                this.camera.targetYaw +=
                    dx * 0.08;

                this.camera.targetPitch -=
                    dy * 0.08;

                this.lastX =
                    e.clientX;

                this.lastY =
                    e.clientY;
            },
            { passive:true }
        );

        window.addEventListener(
            "pointerup",
            () => {

                this.pointerDown = false;
            },
            { passive:true }
        );
    }
} 
