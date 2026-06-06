// ./js/interaction/motion-sensor.js

export class MotionSensor {
    constructor() {
        this.enabled = false;

        this.orientation = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };

        this.acceleration = {
            x: 0,
            y: 0,
            z: 0
        };

        this.boundOrientationHandler =
            this.handleOrientation.bind(
                this
            );

        this.boundMotionHandler =
            this.handleMotion.bind(
                this
            );
    }

    async initialize() {
        if (
            typeof DeviceOrientationEvent ===
                'undefined' &&
            typeof DeviceMotionEvent ===
                'undefined'
        ) {
            return false;
        }

        if (
            typeof DeviceOrientationEvent !==
                'undefined' &&
            typeof DeviceOrientationEvent
                .requestPermission ===
                'function'
        ) {
            const permission =
                await DeviceOrientationEvent.requestPermission();

            if (
                permission !==
                'granted'
            ) {
                return false;
            }
        }

        if (
            typeof DeviceMotionEvent !==
                'undefined' &&
            typeof DeviceMotionEvent
                .requestPermission ===
                'function'
        ) {
            const permission =
                await DeviceMotionEvent.requestPermission();

            if (
                permission !==
                'granted'
            ) {
                return false;
            }
        }

        window.addEventListener(
            'deviceorientation',
            this.boundOrientationHandler,
            true
        );

        window.addEventListener(
            'devicemotion',
            this.boundMotionHandler,
            true
        );

        this.enabled = true;

        return true;
    }

    destroy() {
        window.removeEventListener(
            'deviceorientation',
            this.boundOrientationHandler,
            true
        );

        window.removeEventListener(
            'devicemotion',
            this.boundMotionHandler,
            true
        );

        this.enabled = false;
    }

    handleOrientation(
        event
    ) {
        this.orientation.alpha =
            event.alpha ?? 0;

        this.orientation.beta =
            event.beta ?? 0;

        this.orientation.gamma =
            event.gamma ?? 0;
    }

    handleMotion(
        event
    ) {
        const acceleration =
            event.accelerationIncludingGravity;

        if (!acceleration) {
            return;
        }

        this.acceleration.x =
            acceleration.x ?? 0;

        this.acceleration.y =
            acceleration.y ?? 0;

        this.acceleration.z =
            acceleration.z ?? 0;
    }

    isEnabled() {
        return this.enabled;
    }

    getOrientation() {
        return {
            alpha:
                this.orientation.alpha,
            beta:
                this.orientation.beta,
            gamma:
                this.orientation.gamma
        };
    }

    getAcceleration() {
        return {
            x:
                this.acceleration.x,
            y:
                this.acceleration.y,
            z:
                this.acceleration.z
        };
    }

    reset() {
        this.orientation.alpha = 0;
        this.orientation.beta = 0;
        this.orientation.gamma = 0;

        this.acceleration.x = 0;
        this.acceleration.y = 0;
        this.acceleration.z = 0;
    }
} 
