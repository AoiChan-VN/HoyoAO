// ./js/core/engine-3d.js

export class Engine3D {
    constructor({
        gl,
        camera,
        hardwareMonitor = null
    } = {}) {
        if (!gl) {
            throw new Error(
                '[ENGINE_3D] WebGL2 context is required.'
            );
        }

        this.gl = gl;

        this.camera =
            camera || null;

        this.hardwareMonitor =
            hardwareMonitor;

        this.sceneObjects = [];

        this.running = false;

        this.animationFrameId =
            null;

        this.lastFrameTime = 0;

        this.deltaTime = 0;

        this.elapsedTime = 0;

        this.xrSession = null;

        this.xrReferenceSpace =
            null;

        this.boundLoop =
            this.loop.bind(
                this
            );
    }

    add(object) {
        if (!object) {
            return;
        }

        this.sceneObjects.push(
            object
        );
    }

    remove(object) {
        this.sceneObjects =
            this.sceneObjects.filter(
                (entry) =>
                    entry !== object
            );
    }

    clearScene() {
        this.sceneObjects.length = 0;
    }

    start() {
        if (
            this.running
        ) {
            return;
        }

        this.running = true;

        this.lastFrameTime =
            performance.now();

        this.animationFrameId =
            requestAnimationFrame(
                this.boundLoop
            );
    }

    stop() {
        this.running = false;

        if (
            this.animationFrameId
        ) {
            cancelAnimationFrame(
                this.animationFrameId
            );

            this.animationFrameId =
                null;
        }
    }

    loop(
        currentTime
    ) {
        if (
            !this.running
        ) {
            return;
        }

        this.deltaTime =
            (
                currentTime -
                this.lastFrameTime
            ) / 1000;

        this.lastFrameTime =
            currentTime;

        this.elapsedTime +=
            this.deltaTime;

        if (
            this.hardwareMonitor
        ) {
            this.hardwareMonitor.beginFrame();
        }

        this.update(
            this.deltaTime
        );

        this.render();

        if (
            this.hardwareMonitor
        ) {
            this.hardwareMonitor.update();
        }

        this.animationFrameId =
            requestAnimationFrame(
                this.boundLoop
            );
    }

    update(
        deltaTime
    ) {
        for (
            let i = 0;
            i <
            this.sceneObjects.length;
            i += 1
        ) {
            const object =
                this.sceneObjects[
                    i
                ];

            if (
                object &&
                typeof object.update ===
                    'function'
            ) {
                object.update(
                    deltaTime
                );
            }
        }
    }

    render() {
        const gl =
            this.gl;

        gl.clearColor(
            0.0,
            0.0,
            0.0,
            1.0
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        for (
            let i = 0;
            i <
            this.sceneObjects.length;
            i += 1
        ) {
            const object =
                this.sceneObjects[
                    i
                ];

            if (
                !object ||
                typeof object.render !==
                    'function'
            ) {
                continue;
            }

            if (
                typeof object.isVisible ===
                    'function' &&
                !object.isVisible()
            ) {
                continue;
            }

            object.render(
                gl,
                this.camera
            );

            if (
                this.hardwareMonitor
            ) {
                this.hardwareMonitor
                    .registerDrawCall();
            }
        }
    }

    attachXRSession(
        session,
        referenceSpace
    ) {
        this.xrSession =
            session;

        this.xrReferenceSpace =
            referenceSpace;
    }

    renderXRFrame(
        time,
        frame
    ) {
        if (
            !this.xrSession
        ) {
            return;
        }

        this.update(
            this.deltaTime
        );

        this.render();

        this.xrSession.requestAnimationFrame(
            (
                xrTime,
                xrFrame
            ) =>
                this.renderXRFrame(
                    xrTime,
                    xrFrame
                )
        );
    }

    getDeltaTime() {
        return this.deltaTime;
    }

    getElapsedTime() {
        return this.elapsedTime;
    }

    getSceneObjects() {
        return [
            ...this.sceneObjects
        ];
    }

    isRunning() {
        return this.running;
    }
} 
