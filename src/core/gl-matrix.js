/* ==========================================================================
   MATRIX / VECTOR / QUATERNION MATH
   File: src/core/gl-matrix.js
   Zero Dependency
   ========================================================================== */

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

export function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

export class Vec3 {

    static create(
        x = 0,
        y = 0,
        z = 0
    ) {
        return new Float32Array([
            x,
            y,
            z
        ]);
    }

    static clone(v) {
        return new Float32Array(v);
    }

    static length(v) {
        return Math.hypot(
            v[0],
            v[1],
            v[2]
        );
    }

    static normalize(v) {
        const len = Vec3.length(v);

        if (len === 0) {
            return Vec3.create();
        }

        return Vec3.create(
            v[0] / len,
            v[1] / len,
            v[2] / len
        );
    }

    static add(a, b) {
        return Vec3.create(
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2]
        );
    }

    static subtract(a, b) {
        return Vec3.create(
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2]
        );
    }

    static scale(v, scalar) {
        return Vec3.create(
            v[0] * scalar,
            v[1] * scalar,
            v[2] * scalar
        );
    }

    static dot(a, b) {
        return (
            a[0] * b[0] +
            a[1] * b[1] +
            a[2] * b[2]
        );
    }

    static cross(a, b) {
        return Vec3.create(
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        );
    }
}

export class Mat4 {

    static identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static multiply(a, b) {
        const out = new Float32Array(16);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {

                out[row * 4 + col] =
                    a[row * 4 + 0] * b[0 * 4 + col] +
                    a[row * 4 + 1] * b[1 * 4 + col] +
                    a[row * 4 + 2] * b[2 * 4 + col] +
                    a[row * 4 + 3] * b[3 * 4 + col];
            }
        }

        return out;
    }

    static perspective(
        fovDegrees,
        aspect,
        near,
        far
    ) {
        const f =
            1 /
            Math.tan(
                degToRad(fovDegrees) / 2
            );

        const rangeInv =
            1 / (near - far);

        return new Float32Array([
            f / aspect,
            0,
            0,
            0,

            0,
            f,
            0,
            0,

            0,
            0,
            (near + far) * rangeInv,
            -1,

            0,
            0,
            near * far * rangeInv * 2,
            0
        ]);
    }

    static rotationX(angleRadians) {
        const c = Math.cos(angleRadians);
        const s = Math.sin(angleRadians);

        return new Float32Array([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]);
    }

    static rotationY(angleRadians) {
        const c = Math.cos(angleRadians);
        const s = Math.sin(angleRadians);

        return new Float32Array([
             c, 0, -s, 0,
             0, 1,  0, 0,
             s, 0,  c, 0,
             0, 0,  0, 1
        ]);
    }

    static translation(
        x,
        y,
        z
    ) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }

    static invert(m) {

        const out =
            new Float32Array(16);

        const inv = [];

        inv[0] =
            m[5] * m[10] * m[15] -
            m[5] * m[11] * m[14] -
            m[9] * m[6] * m[15] +
            m[9] * m[7] * m[14] +
            m[13] * m[6] * m[11] -
            m[13] * m[7] * m[10];

        inv[4] =
            -m[4] * m[10] * m[15] +
             m[4] * m[11] * m[14] +
             m[8] * m[6] * m[15] -
             m[8] * m[7] * m[14] -
             m[12] * m[6] * m[11] +
             m[12] * m[7] * m[10];

        inv[8] =
            m[4] * m[9] * m[15] -
            m[4] * m[11] * m[13] -
            m[8] * m[5] * m[15] +
            m[8] * m[7] * m[13] +
            m[12] * m[5] * m[11] -
            m[12] * m[7] * m[9];

        inv[12] =
            -m[4] * m[9] * m[14] +
             m[4] * m[10] * m[13] +
             m[8] * m[5] * m[14] -
             m[8] * m[6] * m[13] -
             m[12] * m[5] * m[10] +
             m[12] * m[6] * m[9];

        inv[1] =
            -m[1] * m[10] * m[15] +
             m[1] * m[11] * m[14] +
             m[9] * m[2] * m[15] -
             m[9] * m[3] * m[14] -
             m[13] * m[2] * m[11] +
             m[13] * m[3] * m[10];

        inv[5] =
            m[0] * m[10] * m[15] -
            m[0] * m[11] * m[14] -
            m[8] * m[2] * m[15] +
            m[8] * m[3] * m[14] +
            m[12] * m[2] * m[11] -
            m[12] * m[3] * m[10];

        inv[9] =
            -m[0] * m[9] * m[15] +
             m[0] * m[11] * m[13] +
             m[8] * m[1] * m[15] -
             m[8] * m[3] * m[13] -
             m[12] * m[1] * m[11] +
             m[12] * m[3] * m[9];

        inv[13] =
            m[0] * m[9] * m[14] -
            m[0] * m[10] * m[13] -
            m[8] * m[1] * m[14] +
            m[8] * m[2] * m[13] +
            m[12] * m[1] * m[10] -
            m[12] * m[2] * m[9];

        inv[2] =
            m[1] * m[6] * m[15] -
            m[1] * m[7] * m[14] -
            m[5] * m[2] * m[15] +
            m[5] * m[3] * m[14] +
            m[13] * m[2] * m[7] -
            m[13] * m[3] * m[6];

        inv[6] =
            -m[0] * m[6] * m[15] +
             m[0] * m[7] * m[14] +
             m[4] * m[2] * m[15] -
             m[4] * m[3] * m[14] -
             m[12] * m[2] * m[7] +
             m[12] * m[3] * m[6];

        inv[10] =
            m[0] * m[5] * m[15] -
            m[0] * m[7] * m[13] -
            m[4] * m[1] * m[15] +
            m[4] * m[3] * m[13] +
            m[12] * m[1] * m[7] -
            m[12] * m[3] * m[5];

        inv[14] =
            -m[0] * m[5] * m[14] +
             m[0] * m[6] * m[13] +
             m[4] * m[1] * m[14] -
             m[4] * m[2] * m[13] -
             m[12] * m[1] * m[6] +
             m[12] * m[2] * m[5];

        inv[3] =
            -m[1] * m[6] * m[11] +
             m[1] * m[7] * m[10] +
             m[5] * m[2] * m[11] -
             m[5] * m[3] * m[10] -
             m[9] * m[2] * m[7] +
             m[9] * m[3] * m[6];

        inv[7] =
            m[0] * m[6] * m[11] -
            m[0] * m[7] * m[10] -
            m[4] * m[2] * m[11] +
            m[4] * m[3] * m[10] +
            m[8] * m[2] * m[7] -
            m[8] * m[3] * m[6];

        inv[11] =
            -m[0] * m[5] * m[11] +
             m[0] * m[7] * m[9] +
             m[4] * m[1] * m[11] -
             m[4] * m[3] * m[9] -
             m[8] * m[1] * m[7] +
             m[8] * m[3] * m[5];

        inv[15] =
            m[0] * m[5] * m[10] -
            m[0] * m[6] * m[9] -
            m[4] * m[1] * m[10] +
            m[4] * m[2] * m[9] +
            m[8] * m[1] * m[6] -
            m[8] * m[2] * m[5];

        let determinant =
            m[0] * inv[0] +
            m[1] * inv[4] +
            m[2] * inv[8] +
            m[3] * inv[12];

        if (determinant === 0) {
            return Mat4.identity();
        }

        determinant = 1 / determinant;

        for (let i = 0; i < 16; i++) {
            out[i] = inv[i] * determinant;
        }

        return out;
    }
}

export class Quaternion {

    static create(
        x = 0,
        y = 0,
        z = 0,
        w = 1
    ) {
        return new Float32Array([
            x,
            y,
            z,
            w
        ]);
    }

    static fromEuler(
        pitchDegrees,
        yawDegrees,
        rollDegrees = 0
    ) {
        const pitch =
            degToRad(pitchDegrees) * 0.5;

        const yaw =
            degToRad(yawDegrees) * 0.5;

        const roll =
            degToRad(rollDegrees) * 0.5;

        const sp = Math.sin(pitch);
        const cp = Math.cos(pitch);

        const sy = Math.sin(yaw);
        const cy = Math.cos(yaw);

        const sr = Math.sin(roll);
        const cr = Math.cos(roll);

        return Quaternion.create(
            sr * cp * cy -
            cr * sp * sy,

            cr * sp * cy +
            sr * cp * sy,

            cr * cp * sy -
            sr * sp * cy,

            cr * cp * cy +
            sr * sp * sy
        );
    }
} 
