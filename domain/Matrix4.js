import Vector3 from "./Vector3.js";

export default class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const e = this.elements;

        e[0] = 1;  e[1] = 0;  e[2] = 0;  e[3] = 0;
        e[4] = 0;  e[5] = 1;  e[6] = 0;  e[7] = 0;
        e[8] = 0;  e[9] = 0;  e[10] = 1; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;

        return this;
    }

    clone() {
        const m = new Matrix4();
        m.elements.set(this.elements);
        return m;
    }

    copy(matrix) {
        this.elements.set(matrix.elements);
        return this;
    }

    multiply(matrix) {
        return this.multiplyMatrices(
            this,
            matrix
        );
    }

    premultiply(matrix) {
        return this.multiplyMatrices(
            matrix,
            this
        );
    }

    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {

                te[col + row * 4] =
                    ae[row * 4 + 0] * be[col + 0] +
                    ae[row * 4 + 1] * be[col + 4] +
                    ae[row * 4 + 2] * be[col + 8] +
                    ae[row * 4 + 3] * be[col + 12];
            }
        }

        return this;
    }

    makeTranslation(x, y, z) {
        this.identity();

        this.elements[12] = x;
        this.elements[13] = y;
        this.elements[14] = z;

        return this;
    }

    makeScale(x, y, z) {
        this.identity();

        this.elements[0] = x;
        this.elements[5] = y;
        this.elements[10] = z;

        return this;
    }

    makeRotationX(rad) {
        this.identity();

        const c = Math.cos(rad);
        const s = Math.sin(rad);

        this.elements[5] = c;
        this.elements[6] = s;
        this.elements[9] = -s;
        this.elements[10] = c;

        return this;
    }

    makeRotationY(rad) {
        this.identity();

        const c = Math.cos(rad);
        const s = Math.sin(rad);

        this.elements[0] = c;
        this.elements[2] = -s;
        this.elements[8] = s;
        this.elements[10] = c;

        return this;
    }

    makeRotationZ(rad) {
        this.identity();

        const c = Math.cos(rad);
        const s = Math.sin(rad);

        this.elements[0] = c;
        this.elements[1] = s;
        this.elements[4] = -s;
        this.elements[5] = c;

        return this;
    }

    makePerspective(
        fov,
        aspect,
        near,
        far
    ) {
        const e = this.elements;

        const f =
            1 / Math.tan(fov * 0.5);

        const nf =
            1 / (near - far);

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
        e[10] = (far + near) * nf;
        e[11] = -1;

        e[12] = 0;
        e[13] = 0;
        e[14] = (2 * far * near) * nf;
        e[15] = 0;

        return this;
    }

    makeLookAt(
        eye,
        target,
        up
    ) {
        const z =
            Vector3.subtract(
                eye,
                target
            ).normalize();

        const x =
            Vector3.cross(
                up,
                z
            ).normalize();

        const y =
            Vector3.cross(
                z,
                x
            ).normalize();

        const e = this.elements;

        e[0] = x.x;
        e[1] = y.x;
        e[2] = z.x;
        e[3] = 0;

        e[4] = x.y;
        e[5] = y.y;
        e[6] = z.y;
        e[7] = 0;

        e[8] = x.z;
        e[9] = y.z;
        e[10] = z.z;
        e[11] = 0;

        e[12] = -x.dot(eye);
        e[13] = -y.dot(eye);
        e[14] = -z.dot(eye);
        e[15] = 1;

        return this;
    }

    transpose() {
        const e = this.elements;

        let tmp;

        tmp = e[1]; e[1] = e[4]; e[4] = tmp;
        tmp = e[2]; e[2] = e[8]; e[8] = tmp;
        tmp = e[3]; e[3] = e[12]; e[12] = tmp;
        tmp = e[6]; e[6] = e[9]; e[9] = tmp;
        tmp = e[7]; e[7] = e[13]; e[13] = tmp;
        tmp = e[11]; e[11] = e[14]; e[14] = tmp;

        return this;
    }

    transformVector3(v) {
        const e = this.elements;

        const x = v.x;
        const y = v.y;
        const z = v.z;

        const nx =
            e[0] * x +
            e[4] * y +
            e[8] * z +
            e[12];

        const ny =
            e[1] * x +
            e[5] * y +
            e[9] * z +
            e[13];

        const nz =
            e[2] * x +
            e[6] * y +
            e[10] * z +
            e[14];

        return new Vector3(
            nx,
            ny,
            nz
        );
    }

    toFloat32Array() {
        return this.elements;
    }

    static identity() {
        return new Matrix4();
    }

    static perspective(
        fov,
        aspect,
        near,
        far
    ) {
        return new Matrix4()
            .makePerspective(
                fov,
                aspect,
                near,
                far
            );
    }

    static lookAt(
        eye,
        target,
        up
    ) {
        return new Matrix4()
            .makeLookAt(
                eye,
                target,
                up
            );
    }

    static translation(
        x,
        y,
        z
    ) {
        return new Matrix4()
            .makeTranslation(
                x,
                y,
                z
            );
    }

    static rotationX(rad) {
        return new Matrix4()
            .makeRotationX(rad);
    }

    static rotationY(rad) {
        return new Matrix4()
            .makeRotationY(rad);
    }

    static rotationZ(rad) {
        return new Matrix4()
            .makeRotationZ(rad);
    }

    static scale(
        x,
        y,
        z
    ) {
        return new Matrix4()
            .makeScale(
                x,
                y,
                z
            );
    }
} 
