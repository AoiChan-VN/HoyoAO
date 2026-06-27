import { Vector3 } from './vector3.js';

export class Matrix4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
        const te = this.elements;
        te[0]  = n11; te[4]  = n12; te[8]  = n13; te[12] = n14;
        te[1]  = n21; te[5]  = n22; te[9]  = n23; te[13] = n24;
        te[2]  = n31; te[6]  = n32; te[10] = n33; te[14] = n34;
        te[3]  = n41; te[7]  = n42; te[11] = n43; te[15] = n44;
        return this;
    }

    identity() {
        return this.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }

    copy(m) {
        this.elements.set(m.elements);
        return this;
    }

    clone() {
        return new Matrix4().copy(this);
    }

    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        const a11 = ae[0],  a21 = ae[1],  a31 = ae[2],  a41 = ae[3];
        const a12 = ae[4],  a22 = ae[5],  a32 = ae[6],  a42 = ae[7];
        const a13 = ae[8],  a23 = ae[9],  a33 = ae[10], a43 = ae[11];
        const a14 = ae[12], a24 = ae[13], a34 = ae[14], a44 = ae[15];

        const b11 = be[0],  b21 = be[1],  b31 = be[2],  b41 = be[3];
        const b12 = be[4],  b22 = be[5],  b32 = be[6],  b42 = be[7];
        const b13 = be[8],  b23 = be[9],  b33 = be[10], b43 = be[11];
        const b14 = be[12], b24 = be[13], b34 = be[14], b44 = be[15];

        te[0]  = a11*b11 + a12*b21 + a13*b31 + a14*b41;
        te[4]  = a11*b12 + a12*b22 + a13*b32 + a14*b42;
        te[8]  = a11*b13 + a12*b23 + a13*b33 + a14*b43;
        te[12] = a11*b14 + a12*b24 + a13*b34 + a14*b44;

        te[1]  = a21*b11 + a22*b21 + a23*b31 + a24*b41;
        te[5]  = a21*b12 + a22*b22 + a23*b32 + a24*b42;
        te[9]  = a21*b13 + a22*b23 + a23*b33 + a24*b43;
        te[13] = a21*b14 + a22*b24 + a23*b34 + a24*b44;

        te[2]  = a31*b11 + a32*b21 + a33*b31 + a34*b41;
        te[6]  = a31*b12 + a32*b22 + a33*b32 + a34*b42;
        te[10] = a31*b13 + a32*b23 + a33*b33 + a34*b43;
        te[14] = a31*b14 + a32*b24 + a33*b34 + a34*b44;

        te[3]  = a41*b11 + a42*b21 + a43*b31 + a44*b41;
        te[7]  = a41*b12 + a42*b22 + a43*b32 + a44*b42;
        te[11] = a41*b13 + a42*b23 + a43*b33 + a44*b43;
        te[15] = a41*b14 + a42*b24 + a43*b34 + a44*b44;

        return this;
    }

    multiply(m) {
        return this.multiplyMatrices(this, m);
    }

    premultiply(m) {
        return this.multiplyMatrices(m, this);
    }

    multiplyScalar(s) {
        const te = this.elements;
        te[0] *= s;  te[4] *= s;  te[8]  *= s;  te[12] *= s;
        te[1] *= s;  te[5] *= s;  te[9]  *= s;  te[13] *= s;
        te[2] *= s;  te[6] *= s;  te[10] *= s;  te[14] *= s;
        te[3] *= s;  te[7] *= s;  te[11] *= s;  te[15] *= s;
        return this;
    }

    determinant() {
        const te = this.elements;
        const n11 = te[0],  n21 = te[1],  n31 = te[2],  n41 = te[3];
        const n12 = te[4],  n22 = te[5],  n32 = te[6],  n42 = te[7];
        const n13 = te[8],  n23 = te[9],  n33 = te[10], n43 = te[11];
        const n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15];

        return (
            n41 * (
                +n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33
                +n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34
            ) +
            n42 * (
                +n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33
                -n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31
            ) +
            n43 * (
                +n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32
                +n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31
            ) +
            n44 * (
                -n13 * n22 * n31 + n12 * n23 * n31 + n13 * n21 * n32
                -n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33
            )
        );
    }

    transpose() {
        const te = this.elements;
        let tmp;
        tmp = te[1];  te[1]  = te[4];  te[4]  = tmp;
        tmp = te[2];  te[2]  = te[8];  te[8]  = tmp;
        tmp = te[3];  te[3]  = te[12]; te[12] = tmp;
        tmp = te[6];  te[6]  = te[9];  te[9]  = tmp;
        tmp = te[7];  te[7]  = te[13]; te[13] = tmp;
        tmp = te[11]; te[11] = te[14]; te[14] = tmp;
        return this;
    }

    invert() {
        const te = this.elements;
        const n11 = te[0],  n21 = te[1],  n31 = te[2],  n41 = te[3];
        const n12 = te[4],  n22 = te[5],  n32 = te[6],  n42 = te[7];
        const n13 = te[8],  n23 = te[9],  n33 = te[10], n43 = te[11];
        const n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15];

        const c00 =  n22*(n33*n44-n34*n43) - n23*(n32*n44-n34*n42) + n24*(n32*n43-n33*n42);
        const c10 = -(n12*(n33*n44-n34*n43) - n13*(n32*n44-n34*n42) + n14*(n32*n43-n33*n42));
        const c20 =  n12*(n23*n44-n24*n43) - n13*(n22*n44-n24*n42) + n14*(n22*n43-n23*n42);
        const c30 = -(n12*(n23*n34-n24*n33) - n13*(n22*n34-n24*n32) + n14*(n22*n33-n23*n32));

        const det = n11*c00 + n21*c10 + n31*c20 + n41*c30;
        if (det === 0) return this.identity();
        const invDet = 1 / det;

        te[0]  = c00 * invDet;
        te[1]  = -(n21*(n33*n44-n34*n43) - n23*(n31*n44-n34*n41) + n24*(n31*n43-n33*n41)) * invDet;
        te[2]  =  (n21*(n32*n44-n34*n42) - n22*(n31*n44-n34*n41) + n24*(n31*n42-n32*n41)) * invDet;
        te[3]  = -(n21*(n32*n43-n33*n42) - n22*(n31*n43-n33*n41) + n23*(n31*n42-n32*n41)) * invDet;

        te[4]  = c10 * invDet;
        te[5]  =  (n11*(n33*n44-n34*n43) - n13*(n31*n44-n34*n41) + n14*(n31*n43-n33*n41)) * invDet;
        te[6]  = -(n11*(n32*n44-n34*n42) - n12*(n31*n44-n34*n41) + n14*(n31*n42-n32*n41)) * invDet;
        te[7]  =  (n11*(n32*n43-n33*n42) - n12*(n31*n43-n33*n41) + n13*(n31*n42-n32*n41)) * invDet;

        te[8]  = c20 * invDet;
        te[9]  = -(n11*(n23*n44-n24*n43) - n13*(n21*n44-n24*n41) + n14*(n21*n43-n23*n41)) * invDet;
        te[10] =  (n11*(n22*n44-n24*n42) - n12*(n21*n44-n24*n41) + n14*(n21*n42-n22*n41)) * invDet;
        te[11] = -(n11*(n22*n43-n23*n42) - n12*(n21*n43-n23*n41) + n13*(n21*n42-n22*n41)) * invDet;

        te[12] = c30 * invDet;
        te[13] =  (n11*(n23*n34-n24*n33) - n13*(n21*n34-n24*n31) + n14*(n21*n33-n23*n31)) * invDet;
        te[14] = -(n11*(n22*n34-n24*n32) - n12*(n21*n34-n24*n31) + n14*(n21*n32-n22*n31)) * invDet;
        te[15] =  (n11*(n22*n33-n23*n32) - n12*(n21*n33-n23*n31) + n13*(n21*n32-n22*n31)) * invDet;

        return this;
    }

    compose(position, quaternion, scale) {
        const te = this.elements;
        const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x*x2, xy = x*y2, xz = x*z2;
        const yy = y*y2, yz = y*z2, zz = z*z2;
        const wx = w*x2, wy = w*y2, wz = w*z2;
        const sx = scale.x, sy = scale.y, sz = scale.z;

        te[0]  = (1 - (yy+zz)) * sx;
        te[1]  = (xy + wz)     * sx;
        te[2]  = (xz - wy)     * sx;
        te[3]  = 0;

        te[4]  = (xy - wz)     * sy;
        te[5]  = (1 - (xx+zz)) * sy;
        te[6]  = (yz + wx)     * sy;
        te[7]  = 0;

        te[8]  = (xz + wy)     * sz;
        te[9]  = (yz - wx)     * sz;
        te[10] = (1 - (xx+yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return this;
    }

    decompose(position, quaternion, scale) {
        const te = this.elements;
        let sx = Math.sqrt(te[0]*te[0] + te[1]*te[1] + te[2]*te[2]);
        const sy = Math.sqrt(te[4]*te[4] + te[5]*te[5] + te[6]*te[6]);
        const sz = Math.sqrt(te[8]*te[8] + te[9]*te[9] + te[10]*te[10]);

        if (this.determinant() < 0) sx = -sx;

        position.x = te[12];
        position.y = te[13];
        position.z = te[14];

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        const m = new Matrix4();
        const me = m.elements;
        me[0]  = te[0]*invSX; me[4]  = te[4]*invSY; me[8]  = te[8]*invSZ;  me[12] = 0;
        me[1]  = te[1]*invSX; me[5]  = te[5]*invSY; me[9]  = te[9]*invSZ;  me[13] = 0;
        me[2]  = te[2]*invSX; me[6]  = te[6]*invSY; me[10] = te[10]*invSZ; me[14] = 0;
        me[3]  = 0;           me[7]  = 0;           me[11] = 0;            me[15] = 1;

        quaternion.setFromRotationMatrix(m);

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return this;
    }

    makeTranslation(x, y, z) {
        return this.set(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        );
    }

    makeScale(x, y, z) {
        return this.set(
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        );
    }

    makeRotationX(theta) {
        const c = Math.cos(theta), s = Math.sin(theta);
        return this.set(
            1,  0, 0, 0,
            0,  c, -s, 0,
            0,  s,  c, 0,
            0,  0,  0, 1
        );
    }

    makeRotationY(theta) {
        const c = Math.cos(theta), s = Math.sin(theta);
        return this.set(
             c, 0, s, 0,
             0, 1, 0, 0,
            -s, 0, c, 0,
             0, 0, 0, 1
        );
    }

    makeRotationZ(theta) {
        const c = Math.cos(theta), s = Math.sin(theta);
        return this.set(
            c, -s, 0, 0,
            s,  c, 0, 0,
            0,  0, 1, 0,
            0,  0, 0, 1
        );
    }

    makeRotationAxis(axis, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x, y = axis.y, z = axis.z;
        const tx = t * x, ty = t * y;
        return this.set(
            tx*x + c,     tx*y - s*z,   tx*z + s*y,   0,
            tx*y + s*z,   ty*y + c,     ty*z - s*x,   0,
            tx*z - s*y,   ty*z + s*x,   t*z*z + c,    0,
            0,            0,            0,            1
        );
    }

    makeRotationFromQuaternion(q) {
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const x2 = x+x, y2 = y+y, z2 = z+z;
        const xx = x*x2, xy = x*y2, xz = x*z2;
        const yy = y*y2, yz = y*z2, zz = z*z2;
        const wx = w*x2, wy = w*y2, wz = w*z2;
        const te = this.elements;
        te[0] = 1-(yy+zz); te[4] = xy-wz;      te[8]  = xz+wy;      te[12] = 0;
        te[1] = xy+wz;     te[5] = 1-(xx+zz);  te[9]  = yz-wx;      te[13] = 0;
        te[2] = xz-wy;     te[6] = yz+wx;      te[10] = 1-(xx+yy);  te[14] = 0;
        te[3] = 0;         te[7] = 0;          te[11] = 0;           te[15] = 1;
        return this;
    }

    makePerspective(left, right, top, bottom, near, far) {
        const te = this.elements;
        const x =  2 * near / (right - left);
        const y =  2 * near / (top - bottom);
        const a =  (right + left) / (right - left);
        const b =  (top + bottom) / (top - bottom);
        const c = -(far + near)   / (far - near);
        const d = -2 * far * near / (far - near);
        te[0]  = x;  te[4] = 0;  te[8]  = a;   te[12] = 0;
        te[1]  = 0;  te[5] = y;  te[9]  = b;   te[13] = 0;
        te[2]  = 0;  te[6] = 0;  te[10] = c;   te[14] = d;
        te[3]  = 0;  te[7] = 0;  te[11] = -1;  te[15] = 0;
        return this;
    }

    makeOrthographic(left, right, top, bottom, near, far) {
        const te = this.elements;
        const w = 1 / (right - left);
        const h = 1 / (top - bottom);
        const p = 1 / (far - near);
        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = (far + near)   * p;
        te[0]  = 2*w;  te[4] = 0;    te[8]  = 0;     te[12] = -x;
        te[1]  = 0;    te[5] = 2*h;  te[9]  = 0;     te[13] = -y;
        te[2]  = 0;    te[6] = 0;    te[10] = -2*p;  te[14] = -z;
        te[3]  = 0;    te[7] = 0;    te[11] = 0;     te[15] = 1;
        return this;
    }

    makeLookAt(eye, target, up) {
        const te = this.elements;
        const z = new Vector3().subVectors(eye, target);
        if (z.lengthSq() === 0) z.z = 1;
        z.normalize();
        const x = new Vector3().crossVectors(up, z);
        if (x.lengthSq() === 0) {
            if (Math.abs(up.z) === 1) {
                z.x += 0.0001;
            } else {
                z.z += 0.0001;
            }
            z.normalize();
            x.crossVectors(up, z);
        }
        x.normalize();
        const y = new Vector3().crossVectors(z, x);
        te[0] = x.x; te[4] = y.x; te[8]  = z.x;
        te[1] = x.y; te[5] = y.y; te[9]  = z.y;
        te[2] = x.z; te[6] = y.z; te[10] = z.z;
        return this;
    }

    makeShear(xy, xz, yx, yz, zx, zy) {
        return this.set(
            1,  yx, zx, 0,
            xy, 1,  zy, 0,
            xz, yz, 1,  0,
            0,  0,  0,  1
        );
    }

    setPosition(x, y, z) {
        const te = this.elements;
        if (typeof x === 'object') {
            te[12] = x.x;
            te[13] = x.y;
            te[14] = x.z;
        } else {
            te[12] = x;
            te[13] = y;
            te[14] = z;
        }
        return this;
    }

    getMaxScaleOnAxis() {
        const te = this.elements;
        const scaleXSq = te[0]*te[0] + te[1]*te[1] + te[2]*te[2];
        const scaleYSq = te[4]*te[4] + te[5]*te[5] + te[6]*te[6];
        const scaleZSq = te[8]*te[8] + te[9]*te[9] + te[10]*te[10];
        return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
    }

    extractBasis(xAxis, yAxis, zAxis) {
        xAxis.setFromMatrixColumn(this, 0);
        yAxis.setFromMatrixColumn(this, 1);
        zAxis.setFromMatrixColumn(this, 2);
        return this;
    }

    makeBasis(xAxis, yAxis, zAxis) {
        return this.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0,       0,       0,       1
        );
    }

    extractRotation(m) {
        const te = this.elements;
        const me = m.elements;
        const invSX = 1 / Math.sqrt(me[0]*me[0] + me[1]*me[1] + me[2]*me[2]);
        const invSY = 1 / Math.sqrt(me[4]*me[4] + me[5]*me[5] + me[6]*me[6]);
        const invSZ = 1 / Math.sqrt(me[8]*me[8] + me[9]*me[9] + me[10]*me[10]);
        te[0]  = me[0]*invSX; te[4]  = me[4]*invSY; te[8]  = me[8]*invSZ;  te[12] = 0;
        te[1]  = me[1]*invSX; te[5]  = me[5]*invSY; te[9]  = me[9]*invSZ;  te[13] = 0;
        te[2]  = me[2]*invSX; te[6]  = me[6]*invSY; te[10] = me[10]*invSZ; te[14] = 0;
        te[3]  = 0;           te[7]  = 0;           te[11] = 0;            te[15] = 1;
        return this;
    }

    equals(m) {
        const te = this.elements;
        const me = m.elements;
        for (let i = 0; i < 16; i++) {
            if (te[i] !== me[i]) return false;
        }
        return true;
    }

    fromArray(arr, offset = 0) {
        for (let i = 0; i < 16; i++) {
            this.elements[i] = arr[i + offset];
        }
        return this;
    }

    toArray(arr = [], offset = 0) {
        const te = this.elements;
        for (let i = 0; i < 16; i++) {
            arr[offset + i] = te[i];
        }
        return arr;
    }
} 
