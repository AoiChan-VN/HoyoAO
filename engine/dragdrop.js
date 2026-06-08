export class DragDrop {

    constructor({
        world,
        camera,
        physics,
        state,
        eventBus
    }) {

        if (!world) {
            throw new Error(
                'DragDrop requires world.'
            );
        }

        if (!camera) {
            throw new Error(
                'DragDrop requires camera.'
            );
        }

        if (!physics) {
            throw new Error(
                'DragDrop requires physics.'
            );
        }

        if (!state) {
            throw new Error(
                'DragDrop requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'DragDrop requires eventBus.'
            );
        }

        this.world = world;
        this.camera = camera;
        this.physics = physics;
        this.state = state;
        this.eventBus = eventBus;

        this.enabled = true;

        this.selectedObject = null;

        this.hoverObject = null;

        this.dragging = false;

        this.dragDistance = 8;

        this.pointer = {
            x: 0,
            y: 0
        };

        this.dragPlane = {
            normal: {
                x: 0,
                y: 0,
                z: 1
            },
            distance: 0
        };

        this.boundPointerDown =
            this.handlePointerDown.bind(this);

        this.boundPointerMove =
            this.handlePointerMove.bind(this);

        this.boundPointerUp =
            this.handlePointerUp.bind(this);
    }

    async initialize() {

        this.registerEvents();

        this.eventBus.emit(
            'dragdrop:initialized'
        );

        console.info(
            '[DragDrop] Initialized'
        );
    }

    registerEvents() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        canvas.addEventListener(
            'pointerdown',
            this.boundPointerDown
        );

        window.addEventListener(
            'pointermove',
            this.boundPointerMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'pointerup',
            this.boundPointerUp
        );
    }

    handlePointerDown(event) {

        if (!this.enabled) {
            return;
        }

        this.updatePointer(
            event
        );

        const ray =
            this.createRay();

        const hits =
            this.physics.raycast(
                ray.origin,
                ray.direction
            );

        if (
            hits.length === 0
        ) {

            this.clearSelection();

            return;
        }

        const target =
            hits[0].object;

        this.selectObject(
            target
        );

        this.beginDrag(
            target
        );
    }

    handlePointerMove(event) {

        this.updatePointer(
            event
        );

        if (
            !this.dragging ||
            !this.selectedObject
        ) {

            this.updateHover();

            return;
        }

        const ray =
            this.createRay();

        const position =
            this.solveDragPlane(
                ray
            );

        if (!position) {
            return;
        }

        this.selectedObject.position.x =
            position.x;

        this.selectedObject.position.y =
            position.y;

        this.selectedObject.position.z =
            position.z;

        this.eventBus.emit(
            'dragdrop:drag',
            {
                object:
                    this.selectedObject
            }
        );
    }

    handlePointerUp() {

        if (
            !this.dragging
        ) {
            return;
        }

        this.dragging = false;

        this.eventBus.emit(
            'dragdrop:end',
            {
                object:
                    this.selectedObject
            }
        );

        this.eventBus.emit(
            'docking:check',
            {
                object:
                    this.selectedObject
            }
        );
    }

    updatePointer(event) {

        this.pointer.x =
            (
                event.clientX /
                window.innerWidth
            ) * 2 - 1;

        this.pointer.y =
            -(
                event.clientY /
                window.innerHeight
            ) * 2 + 1;
    }

    createRay() {

        const yaw =
            this.camera.rotation.yaw;

        const pitch =
            this.camera.rotation.pitch;

        const direction = {
            x:
                Math.sin(yaw),
            y:
                Math.sin(pitch),
            z:
                Math.cos(yaw)
        };

        const length =
            Math.hypot(
                direction.x,
                direction.y,
                direction.z
            );

        direction.x /= length;
        direction.y /= length;
        direction.z /= length;

        return {
            origin: {
                x:
                    this.camera.position.x,
                y:
                    this.camera.position.y,
                z:
                    this.camera.position.z
            },
            direction
        };
    }

    solveDragPlane(ray) {

        const normal =
            this.dragPlane.normal;

        const denominator =
            normal.x *
            ray.direction.x +
            normal.y *
            ray.direction.y +
            normal.z *
            ray.direction.z;

        if (
            Math.abs(
                denominator
            ) < 0.0001
        ) {
            return null;
        }

        const t =
            -(
                normal.x *
                ray.origin.x +
                normal.y *
                ray.origin.y +
                normal.z *
                ray.origin.z +
                this.dragPlane.distance
            ) / denominator;

        if (
            t < 0
        ) {
            return null;
        }

        return {
            x:
                ray.origin.x +
                ray.direction.x * t,

            y:
                ray.origin.y +
                ray.direction.y * t,

            z:
                ray.origin.z +
                ray.direction.z * t
        };
    }

    beginDrag(object) {

        this.dragging = true;

        this.selectedObject =
            object;

        this.dragPlane.distance =
            -object.position.z;

        this.eventBus.emit(
            'dragdrop:start',
            {
                object
            }
        );
    }

    selectObject(object) {

        this.selectedObject =
            object;

        this.eventBus.emit(
            'dragdrop:select',
            {
                object
            }
        );
    }

    clearSelection() {

        this.selectedObject =
            null;

        this.dragging =
            false;

        this.eventBus.emit(
            'dragdrop:clear'
        );
    }

    updateHover() {

        const ray =
            this.createRay();

        const hits =
            this.physics.raycast(
                ray.origin,
                ray.direction
            );

        const object =
            hits.length > 0
                ? hits[0].object
                : null;

        if (
            object ===
            this.hoverObject
        ) {
            return;
        }

        this.hoverObject =
            object;

        this.eventBus.emit(
            'dragdrop:hover',
            {
                object
            }
        );
    }

    enable() {

        this.enabled = true;
    }

    disable() {

        this.enabled = false;

        this.clearSelection();
    }

    destroy() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        if (canvas) {

            canvas.removeEventListener(
                'pointerdown',
                this.boundPointerDown
            );
        }

        window.removeEventListener(
            'pointermove',
            this.boundPointerMove
        );

        window.removeEventListener(
            'pointerup',
            this.boundPointerUp
        );

        this.selectedObject =
            null;

        this.hoverObject =
            null;

        this.dragging =
            false;

        this.eventBus.emit(
            'dragdrop:destroyed'
        );
    }
}
