/**
 * Thao tác toán học vector định dạng bộ nhớ Float32Array hiệu năng cao
 */
export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.elements = new Float32Array(3);
        this.elements[0] = x;
        this.elements[1] = y;
        this.elements[2] = z;
    }

    get x() { return this.elements[0]; }
    set x(val) { this.elements[0] = val; }
    get y() { return this.elements[1]; }
    set y(val) { this.elements[1] = val; }
    get z() { return this.elements[2]; }
    set z(val) { this.elements[2] = val; }

    set(x, y, z) {
        this.elements[0] = x;
        this.elements[1] = y;
        this.elements[2] = z;
        return this;
    }

    normalize() {
        const x = this.elements[0];
        const y = this.elements[1];
        const z = this.elements[2];
        let len = x * x + y * y + z * z;
        if (len > 0) {
            len = 1.0 / Math.sqrt(len);
            this.elements[0] = x * len;
            this.elements[1] = y * len;
            this.elements[2] = z * len;
        }
        return this;
    }

    cross(v) {
        const ax = this.elements[0], ay = this.elements[1], az = this.elements[2];
        const bx = v.elements[0], by = v.elements[1], bz = v.elements[2];
        this.elements[0] = ay * bz - az * by;
        this.elements[1] = az * bx - ax * bz;
        this.elements[2] = ax * by - ay * bx;
        return this;
    }

    dot(v) {
        return this.elements[0] * v.elements[0] + 
               this.elements[1] * v.elements[1] + 
               this.elements[2] * v.elements[2];
    }
}
 
