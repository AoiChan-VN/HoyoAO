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
        this.elements.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        return this;
    }

    // Tạo ma trận phối cảnh (Perspective Matrix) mô phỏng tiêu cự mắt người (VR)
    static perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan((fov * Math.PI) / 360);
        const rangeInv = 1.0 / (near - far);
        const out = new Matrix4();
        out.elements[0] = f / aspect;
        out.elements[5] = f;
        out.elements[10] = (near + far) * rangeInv;
        out.elements[11] = -1;
        out.elements[14] = (2 * near * far) * rangeInv;
        out.elements[15] = 0;
        return out;
    }
}
 
