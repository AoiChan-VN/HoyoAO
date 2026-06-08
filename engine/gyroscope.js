export class Gyroscope {

    constructor({
        camera,
        state,
        eventBus
    }) {

        if (!camera) {
            throw new Error(
                'Gyroscope requires camera.'
            );
        }

        if (!state) {
            throw new Error(
                'Gyroscope requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'Gyroscope requires eventBus.'
            );
        }

        this.camera = camera;
        this.state = state;
        this.eventBus = eventBus;

        this.enabled = false;

        this.permissionGranted = false;

        this.calibrated = false;

        this.alphaOffset = 0;
        this.betaOffset = 0;
        this.gammaOffset = 0;

        this.orientation = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };

        this.filtered = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };

        this.filterFactor = 0.08;

        this.quaternion = {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        };

        this.motion = {
            x: 0,
            y: 0,
            z: 0
        };

        this.boundOrientation =
            this.handleOrientation.bind(this);

        this.boundMotion =
            this.handleMotion.bind(this);
    }

    async initialize() {

        this.detectSupport();

        this.eventBus.emit(
            'gyroscope:initialized'
        );

        console.info(
            '[Gyroscope] Initialized'
        );
    }

    detectSupport() {

        const supported =
            (
                'DeviceOrientationEvent'
                in window
            );

        this.state.merge({
            gyroscope: {
                supported
            }
        });
    }

    async requestPermission() {

        try {

            if (
                typeof DeviceOrientationEvent !==
                    'undefined' &&
                typeof DeviceOrientationEvent
                    .requestPermission ===
                    'function'
            ) {

                const response =
                    await DeviceOrientationEvent
                        .requestPermission();

                if (
                    response !==
                    'granted'
                ) {

                    throw new Error(
                        'Permission denied.'
                    );
                }
            }

            if (
                typeof DeviceMotionEvent !==
                    'undefined' &&
                typeof DeviceMotionEvent
                    .requestPermission ===
                    'function'
            ) {

                const response =
                    await DeviceMotionEvent
                        .requestPermission();

                if (
                    response !==
                    'granted'
                ) {

                    throw new Error(
                        'Permission denied.'
                    );
                }
            }

            this.permissionGranted =
                true;

            this.enable();

            return true;

        } catch (error) {

            console.warn(
                error
            );

            return false;
        }
    }

    enable() {

        if (
            this.enabled
        ) {
            return;
        }

        window.addEventListener(
            'deviceorientation',
            this.boundOrientation,
            true
        );

        window.addEventListener(
            'devicemotion',
            this.boundMotion,
            true
        );

        this.enabled = true;

        this.eventBus.emit(
            'gyroscope:enabled'
        );
    }

    disable() {

        window.removeEventListener(
            'deviceorientation',
            this.boundOrientation,
            true
        );

        window.removeEventListener(
            'devicemotion',
            this.boundMotion,
            true
        );

        this.enabled = false;

        this.eventBus.emit(
            'gyroscope:disabled'
        );
    }

    calibrate() {

        this.alphaOffset =
            this.filtered.alpha;

        this.betaOffset =
            this.filtered.beta;

        this.gammaOffset =
            this.filtered.gamma;

        this.calibrated = true;

        this.eventBus.emit(
            'gyroscope:calibrated'
        );
    }

    handleOrientation(event) {

        if (
            event.alpha == null
        ) {
            return;
        }

        this.orientation.alpha =
            event.alpha;

        this.orientation.beta =
            event.beta || 0;

        this.orientation.gamma =
            event.gamma || 0;

        this.applyFilter();

        this.updateQuaternion();

        this.updateCamera();
    }

    handleMotion(event) {

        const accel =
            event.accelerationIncludingGravity;

        if (!accel) {
            return;
        }

        this.motion.x =
            accel.x || 0;

        this.motion.y =
            accel.y || 0;

        this.motion.z =
            accel.z || 0;
    }

    applyFilter() {

        this.filtered.alpha +=
            (
                this.orientation.alpha -
                this.filtered.alpha
            ) *
            this.filterFactor;

        this.filtered.beta +=
            (
                this.orientation.beta -
                this.filtered.beta
            ) *
            this.filterFactor;

        this.filtered.gamma +=
            (
                this.orientation.gamma -
                this.filtered.gamma
            ) *
            this.filterFactor;
    }

    updateQuaternion() {

        const alpha =
            (
                this.filtered.alpha -
                this.alphaOffset
            ) *
            Math.PI / 180;

        const beta =
            (
                this.filtered.beta -
                this.betaOffset
            ) *
            Math.PI / 180;

        const gamma =
            (
                this.filtered.gamma -
                this.gammaOffset
            ) *
            Math.PI / 180;

        const c1 =
            Math.cos(
                alpha / 2
            );

        const c2 =
            Math.cos(
                beta / 2
            );

        const c3 =
            Math.cos(
                gamma / 2
            );

        const s1 =
            Math.sin(
                alpha / 2
            );

        const s2 =
            Math.sin(
                beta / 2
            );

        const s3 =
            Math.sin(
                gamma / 2
            );

        this.quaternion.w =
            c1 * c2 * c3 -
            s1 * s2 * s3;

        this.quaternion.x =
            s1 * s2 * c3 +
            c1 * c2 * s3;

        this.quaternion.y =
            s1 * c2 * c3 +
            c1 * s2 * s3;

        this.quaternion.z =
            c1 * s2 * c3 -
            s1 * c2 * s3;
    }

    updateCamera() {

        if (
            !this.calibrated
        ) {
            return;
        }

        const pitch =
            (
                this.filtered.beta -
                this.betaOffset
            ) *
            Math.PI / 180;

        const yaw =
            (
                this.filtered.alpha -
                this.alphaOffset
            ) *
            Math.PI / 180;

        this.camera.targetPitch =
            pitch;

        this.camera.targetYaw =
            yaw;

        this.eventBus.emit(
            'gyroscope:update',
            {
                pitch,
                yaw,
                quaternion:
                    this.quaternion
            }
        );
    }

    getQuaternion() {

        return {
            ...this.quaternion
        };
    }

    getMotion() {

        return {
            ...this.motion
        };
    }

    getOrientation() {

        return {
            ...this.filtered
        };
    }

    destroy() {

        this.disable();

        this.eventBus.emit(
            'gyroscope:destroyed'
        );
    }
} 
