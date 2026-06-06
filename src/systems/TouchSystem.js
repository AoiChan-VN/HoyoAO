export default class TouchSystem {

    constructor(camera) {

        this.camera = camera;

        this.lastDistance = 0;

        this.bind();
    }

    bind() {

        window.addEventListener(
            "touchmove",
            e => {

                if (
                    e.touches.length !== 2
                ) return;

                const a =
                    e.touches[0];

                const b =
                    e.touches[1];

                const dx =
                    b.clientX -
                    a.clientX;

                const dy =
                    b.clientY -
                    a.clientY;

                const dist =
                    Math.hypot(dx,dy);

                if(this.lastDistance){

                    this.camera.z +=
                    (dist-this.lastDistance)
                    * 0.5;
                }

                this.lastDistance =
                    dist;
            },
            { passive:true }
        );
    }
} 
