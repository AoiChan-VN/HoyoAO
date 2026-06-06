const MAX_PITCH = 80;
const MIN_PITCH = -80;

export class MatrixCamera {
    constructor() {
        this.yaw = 0;
        this.pitch = 0;

        this.velocityYaw = 0;
        this.velocityPitch = 0;

        this.dragFactor = 0.92;
        this.rotationSpeed = 1;
    }

    rotate(deltaYaw, deltaPitch) {
        this.velocityYaw +=
            deltaYaw * this.rotationSpeed;

        this.velocityPitch +=
            deltaPitch * this.rotationSpeed;
    }

    tick() {
        this.yaw += this.velocityYaw;
        this.pitch += this.velocityPitch;

        if (this.pitch > MAX_PITCH) {
            this.pitch = MAX_PITCH;
        }

        if (this.pitch < MIN_PITCH) {
            this.pitch = MIN_PITCH;
        }

        this.velocityYaw *= this.dragFactor;
        this.velocityPitch *= this.dragFactor;

        if (
            Math.abs(this.velocityYaw) < 0.001
        ) {
            this.velocityYaw = 0;
        }

        if (
            Math.abs(this.velocityPitch) < 0.001
        ) {
            this.velocityPitch = 0;
        }
    }

    getMatrixState() {
        return {
            yaw: this.yaw,
            pitch: this.pitch,
            velocityYaw: this.velocityYaw,
            velocityPitch: this.velocityPitch
        };
    }
} 
