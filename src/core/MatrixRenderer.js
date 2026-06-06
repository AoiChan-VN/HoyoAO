export default class MatrixRenderer {

    constructor(world, camera) {

        this.world = world;
        this.camera = camera;

        this.cache =
            new WeakMap();
    }

    render(registry) {

        const cam =
            this.camera;

        this.world.style.transform =
        `
        translate3d(
            ${-cam.x}px,
            ${-cam.y}px,
            ${cam.z}px
        )
        rotateX(${cam.pitch}deg)
        rotateY(${cam.yaw}deg)
        `;

        const entities =
            registry.getAll();

        for (const entity of entities) {

            const transform =
            `
            translate3d(
                ${entity.x}px,
                ${entity.y}px,
                ${entity.z}px
            )
            rotateX(${entity.rx || 0}deg)
            rotateY(${entity.ry || 0}deg)
            rotateZ(${entity.rz || 0}deg)
            `;

            if (
                this.cache.get(
                    entity.element
                ) === transform
            ) {
                continue;
            }

            entity.element.style.transform =
                transform;

            this.cache.set(
                entity.element,
                transform
            );
        }
    }
}
