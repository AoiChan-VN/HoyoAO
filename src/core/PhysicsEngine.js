export default class PhysicsEngine {

    constructor() {

        this.friction = 8;
    }

    update(entity, dt) {

        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;
        entity.z += entity.vz * dt;

        const damping =
            Math.exp(
                -this.friction * dt
            );

        entity.vx *= damping;
        entity.vy *= damping;
        entity.vz *= damping;

        if (Math.abs(entity.vx) < 0.01)
            entity.vx = 0;

        if (Math.abs(entity.vy) < 0.01)
            entity.vy = 0;

        if (Math.abs(entity.vz) < 0.01)
            entity.vz = 0;
    }
}
