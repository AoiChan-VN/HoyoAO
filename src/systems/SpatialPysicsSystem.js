export default class SpatialPhysicsSystem {

    constructor(registry) {

        this.registry =
            registry;
    }

    update() {

        const entities =
            this.registry.getAll();

        for(const entity of entities){

            const speed =
            Math.abs(entity.vx) +
            Math.abs(entity.vy) +
            Math.abs(entity.vz);

            if(speed < 0.0001)
                continue;
        }
    }
} 
