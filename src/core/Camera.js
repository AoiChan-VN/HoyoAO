export default class Camera {

    constructor() {

        this.x = 0;
        this.y = 0;
        this.z = 0;

        this.yaw = 0;
        this.pitch = 0;

        this.targetYaw = 0;
        this.targetPitch = 0;

        this.parallax = .08;
    }

    update(dt){

        const factor =
        1 -
        Math.exp(-8 * dt);

        this.yaw +=
        (this.targetYaw - this.yaw)
        * factor;

        this.pitch +=
        (this.targetPitch - this.pitch)
        * factor;
    }
}
