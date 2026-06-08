export class Physics {

    constructor({
        world,
        camera,
        state,
        eventBus
    }) {

        if (!world) {
            throw new Error(
                'Physics requires world.'
            );
        }

        if (!camera) {
            throw new Error(
                'Physics requires camera.'
            );
        }

        if (!state) {
            throw new Error(
                'Physics requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'Physics requires eventBus.'
            );
        }

        this.world = world;
        this.camera = camera;
        this.state = state;
        this.eventBus = eventBus;

        this.collisionPairs = [];

        this.raycastHits = [];

        this.dragTargets = [];

        this.boundsChecks = 0;

        this.collisionChecks = 0;

        this.enabled = true;
    }

    async initialize() {

        this.registerEvents();

        this.eventBus.emit(
            'physics:initialized'
        );

        console.info(
            '[Physics] Initialized'
        );
    }

    registerEvents() {

        this.eventBus.on(
            'physics:enable',
            () => {

                this.enabled = true;
            }
        );

        this.eventBus.on(
            'physics:disable',
            () => {

                this.enabled = false;
            }
        );
    }

    update(deltaTime) {

        if (!this.enabled) {
            return;
        }

        this.boundsChecks = 0;

        this.collisionChecks = 0;

        this.updateWorldBounds();

        this.detectCollisions();
    }

    updateWorldBounds() {

        const bounds =
            this.world.worldBounds;

        this.world.traverse(
            (object) => {

                const p =
                    object.position;

                if (
                    p.x <
                    bounds.minX
                ) {

                    p.x =
                        bounds.minX;
                }

                if (
                    p.x >
                    bounds.maxX
                ) {

                    p.x =
                        bounds.maxX;
                }

                if (
                    p.y <
                    bounds.minY
                ) {

                    p.y =
                        bounds.minY;
                }

                if (
                    p.y >
                    bounds.maxY
                ) {

                    p.y =
                        bounds.maxY;
                }

                if (
                    p.z <
                    bounds.minZ
                ) {

                    p.z =
                        bounds.minZ;
                }

                if (
                    p.z >
                    bounds.maxZ
                ) {

                    p.z =
                        bounds.maxZ;
                }

                this.boundsChecks++;
            }
        );
    }

    detectCollisions() {

        this.collisionPairs.length = 0;

        const objects =
            this.world.getObjects();

        const count =
            objects.length;

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const a =
                objects[i];

            if (
                !a.active ||
                !a.visible
            ) {
                continue;
            }

            for (
                let j = i + 1;
                j < count;
                j++
            ) {

                const b =
                    objects[j];

                if (
                    !b.active ||
                    !b.visible
                ) {
                    continue;
                }

                this.collisionChecks++;

                if (
                    this.sphereCollision(
                        a,
                        b
                    )
                ) {

                    this.collisionPairs.push({
                        a: a.id,
                        b: b.id
                    });

                    this.eventBus.emit(
                        'physics:collision',
                        {
                            a,
                            b
                        }
                    );
                }
            }
        }
    }

    sphereCollision(
        a,
        b
    ) {

        const dx =
            a.position.x -
            b.position.x;

        const dy =
            a.position.y -
            b.position.y;

        const dz =
            a.position.z -
            b.position.z;

        const distanceSquared =
            dx * dx +
            dy * dy +
            dz * dz;

        const radius =
            (
                a.boundingRadius +
                b.boundingRadius
            );

        return (
            distanceSquared <=
            radius * radius
        );
    }

    aabbCollision(
        a,
        b
    ) {

        return (
            a.minX <= b.maxX &&
            a.maxX >= b.minX &&
            a.minY <= b.maxY &&
            a.maxY >= b.minY &&
            a.minZ <= b.maxZ &&
            a.maxZ >= b.minZ
        );
    }

    raycast(
        origin,
        direction,
        maxDistance = Infinity
    ) {

        this.raycastHits.length = 0;

        const objects =
            this.world.getObjects();

        for (
            const object
            of objects
        ) {

            if (
                !object.visible
            ) {
                continue;
            }

            const hit =
                this.intersectSphere(
                    origin,
                    direction,
                    object,
                    maxDistance
                );

            if (hit) {

                this.raycastHits.push(
                    hit
                );
            }
        }

        this.raycastHits.sort(
            (a, b) =>
                a.distance -
                b.distance
        );

        return this.raycastHits;
    }

    intersectSphere(
        origin,
        direction,
        object,
        maxDistance
    ) {

        const cx =
            object.position.x;

        const cy =
            object.position.y;

        const cz =
            object.position.z;

        const ox =
            origin.x - cx;

        const oy =
            origin.y - cy;

        const oz =
            origin.z - cz;

        const a =
            direction.x *
            direction.x +
            direction.y *
            direction.y +
            direction.z *
            direction.z;

        const b =
            2 *
            (
                ox *
                direction.x +
                oy *
                direction.y +
                oz *
                direction.z
            );

        const c =
            ox * ox +
            oy * oy +
            oz * oz -
            (
                object.boundingRadius *
                object.boundingRadius
            );

        const discriminant =
            b * b -
            4 * a * c;

        if (
            discriminant < 0
        ) {
            return null;
        }

        const distance =
            (
                -b -
                Math.sqrt(
                    discriminant
                )
            ) /
            (2 * a);

        if (
            distance < 0 ||
            distance >
            maxDistance
        ) {
            return null;
        }

        return {
            object,
            distance
        };
    }

    findNearbyObjects(
        position,
        radius
    ) {

        const results = [];

        this.world.traverse(
            (object) => {

                const dx =
                    object.position.x -
                    position.x;

                const dy =
                    object.position.y -
                    position.y;

                const dz =
                    object.position.z -
                    position.z;

                const distanceSquared =
                    dx * dx +
                    dy * dy +
                    dz * dz;

                if (
                    distanceSquared <=
                    radius * radius
                ) {

                    results.push(
                        object
                    );
                }
            }
        );

        return results;
    }

    getCollisionPairs() {

        return [
            ...this.collisionPairs
        ];
    }

    getStats() {

        return {
            boundsChecks:
                this.boundsChecks,

            collisionChecks:
                this.collisionChecks,

            collisions:
                this.collisionPairs.length
        };
    }

    destroy() {

        this.collisionPairs.length = 0;

        this.raycastHits.length = 0;

        this.dragTargets.length = 0;

        this.eventBus.emit(
            'physics:destroyed'
        );
    }
} 
