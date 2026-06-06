// ./js/math/matrix4.js

export class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const e = this.elements;

        e[0] = 1;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = 1;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] = 1;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        return this;
    }

    copy(matrix) {
        this.elements.set(
            matrix.elements
        );

        return this;
    }

    clone() {
        const matrix = new Matrix4();

        matrix.copy(this);

        return matrix;
    }

    multiply(matrix) {
        return this.multiplyMatrices(
            this,
            matrix
        );
    }

    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        const a11 = ae[0];
        const a12 = ae[4];
        const a13 = ae[8];
        const a14 = ae[12];

        const a21 = ae[1];
        const a22 = ae[5];
        const a23 = ae[9];
        const a24 = ae[13];

        const a31 = ae[2];
        const a32 = ae[6];
        const a33 = ae[10];
        const a34 = ae[14];

        const a41 = ae[3];
        const a42 = ae[7];
        const a43 = ae[11];
        const a44 = ae[15];

        const b11 = be[0];
        const b12 = be[4];
        const b13 = be[8];
        const b14 = be[12];

        const b21 = be[1];
        const b22 = be[5];
        const b23 = be[9];
        const b24 = be[13];

        const b31 = be[2];
        const b32 = be[6];
        const b33 = be[10];
        const b34 = be[14];

        const b41 = be[3];
        const b42 = be[7];
        const b43 = be[11];
        const b44 = be[15];

        te[0] =
            a11 * b11 +
            a12 * b21 +
            a13 * b31 +
            a14 * b41;

        te[4] =
            a11 * b12 +
            a12 * b22 +
            a13 * b32 +
            a14 * b42;

        te[8] =
            a11 * b13 +
            a12 * b23 +
            a13 * b33 +
            a14 * b43;

        te[12] =
            a11 * b14 +
            a12 * b24 +
            a13 * b34 +
            a14 * b44;

        te[1] =
            a21 * b11 +
            a22 * b21 +
            a23 * b31 +
            a24 * b41;

        te[5] =
            a21 * b12 +
            a22 * b22 +
            a23 * b32 +
            a24 * b42;

        te[9] =
            a21 * b13 +
            a22 * b23 +
            a23 * b33 +
            a24 * b43;

        te[13] =
            a21 * b14 +
            a22 * b24 +
            a23 * b34 +
            a24 * b44;

        te[2] =
            a31 * b11 +
            a32 * b21 +
            a33 * b31 +
            a34 * b41;

        te[6] =
            a31 * b12 +
            a32 * b22 +
            a33 * b32 +
            a34 * b42;

        te[10] =
            a31 * b13 +
            a32 * b23 +
            a33 * b33 +
            a34 * b43;

        te[14] =
            a31 * b14 +
            a32 * b24 +
            a33 * b34 +
            a34 * b44;

        te[3] =
            a41 * b11 +
            a42 * b21 +
            a43 * b31 +
            a44 * b41;

        te[7] =
            a41 * b12 +
            a42 * b22 +
            a43 * b32 +
            a44 * b42;

        te[11] =
            a41 * b13 +
            a42 * b23 +
            a43 * b33 +
            a44 * b43;

        te[15] =
            a41 * b14 +
            a42 * b24 +
            a43 * b34 +
            a44 * b44;

        return this;
    }

    makeTranslation(
        x,
        y,
        z
    ) {
        this.identity();

        this.elements[12] = x;
        this.elements[13] = y;
        this.elements[14] = z;

        return this;
    }

    makeScale(
        x,
        y,
        z
    ) {
        this.identity();

        this.elements[0] = x;
        this.elements[5] = y;
        this.elements[10] = z;

        return this;
    }

    makePerspective(
        fieldOfView,
        aspect,
        near,
        far
    ) {
        const e = this.elements;

        const f =
            1.0 /
            Math.tan(
                (fieldOfView * Math.PI) /
                360.0
            );

        const range =
            1.0 / (near - far);

        e[0] = f / aspect;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = f;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] =
            (far + near) * range;
        e[11] = -1;

        e[12] = 0;
        e[13] = 0;
        e[14] =
            (2 * far * near) * range;
        e[15] = 0;

        return this;
    }

    toFloat32Array() {
        return this.elements;
    }
} 
