export class OrientationManager {

    constructor() {

        this.enabled = false;

        this.permissionGranted =
            false;

        this.listeners =
            new Set();

        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;

        this.smoothAlpha = 0;
        this.smoothBeta = 0;
        this.smoothGamma = 0;

        this.calibration = {

            alpha: 0,
            beta: 0,
            gamma: 0
        };

        this.smoothingFactor =
            0.12;

        this.throttleMs =
            16;

        this.lastUpdate =
            0;

        this.boundHandler =
            this.handleOrientation
                .bind(this);
    }

    async initialize() {

        const supported =
            this.isSupported();

        if (
            !supported
        ) {

            return false;
        }

        await this.requestPermission();

        if (
            !this.permissionGranted
        ) {

            return false;
        }

        this.attach();

        this.enabled = true;

        return true;
    }

    isSupported() {

        return (
            "DeviceOrientationEvent"
            in window
        );
    }

    async requestPermission() {

        try {

            if (

                typeof DeviceOrientationEvent
                    .requestPermission !==
                "function"

            ) {

                this.permissionGranted =
                    true;

                return true;
            }

            const permission =
                await DeviceOrientationEvent
                    .requestPermission();

            this.permissionGranted =
                permission ===
                "granted";

            return (
                this.permissionGranted
            );

        } catch {

            this.permissionGranted =
                false;

            return false;
        }
    }

    attach() {

        window.addEventListener(

            "deviceorientation",

            this.boundHandler,

            {
                passive: true
            }
        );
    }

    detach() {

        window.removeEventListener(

            "deviceorientation",

            this.boundHandler
        );
    }

    handleOrientation(
        event
    ) {

        const now =
            performance.now();

        if (

            now -
            this.lastUpdate <
            this.throttleMs

        ) {

            return;
        }

        this.lastUpdate =
            now;

        const alpha =
            Number(
                event.alpha || 0
            );

        const beta =
            Number(
                event.beta || 0
            );

        const gamma =
            Number(
                event.gamma || 0
            );

        this.alpha =
            alpha -
            this.calibration.alpha;

        this.beta =
            beta -
            this.calibration.beta;

        this.gamma =
            gamma -
            this.calibration.gamma;

        this.applySmoothing();

        this.notify();
    }

    applySmoothing() {

        const factor =
            this.smoothingFactor;

        this.smoothAlpha +=

            (
                this.alpha -
                this.smoothAlpha
            ) * factor;

        this.smoothBeta +=

            (
                this.beta -
                this.smoothBeta
            ) * factor;

        this.smoothGamma +=

            (
                this.gamma -
                this.smoothGamma
            ) * factor;
    }

    calibrate() {

        this.calibration = {

            alpha:
                this.alpha,

            beta:
                this.beta,

            gamma:
                this.gamma
        };
    }

    resetCalibration() {

        this.calibration = {

            alpha: 0,

            beta: 0,

            gamma: 0
        };
    }

    getData() {

        return {

            alpha:
                this.smoothAlpha,

            beta:
                this.smoothBeta,

            gamma:
                this.smoothGamma,

            raw: {

                alpha:
                    this.alpha,

                beta:
                    this.beta,

                gamma:
                    this.gamma
            }
        };
    }

    subscribe(
        callback
    ) {

        if (

            typeof callback !==
            "function"

        ) {

            return () => {};
        }

        this.listeners.add(
            callback
        );

        return () => {

            this.listeners.delete(
                callback
            );
        };
    }

    notify() {

        const data =
            this.getData();

        for (
            const listener
            of this.listeners
        ) {

            try {

                listener(
                    data
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );
            }
        }
    }

    setSmoothing(
        factor
    ) {

        this.smoothingFactor =
            Math.min(

                1,

                Math.max(
                    0.01,
                    factor
                )
            );
    }

    setThrottle(
        milliseconds
    ) {

        this.throttleMs =
            Math.max(
                1,
                milliseconds
            );
    }

    isEnabled() {

        return this.enabled;
    }

    destroy() {

        this.detach();

        this.listeners.clear();

        this.enabled = false;
    }
}

export const orientation =
    new OrientationManager();

export default OrientationManager; 
