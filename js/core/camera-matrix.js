// ./js/core/camera-matrix.js

export class CameraMatrix {
    constructor() {
        this.position = {
            x: 0,
            y: 0,
            z: 0
        };

        this.rotation = {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        };

        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);

        this.fieldOfView = 60;
        this.near = 0.1;
        this.far = 1000.0;
        this.aspect = 1.0;

        this.identity(this.viewMatrix);
        this.identity(this.projectionMatrix);
    }

    identity(matrix) {
        matrix[0] = 1;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = 1;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = 1;
        matrix[11] = 0;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 1;
    }

    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    setQuaternion(x, y, z, w) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        this.rotation.w = w;
    }

    setPerspective(
        fieldOfView,
        aspect,
        near,
        far
    ) {
        this.fieldOfView = fieldOfView;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        const fovRadians =
            fieldOfView * Math.PI / 180.0;

        const f =
            1.0 / Math.tan(fovRadians * 0.5);

        const rangeInverse =
            1.0 / (near - far);

        const matrix =
            this.projectionMatrix;

        matrix[0] = f / aspect;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = f;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] =
            (far + near) * rangeInverse;
        matrix[11] = -1;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] =
            (2 * far * near) * rangeInverse;
        matrix[15] = 0;
    }

    updateViewMatrix() {
        const x = this.rotation.x;
        const y = this.rotation.y;
        const z = this.rotation.z;
        const w = this.rotation.w;

        const xx = x * x;
        const yy = y * y;
        const zz = z * z;

        const xy = x * y;
        const xz = x * z;
        const yz = y * z;

        const wx = w * x;
        const wy = w * y;
        const wz = w * z;

        const matrix =
            this.viewMatrix;

        matrix[0] =
            1 - (2 * yy) - (2 * zz);

        matrix[1] =
            (2 * xy) + (2 * wz);

        matrix[2] =
            (2 * xz) - (2 * wy);

        matrix[3] = 0;

        matrix[4] =
            (2 * xy) - (2 * wz);

        matrix[5] =
            1 - (2 * xx) - (2 * zz);

        matrix[6] =
            (2 * yz) + (2 * wx);

        matrix[7] = 0;

        matrix[8] =
            (2 * xz) + (2 * wy);

        matrix[9] =
            (2 * yz) - (2 * wx);

        matrix[10] =
            1 - (2 * xx) - (2 * yy);

        matrix[11] = 0;

        matrix[12] =
            -(
                matrix[0] * this.position.x +
                matrix[4] * this.position.y +
                matrix[8] * this.position.z
            );

        matrix[13] =
            -(
                matrix[1] * this.position.x +
                matrix[5] * this.position.y +
                matrix[9] * this.position.z
            );

        matrix[14] =
            -(
                matrix[2] * this.position.x +
                matrix[6] * this.position.y +
                matrix[10] * this.position.z
            );

        matrix[15] = 1;
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    getPosition() {
        return {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z
        };
    }

    getQuaternion() {
        return {
            x: this.rotation.x,
            y: this.rotation.y,
            z: this.rotation.z,
            w: this.rotation.w
        };
    }
} 
