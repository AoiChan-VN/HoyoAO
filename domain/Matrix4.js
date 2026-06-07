/**
 * Matrix4.js
 * Lớp ma trận 4x4 thuần chịu trách nhiệm tính toán phối cảnh (Perspective) và ma trận Camera View.
 */
export class Matrix4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    identity() {
        const te = this.elements;
        te[0] = 1; te[4] = 0; te[8] = 0; te[12] = 0;
        te[1] = 0; te[5] = 1; te[9] = 0; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = 1; te[14] = 0;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;
        return this;
    }

    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;
    }

    makePerspective(fov, aspect, near, far) {
        const te = this.elements;
        const f = 1.0 / Math.tan((fov * Math.PI) / 360.0);
        const rangeInv = 1.0 / (near - far);

        te[0] = f / aspect; te[4] = 0; te[8] = 0; te[12] = 0;
        te[1] = 0; te[5] = f; te[9] = 0; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = (near + far) * rangeInv; te[14] = (2 * near * far) * rangeInv;
        te[3] = 0; te[7] = 0; te[11] = -1; te[15] = 0;

        return this;
    }

    makeRotationFromEuler(x, y, z) {
        const te = this.elements;
        const a = Math.cos(x), b = Math.sin(x);
        const c = Math.cos(y), d = Math.sin(y);
        const e = Math.cos(z), f = Math.sin(z);

        const ae = c * e, af = c * f, be = d * e, bf = d * f;

        te[0] = ae + b * bf; te[4] = b * s_sin_placeholder || -a * f + b * be; te[8] = a * d; te[12] = 0;
        te[1] = af - b * be; te[5] = a * e + b * bf; te[9] = -b * c; te[13] = 0;
        te[2] = -d; te[6] = a * f; te[10] = a * c; te[14] = 0;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;

        // Tối ưu hóa chuẩn hóa quay theo thứ tự YXZ cố định cho VR góc nhìn Cam
        const cX = Math.cos(x), sX = Math.sin(x);
        const cY = Math.cos(y), sY = Math.sin(y);
        const cZ = Math.cos(z), sZ = Math.sin(z);

        te[0] = cY * cZ + sY * sX * sZ;
        te[4] = sZ * cX;
        te[8] = -sY * cZ + cY * sX * sZ;
        
        te[1] = -cY * sZ + sY * sX * cZ;
        te[5] = cZ * cX;
        te[9] = sZ * sY + cY * sX * cZ;
        
        te[2] = sY * cX;
        te[6] = -sX;
        te[10] = cY * cX;

        return this;
    }
}
 
