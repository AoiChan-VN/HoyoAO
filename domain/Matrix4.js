/**
 * Matrix4.js
 * Lớp ma trận 4x4 thuần chịu trách nhiệm tính toán phối cảnh (Perspective) và ma trận Camera View.
 */
export class Matrix4 {
    constructor() {
        // Khởi tạo mảng Float32Array có độ dài chuẩn 16 phần tử cho ma trận 4x4
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const te = this.elements;
        te[0] = 1; te[4] = 0; te[8] = 0; te[12] = 0;
        te[1] = 0; te[5] = 1; te[9] = 0; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = 1; te[14] = 0;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;
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
        // Chuẩn hóa hệ trục quay YXZ
        const cX = Math.cos(x), sX = Math.sin(x);
        const cY = Math.cos(y), sY = Math.sin(y);
        const cZ = Math.cos(z), sZ = Math.sin(z);

        te[0] = cY * cZ + sY * sX * sZ;
        te[1] = sZ * cX;
        te[2] = -sY * cZ + cY * sX * sZ;
        te[3] = 0;
        
        te[4] = -cY * sZ + sY * sX * cZ;
        te[5] = cZ * cX;
        te[6] = sZ * sY + cY * sX * cZ;
        te[7] = 0;
        
        te[8] = sY * cX;
        te[9] = -sX;
        te[10] = cY * cX;
        te[11] = 0;

        te[12] = 0; te[13] = 0; te[14] = 0; te[15] = 1;

        return this;
    }
}
