export default class DragSystem {

    constructor(registry) {

        this.registry = registry;

        this.active = null;

        this.lastX = 0;
        this.lastY = 0;

        this.bind();
    }

    bind() {

        window.addEventListener(
            "pointerdown",
            e => {

                const target =
                e.target.closest(
                    "[data-spatial-id]"
                );

                if(!target) return;

                const id =
                target.dataset.spatialId;

                this.active =
                this.registry.get(id);

                this.lastX =
                e.clientX;

                this.lastY =
                e.clientY;
            },
            { passive:true }
        );

        window.addEventListener(
            "pointermove",
            e => {

                if(!this.active)
                    return;

                const dx =
                e.clientX -
                this.lastX;

                const dy =
                e.clientY -
                this.lastY;

                this.active.x += dx;
                this.active.y += dy;

                this.active.vx = dx;
                this.active.vy = dy;

                this.lastX =
                e.clientX;

                this.lastY =
                e.clientY;
            },
            { passive:true }
        );

        window.addEventListener(
            "wheel",
            e => {

                if(!this.active)
                    return;

                this.active.z +=
                e.deltaY * -0.5;

                this.active.vz =
                e.deltaY * -0.05;
            },
            {
                passive:true
            }
        );

        window.addEventListener(
            "pointerup",
            () => {

                this.active = null;
            },
            { passive:true }
        );
    }
} 
