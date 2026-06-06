export class GyroscopeController {
    constructor(camera) {
        this.camera = camera;

        this.enabled = false;

        this.alpha = 0;
        this.beta = 0;

        this.smoothing = 0.08;

        this.handleOrientation =
            this.handleOrientation.bind(this);
    }

    async initialize() {
        if (
            typeof DeviceOrientationEvent ===
            "undefined"
        ) {
            return false;
        }

        try {
            if (
                typeof DeviceOrientationEvent
                    .requestPermission === "function"
            ) {
                const permission =
                    await DeviceOrientationEvent.requestPermission();

                if (permission !== "granted") {
                    return false;
                }
            }

            window.addEventListener(
                "deviceorientation",
                this.handleOrientation,
                true
            );

            this.enabled = true;

            return true;
        } catch {
            return false;
        }
    }

    handleOrientation(event) {
        if (
            event.beta == null ||
            event.gamma == null
        ) {
            return;
        }

        const targetPitch =
            event.beta * 0.25;

        const targetYaw =
            event.gamma * 0.35;

        this.alpha +=
            (targetYaw - this.alpha) *
            this.smoothing;

        this.beta +=
            (targetPitch - this.beta) *
            this.smoothing;

        this.camera.yaw = this.alpha;
        this.camera.pitch = this.beta;
    }

    destroy() {
        window.removeEventListener(
            "deviceorientation",
            this.handleOrientation,
            true
        );

        this.enabled = false;
    }
} 
