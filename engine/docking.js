export class Docking {

    constructor({
        world,
        physics,
        state,
        eventBus
    }) {

        if (!world) {
            throw new Error(
                'Docking requires world.'
            );
        }

        if (!physics) {
            throw new Error(
                'Docking requires physics.'
            );
        }

        if (!state) {
            throw new Error(
                'Docking requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'Docking requires eventBus.'
            );
        }

        this.world = world;
        this.physics = physics;
        this.state = state;
        this.eventBus = eventBus;

        this.gridSize = 2;

        this.magneticRadius = 8;

        this.snapSpeed = 0.15;

        this.previewTarget = null;

        this.activeAnimations =
            new Map();

        this.enabled = true;
    }

    async initialize() {

        this.registerEvents();

        this.eventBus.emit(
            'docking:initialized'
        );

        console.info(
            '[Docking] Initialized'
        );
    }

    registerEvents() {

        this.eventBus.on(
            'docking:check',
            ({ object }) => {

                this.checkDocking(
                    object
                );
            }
        );

        this.eventBus.on(
            'dragdrop:drag',
            ({ object }) => {

                this.updatePreview(
                    object
                );
            }
        );
    }

    update(deltaTime) {

        for (
            const [id, animation]
            of this.activeAnimations
        ) {

            const object =
                this.world.getObject(
                    id
                );

            if (!object) {

                this.activeAnimations.delete(
                    id
                );

                continue;
            }

            object.position.x +=
                (
                    animation.target.x -
                    object.position.x
                ) *
                this.snapSpeed;

            object.position.y +=
                (
                    animation.target.y -
                    object.position.y
                ) *
                this.snapSpeed;

            object.position.z +=
                (
                    animation.target.z -
                    object.position.z
                ) *
                this.snapSpeed;

            const dx =
                Math.abs(
                    animation.target.x -
                    object.position.x
                );

            const dy =
                Math.abs(
                    animation.target.y -
                    object.position.y
                );

            const dz =
                Math.abs(
                    animation.target.z -
                    object.position.z
                );

            if (
                dx < 0.01 &&
                dy < 0.01 &&
                dz < 0.01
            ) {

                object.position.x =
                    animation.target.x;

                object.position.y =
                    animation.target.y;

                object.position.z =
                    animation.target.z;

                this.activeAnimations.delete(
                    id
                );

                this.eventBus.emit(
                    'docking:complete',
                    {
                        object
                    }
                );
            }
        }
    }

    updatePreview(object) {

        if (!object) {
            return;
        }

        const target =
            this.findNearestDock(
                object
            );

        if (!target) {

            if (
                this.previewTarget
            ) {

                this.previewTarget =
                    null;

                this.eventBus.emit(
                    'docking:preview-clear'
                );
            }

            return;
        }

        this.previewTarget =
            target;

        this.eventBus.emit(
            'docking:preview',
            {
                source: object,
                target
            }
        );
    }

    checkDocking(object) {

        if (
            !object ||
            !this.enabled
        ) {
            return;
        }

        const target =
            this.findNearestDock(
                object
            );

        if (!target) {
            return;
        }

        const snapped =
            this.calculateSnapPosition(
                target
            );

        this.startSnapAnimation(
            object,
            snapped
        );

        this.restoreHierarchy(
            object,
            target
        );
    }

    findNearestDock(object) {

        let nearest =
            null;

        let nearestDistance =
            Infinity;

        const objects =
            this.world.getObjects();

        for (
            const candidate
            of objects
        ) {

            if (
                candidate.id ===
                object.id
            ) {
                continue;
            }

            const dx =
                candidate.position.x -
                object.position.x;

            const dy =
                candidate.position.y -
                object.position.y;

            const dz =
                candidate.position.z -
                object.position.z;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy +
                    dz * dz
                );

            if (
                distance >
                this.magneticRadius
            ) {
                continue;
            }

            if (
                distance <
                nearestDistance
            ) {

                nearest =
                    candidate;

                nearestDistance =
                    distance;
            }
        }

        return nearest;
    }

    calculateSnapPosition(
        target
    ) {

        return {
            x:
                Math.round(
                    target.position.x /
                    this.gridSize
                ) *
                this.gridSize,

            y:
                Math.round(
                    target.position.y /
                    this.gridSize
                ) *
                this.gridSize,

            z:
                Math.round(
                    target.position.z /
                    this.gridSize
                ) *
                this.gridSize
        };
    }

    startSnapAnimation(
        object,
        target
    ) {

        this.activeAnimations.set(
            object.id,
            {
                target
            }
        );

        this.eventBus.emit(
            'docking:snap-start',
            {
                object,
                target
            }
        );
    }

    restoreHierarchy(
        object,
        target
    ) {

        object.parentId =
            target.id;

        if (
            !target.children
        ) {

            target.children = [];
        }

        if (
            !target.children.includes(
                object.id
            )
        ) {

            target.children.push(
                object.id
            );
        }

        this.eventBus.emit(
            'docking:attached',
            {
                child: object,
                parent: target
            }
        );
    }

    resolveCollisions() {

        const collisions =
            this.physics.getCollisionPairs();

        for (
            const collision
            of collisions
        ) {

            const a =
                this.world.getObject(
                    collision.a
                );

            const b =
                this.world.getObject(
                    collision.b
                );

            if (
                !a ||
                !b
            ) {
                continue;
            }

            const offset =
                this.gridSize;

            b.position.x +=
                offset;

            b.position.y +=
                offset;
        }
    }

    autoArrange(
        parentObject
    ) {

        if (
            !parentObject ||
            !parentObject.children
        ) {
            return;
        }

        const spacing = 4;

        parentObject.children.forEach(
            (
                childId,
                index
            ) => {

                const child =
                    this.world.getObject(
                        childId
                    );

                if (!child) {
                    return;
                }

                child.position.x =
                    parentObject.position.x +
                    (
                        index *
                        spacing
                    );

                child.position.y =
                    parentObject.position.y;

                child.position.z =
                    parentObject.position.z;
            }
        );

        this.eventBus.emit(
            'docking:auto-arranged',
            {
                parent:
                    parentObject.id
            }
        );
    }

    enable() {

        this.enabled = true;
    }

    disable() {

        this.enabled = false;
    }

    destroy() {

        this.activeAnimations.clear();

        this.previewTarget =
            null;

        this.eventBus.emit(
            'docking:destroyed'
        );
    }
} 
