/* ==========================================================================
   MATRIX / VECTOR / QUATERNION MATH
   File: src/core/gl-matrix.js
   FIX VERSION
   - Column Major
   - WebGL Compatible
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

        const len =
            Vec3.length(v);

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
            a[1] * b[2] -
            a[2] * b[1],

            a[2] * b[0] -
            a[0] * b[2],

            a[0] * b[1] -
            a[1] * b[0]
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

        const out =
            new Float32Array(16);

        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];

        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];

        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        const a30 = a[12];
        const a31 = a[13];
        const a32 = a[14];
        const a33 = a[15];

        const b00 = b[0];
        const b01 = b[1];
        const b02 = b[2];
        const b03 = b[3];

        const b10 = b[4];
        const b11 = b[5];
        const b12 = b[6];
        const b13 = b[7];

        const b20 = b[8];
        const b21 = b[9];
        const b22 = b[10];
        const b23 = b[11];

        const b30 = b[12];
        const b31 = b[13];
        const b32 = b[14];
        const b33 = b[15];

        out[0] =
            b00 * a00 +
            b01 * a10 +
            b02 * a20 +
            b03 * a30;

        out[1] =
            b00 * a01 +
            b01 * a11 +
            b02 * a21 +
            b03 * a31;

        out[2] =
            b00 * a02 +
            b01 * a12 +
            b02 * a22 +
            b03 * a32;

        out[3] =
            b00 * a03 +
            b01 * a13 +
            b02 * a23 +
            b03 * a33;

        out[4] =
            b10 * a00 +
            b11 * a10 +
            b12 * a20 +
            b13 * a30;

        out[5] =
            b10 * a01 +
            b11 * a11 +
            b12 * a21 +
            b13 * a31;

        out[6] =
            b10 * a02 +
            b11 * a12 +
            b12 * a22 +
            b13 * a32;

        out[7] =
            b10 * a03 +
            b11 * a13 +
            b12 * a23 +
            b13 * a33;

        out[8] =
            b20 * a00 +
            b21 * a10 +
            b22 * a20 +
            b23 * a30;

        out[9] =
            b20 * a01 +
            b21 * a11 +
            b22 * a21 +
            b23 * a31;

        out[10] =
            b20 * a02 +
            b21 * a12 +
            b22 * a22 +
            b23 * a32;

        out[11] =
            b20 * a03 +
            b21 * a13 +
            b22 * a23 +
            b23 * a33;

        out[12] =
            b30 * a00 +
            b31 * a10 +
            b32 * a20 +
            b33 * a30;

        out[13] =
            b30 * a01 +
            b31 * a11 +
            b32 * a21 +
            b33 * a31;

        out[14] =
            b30 * a02 +
            b31 * a12 +
            b32 * a22 +
            b33 * a32;

        out[15] =
            b30 * a03 +
            b31 * a13 +
            b32 * a23 +
            b33 * a33;

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
                degToRad(
                    fovDegrees
                ) / 2
            );

        const nf =
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
            (far + near) * nf,
            -1,

            0,
            0,
            (2 * far * near) * nf,
            0
        ]);
    }

    static rotationX(rad) {

        const c =
            Math.cos(rad);

        const s =
            Math.sin(rad);

        return new Float32Array([
            1, 0, 0, 0,
            0, c, s, 0,
            0,-s, c, 0,
            0, 0, 0, 1
        ]);
    }

    static rotationY(rad) {

        const c =
            Math.cos(rad);

        const s =
            Math.sin(rad);

        return new Float32Array([
             c, 0,-s, 0,
             0, 1, 0, 0,
             s, 0, c, 0,
             0, 0, 0, 1
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

    static createViewMatrix(
        yawDegrees,
        pitchDegrees
    ) {

        const yaw =
            Mat4.rotationY(
                degToRad(
                    yawDegrees
                )
            );

        const pitch =
            Mat4.rotationX(
                degToRad(
                    pitchDegrees
                )
            );

        return Mat4.multiply(
            yaw,
            pitch
        );
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
            degToRad(
                pitchDegrees
            ) * 0.5;

        const yaw =
            degToRad(
                yawDegrees
            ) * 0.5;

        const roll =
            degToRad(
                rollDegrees
            ) * 0.5;

        const sp =
            Math.sin(pitch);

        const cp =
            Math.cos(pitch);

        const sy =
            Math.sin(yaw);

        const cy =
            Math.cos(yaw);

        const sr =
            Math.sin(roll);

        const cr =
            Math.cos(roll);

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
