export default class PhysicsEngine {

    constructor() {

        this.friction = 0.92;
    }

    update(entity) {

        entity.x += entity.vx;
        entity.y += entity.vy;
        entity.z += entity.vz;

        entity.vx *= this.friction;
        entity.vy *= this.friction;
        entity.vz *= this.friction;

        if(Math.abs(entity.vx)<0.001)
            entity.vx=0;

        if(Math.abs(entity.vy)<0.001)
            entity.vy=0;

        if(Math.abs(entity.vz)<0.001)
            entity.vz=0;
    }
} 
