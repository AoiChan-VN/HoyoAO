// ./js/math/quaternion.js

export class Quaternion {
    constructor(
        x = 0,
        y = 0,
        z = 0,
        w = 1
    ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(
        x,
        y,
        z,
        w
    ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;
    }

    copy(quaternion) {
        this.x = quaternion.x;
        this.y = quaternion.y;
        this.z = quaternion.z;
        this.w = quaternion.w;

        return this;
    }

    clone() {
        return new Quaternion(
            this.x,
            this.y,
            this.z,
            this.w
        );
    }

    identity() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;

        return this;
    }

    normalize() {
        const length = Math.sqrt(
            this.x * this.x +
            this.y * this.y +
            this.z * this.z +
            this.w * this.w
        );

        if (length === 0) {
            return this.identity();
        }

        const inverse =
            1 / length;

        this.x *= inverse;
        this.y *= inverse;
        this.z *= inverse;
        this.w *= inverse;

        return this;
    }

    multiply(quaternion) {
        return this.multiplyQuaternions(
            this,
            quaternion
        );
    }

    multiplyQuaternions(
        a,
        b
    ) {
        const ax = a.x;
        const ay = a.y;
        const az = a.z;
        const aw = a.w;

        const bx = b.x;
        const by = b.y;
        const bz = b.z;
        const bw = b.w;

        this.x =
            ax * bw +
            aw * bx +
            ay * bz -
            az * by;

        this.y =
            ay * bw +
            aw * by +
            az * bx -
            ax * bz;

        this.z =
            az * bw +
            aw * bz +
            ax * by -
            ay * bx;

        this.w =
            aw * bw -
            ax * bx -
            ay * by -
            az * bz;

        return this;
    }

    setFromEuler(
        pitch,
        yaw,
        roll
    ) {
        const halfPitch =
            pitch * 0.5;

        const halfYaw =
            yaw * 0.5;

        const halfRoll =
            roll * 0.5;

        const sp =
            Math.sin(halfPitch);

        const cp =
            Math.cos(halfPitch);

        const sy =
            Math.sin(halfYaw);

        const cy =
            Math.cos(halfYaw);

        const sr =
            Math.sin(halfRoll);

        const cr =
            Math.cos(halfRoll);

        this.x =
            sp * cy * cr -
            cp * sy * sr;

        this.y =
            cp * sy * cr +
            sp * cy * sr;

        this.z =
            cp * cy * sr -
            sp * sy * cr;

        this.w =
            cp * cy * cr +
            sp * sy * sr;

        return this.normalize();
    }

    toMatrix4() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

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
            new Float32Array(16);

        matrix[0] =
            1 - 2 * (yy + zz);

        matrix[1] =
            2 * (xy + wz);

        matrix[2] =
            2 * (xz - wy);

        matrix[3] = 0;

        matrix[4] =
            2 * (xy - wz);

        matrix[5] =
            1 - 2 * (xx + zz);

        matrix[6] =
            2 * (yz + wx);

        matrix[7] = 0;

        matrix[8] =
            2 * (xz + wy);

        matrix[9] =
            2 * (yz - wx);

        matrix[10] =
            1 - 2 * (xx + yy);

        matrix[11] = 0;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 1;

        return matrix;
    }

    toArray() {
        return [
            this.x,
            this.y,
            this.z,
            this.w
        ];
    }

    static multiply(
        a,
        b
    ) {
        return new Quaternion()
            .multiplyQuaternions(
                a,
                b
            );
    }
} 
