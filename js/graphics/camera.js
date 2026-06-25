import { mat4 } from "../core/math_3d.js";
import { RENDER_CONFIG } from "../config/constants.js";

export class Camera {
    constructor() {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.position = new Float32Array([0, 40, -180]);
        this.target = new Float32Array([0, 0, 300]);
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.currentShakeX = 0;
        this.currentShakeY = 0;
    }

    update(dt, playerPosition) {
        this.target[0] = playerPosition[0];
        this.target[1] = playerPosition[1];
        this.target[2] = playerPosition[2] + 400;

        this.position[0] = playerPosition[0] * 0.85;
        this.position[1] = playerPosition[1] * 0.5 + 50;
        this.position[2] = playerPosition[2] - 140;

        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.currentShakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.currentShakeY = (Math.random() - 0.5) * this.shakeIntensity;
            if (this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
                this.currentShakeX = 0;
                this.currentShakeY = 0;
            }
        }

        const eyeX = this.position[0] + this.currentShakeX;
        const eyeY = this.position[1] + this.currentShakeY;
        const eyeZ = this.position[2];

        const tarX = this.target[0];
        const tarY = this.target[1];
        const tarZ = this.target[2];

        let z0 = eyeX - tarX;
        let z1 = eyeY - tarY;
        let z2 = eyeZ - tarZ;
        let len = Math.hypot(z0, z1, z2);
        if (len === 0) { len = 1; }
        z0 /= len; z1 /= len; z2 /= len;

        let x0 = z1;
        let x1 = -z0;
        let x2 = 0;
        len = Math.hypot(x0, x1, x2);
        if (len === 0) {
            x0 = 1; x1 = 0; x2 = 0;
        } else {
            x0 /= len; x1 /= len; x2 /= len;
        }

        const y0 = z1 * x2 - z2 * x1;
        const y1 = z2 * x0 - z0 * x2;
        const y2 = z0 * x1 - z1 * x0;

        this.viewMatrix[0] = x0;
        this.viewMatrix[1] = y0;
        this.viewMatrix[2] = z0;
        this.viewMatrix[3] = 0;
        this.viewMatrix[4] = x1;
        this.viewMatrix[5] = y1;
        this.viewMatrix[6] = z1;
        this.viewMatrix[7] = 0;
        this.viewMatrix[8] = x2;
        this.viewMatrix[9] = y2;
        this.viewMatrix[10] = z2;
        this.viewMatrix[11] = 0;
        this.viewMatrix[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
        this.viewMatrix[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
        this.viewMatrix[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
        this.viewMatrix[15] = 1;
    }

    setPerspective(width, height) {
        const aspect = width / height;
        const fovy = (RENDER_CONFIG.FOV * Math.PI) / 180;
        mat4.perspective(this.projectionMatrix, fovy, aspect, RENDER_CONFIG.NEAR, RENDER_CONFIG.FAR);
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }
}
 
