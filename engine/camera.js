export class Camera {

    constructor({
        state,
        eventBus
    }) {

        if (!state) {
            throw new Error(
                'Camera requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'Camera requires eventBus.'
            );
        }

        this.state = state;
        this.eventBus = eventBus;

        this.position = {
            x: 0,
            y: 0,
            z: 0
        };

        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        };

        this.rotation = {
            pitch: 0,
            yaw: 0,
            roll: 0
        };

        this.quaternion = {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        };

        this.viewMatrix =
            new Float32Array(16);

        this.projectionMatrix =
            new Float32Array(16);

        this.aspect =
            window.innerWidth /
            window.innerHeight;

        this.fov =
            75 * Math.PI / 180;

        this.near = 0.1;

        this.far = 10000;

        this.pointerLocked =
            false;

        this.mouseSensitivity =
            0.002;

        this.moveSpeed =
            8.0;

        this.sprintMultiplier =
            2.0;

        this.inertia =
            0.88;

        this.rotationSmoothing =
            0.12;

        this.targetPitch = 0;
        this.targetYaw = 0;

        this.keys =
            new Set();

        this.boundMouseMove =
            this.handleMouseMove.bind(this);

        this.boundPointerLock =
            this.handlePointerLockChange.bind(this);

        this.boundKeyDown =
            this.handleKeyDown.bind(this);

        this.boundKeyUp =
            this.handleKeyUp.bind(this);

        this.boundPointerDown =
            this.requestPointerLock.bind(this);
    }

    async initialize() {

        this.createProjection();

        this.identity(
            this.viewMatrix
        );

        this.registerEvents();

        this.syncState();

        console.info(
            '[Camera] Initialized'
        );
    }

    registerEvents() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        canvas.addEventListener(
            'click',
            this.boundPointerDown
        );

        document.addEventListener(
            'pointerlockchange',
            this.boundPointerLock
        );

        document.addEventListener(
            'mousemove',
            this.boundMouseMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'keydown',
            this.boundKeyDown
        );

        window.addEventListener(
            'keyup',
            this.boundKeyUp
        );

        this.eventBus.on(
            'viewport:resize',
            () => {

                this.resize();
            }
        );
    }

    requestPointerLock() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        if (
            document.pointerLockElement !==
            canvas
        ) {

            canvas.requestPointerLock();
        }
    }

    handlePointerLockChange() {

        const canvas =
            document.getElementById(
                'webgl-canvas'
            );

        this.pointerLocked =
            document.pointerLockElement ===
            canvas;

        this.eventBus.emit(
            'camera:pointerlock',
            {
                active:
                    this.pointerLocked
            }
        );
    }

    handleMouseMove(event) {

        if (
            !this.pointerLocked
        ) {
            return;
        }

        this.targetYaw -=
            event.movementX *
            this.mouseSensitivity;

        this.targetPitch -=
            event.movementY *
            this.mouseSensitivity;

        const limit =
            Math.PI / 2 - 0.01;

        if (
            this.targetPitch >
            limit
        ) {

            this.targetPitch =
                limit;
        }

        if (
            this.targetPitch <
            -limit
        ) {

            this.targetPitch =
                -limit;
        }
    }

    handleKeyDown(event) {

        this.keys.add(
            event.code
        );
    }

    handleKeyUp(event) {

        this.keys.delete(
            event.code
        );
    }

    update(deltaTime) {

        this.updateRotation(
            deltaTime
        );

        this.updateMovement(
            deltaTime
        );

        this.updateViewMatrix();

        this.syncState();
    }

    updateRotation(deltaTime) {

        const lerp =
            1 -
            Math.pow(
                1 -
                this.rotationSmoothing,
                deltaTime * 60
            );

        this.rotation.pitch +=
            (
                this.targetPitch -
                this.rotation.pitch
            ) * lerp;

        this.rotation.yaw +=
            (
                this.targetYaw -
                this.rotation.yaw
            ) * lerp;

        this.updateQuaternion();
    }

    updateMovement(deltaTime) {

        let moveX = 0;
        let moveY = 0;
        let moveZ = 0;

        if (
            this.keys.has('KeyW')
        ) {
            moveZ -= 1;
        }

        if (
            this.keys.has('KeyS')
        ) {
            moveZ += 1;
        }

        if (
            this.keys.has('KeyA')
        ) {
            moveX -= 1;
        }

        if (
            this.keys.has('KeyD')
        ) {
            moveX += 1;
        }

        if (
            this.keys.has('Space')
        ) {
            moveY += 1;
        }

        if (
            this.keys.has(
                'ShiftLeft'
            )
        ) {
            moveY -= 1;
        }

        let speed =
            this.moveSpeed;

        if (
            this.keys.has(
                'ControlLeft'
            )
        ) {

            speed *=
                this.sprintMultiplier;
        }

        const sinYaw =
            Math.sin(
                this.rotation.yaw
            );

        const cosYaw =
            Math.cos(
                this.rotation.yaw
            );

        const forwardX =
            sinYaw;

        const forwardZ =
            cosYaw;

        const rightX =
            cosYaw;

        const rightZ =
            -sinYaw;

        this.velocity.x +=
            (
                forwardX *
                moveZ +
                rightX *
                moveX
            ) *
            speed *
            deltaTime;

        this.velocity.y +=
            moveY *
            speed *
            deltaTime;

        this.velocity.z +=
            (
                forwardZ *
                moveZ +
                rightZ *
                moveX
            ) *
            speed *
            deltaTime;

        this.position.x +=
            this.velocity.x;

        this.position.y +=
            this.velocity.y;

        this.position.z +=
            this.velocity.z;

        this.velocity.x *=
            this.inertia;

        this.velocity.y *=
            this.inertia;

        this.velocity.z *=
            this.inertia;
    }

    updateQuaternion() {

        const cy =
            Math.cos(
                this.rotation.yaw *
                0.5
            );

        const sy =
            Math.sin(
                this.rotation.yaw *
                0.5
            );

        const cp =
            Math.cos(
                this.rotation.pitch *
                0.5
            );

        const sp =
            Math.sin(
                this.rotation.pitch *
                0.5
            );

        const cr =
            Math.cos(
                this.rotation.roll *
                0.5
            );

        const sr =
            Math.sin(
                this.rotation.roll *
                0.5
            );

        this.quaternion.w =
            cr * cp * cy +
            sr * sp * sy;

        this.quaternion.x =
            sr * cp * cy -
            cr * sp * sy;

        this.quaternion.y =
            cr * sp * cy +
            sr * cp * sy;

        this.quaternion.z =
            cr * cp * sy -
            sr * sp * cy;
    }

    updateViewMatrix() {

        const matrix =
            this.viewMatrix;

        this.identity(matrix);

        matrix[12] =
            -this.position.x;

        matrix[13] =
            -this.position.y;

        matrix[14] =
            -this.position.z;
    }

    createProjection() {

        const f =
            1 /
            Math.tan(
                this.fov / 2
            );

        const nf =
            1 /
            (
                this.near -
                this.far
            );

        const out =
            this.projectionMatrix;

        out[0] =
            f / this.aspect;

        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;

        out[10] =
            (
                this.far +
                this.near
            ) * nf;

        out[11] = -1;

        out[12] = 0;
        out[13] = 0;

        out[14] =
            (
                2 *
                this.far *
                this.near
            ) * nf;

        out[15] = 0;
    }

    resize() {

        this.aspect =
            window.innerWidth /
            window.innerHeight;

        this.createProjection();
    }

    syncState() {

        this.state.merge({
            camera: {
                position: {
                    x: this.position.x,
                    y: this.position.y,
                    z: this.position.z
                },
                rotation: {
                    pitch:
                        this.rotation.pitch,
                    yaw:
                        this.rotation.yaw,
                    roll:
                        this.rotation.roll
                }
            }
        });

        this.eventBus.emit(
            'camera:update',
            {
                position:
                    this.position,
                rotation:
                    this.rotation
            }
        );
    }

    getViewMatrix() {

        return this.viewMatrix;
    }

    getProjectionMatrix() {

        return this.projectionMatrix;
    }

    getQuaternion() {

        return {
            ...this.quaternion
        };
    }

    identity(matrix) {

        matrix[0] = 1;
        matrix[5] = 1;
        matrix[10] = 1;
        matrix[15] = 1;

        matrix[1] =
        matrix[2] =
        matrix[3] =
        matrix[4] =
        matrix[6] =
        matrix[7] =
        matrix[8] =
        matrix[9] =
        matrix[11] =
        matrix[12] =
        matrix[13] =
        matrix[14] = 0;
    }

    destroy() {

        document.removeEventListener(
            'pointerlockchange',
            this.boundPointerLock
        );

        document.removeEventListener(
            'mousemove',
            this.boundMouseMove
        );

        window.removeEventListener(
            'keydown',
            this.boundKeyDown
        );

        window.removeEventListener(
            'keyup',
            this.boundKeyUp
        );

        this.keys.clear();
    }
} 
