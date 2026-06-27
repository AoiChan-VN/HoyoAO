export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    zero() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        return this;
    }

    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    subScalar(s) {
        this.x -= s;
        this.y -= s;
        this.z -= s;
        return this;
    }

    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    }

    mul(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    mulScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    div(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }

    divScalar(s) {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
            this.z /= s;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        return this;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = v.x,   by = v.y,   bz = v.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    }

    crossVectors(a, b) {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length() {
        return Math.sqrt(this.lengthSq());
    }

    manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }

    normalize() {
        return this.divScalar(this.length());
    }

    setLength(length) {
        return this.normalize().mulScalar(length);
    }

    distanceTo(v) {
        return Math.sqrt(this.distanceToSq(v));
    }

    distanceToSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }

    manhattanDistanceTo(v) {
        return (
            Math.abs(this.x - v.x) +
            Math.abs(this.y - v.y) +
            Math.abs(this.z - v.z)
        );
    }

    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;
        return this;
    }

    lerpVectors(a, b, t) {
        this.x = a.x + (b.x - a.x) * t;
        this.y = a.y + (b.y - a.y) * t;
        this.z = a.z + (b.z - a.z) * t;
        return this;
    }

    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));
        return this;
    }

    clampScalar(minVal, maxVal) {
        this.x = Math.max(minVal, Math.min(maxVal, this.x));
        this.y = Math.max(minVal, Math.min(maxVal, this.y));
        this.z = Math.max(minVal, Math.min(maxVal, this.z));
        return this;
    }

    clampLength(min, max) {
        const len = this.length();
        if (len === 0) return this;
        return this.divScalar(len).mulScalar(Math.max(min, Math.min(max, len)));
    }

    min(v) {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        this.z = Math.min(this.z, v.z);
        return this;
    }

    max(v) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        this.z = Math.max(this.z, v.z);
        return this;
    }

    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        return this;
    }

    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }

    angleTo(v) {
        const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
        if (denominator === 0) return Math.PI / 2;
        const theta = this.dot(v) / denominator;
        return Math.acos(Math.max(-1, Math.min(1, theta)));
    }

    projectOnVector(v) {
        const denominator = v.lengthSq();
        if (denominator === 0) return this.zero();
        const scalar = v.dot(this) / denominator;
        this.x = v.x * scalar;
        this.y = v.y * scalar;
        this.z = v.z * scalar;
        return this;
    }

    projectOnPlane(planeNormal) {
        const denominator = planeNormal.lengthSq();
        if (denominator === 0) return this;
        const scalar = this.dot(planeNormal) / denominator;
        this.x -= planeNormal.x * scalar;
        this.y -= planeNormal.y * scalar;
        this.z -= planeNormal.z * scalar;
        return this;
    }

    reflect(normal) {
        const scalar = 2 * this.dot(normal);
        this.x -= scalar * normal.x;
        this.y -= scalar * normal.y;
        this.z -= scalar * normal.z;
        return this;
    }

    applyMatrix4(m) {
        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;
        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        this.x = (e[0] * x + e[4] * y + e[8]  * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9]  * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        return this;
    }

    transformDirection(m) {
        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;
        this.x = e[0] * x + e[4] * y + e[8]  * z;
        this.y = e[1] * x + e[5] * y + e[9]  * z;
        this.z = e[2] * x + e[6] * y + e[10] * z;
        return this.normalize();
    }

    applyQuaternion(q) {
        const vx = this.x, vy = this.y, vz = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        const ix =  qw * vx + qy * vz - qz * vy;
        const iy =  qw * vy + qz * vx - qx * vz;
        const iz =  qw * vz + qx * vy - qy * vx;
        const iw = -qx * vx - qy * vy - qz * vz;
        this.x = ix * qw + iw * (-qx) + iy * (-qz) - iz * (-qy);
        this.y = iy * qw + iw * (-qy) + iz * (-qx) - ix * (-qz);
        this.z = iz * qw + iw * (-qz) + ix * (-qy) - iy * (-qx);
        return this;
    }

    setFromSpherical(phi, theta, radius = 1) {
        const sinPhiRadius = Math.sin(phi) * radius;
        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);
        return this;
    }

    setFromCylindrical(theta, y, radius = 1) {
        this.x = radius * Math.sin(theta);
        this.y = y;
        this.z = radius * Math.cos(theta);
        return this;
    }

    setFromMatrixColumn(m, index) {
        return this.fromArray(m.elements, index * 4);
    }

    setFromMatrixPosition(m) {
        const e = m.elements;
        this.x = e[12];
        this.y = e[13];
        this.z = e[14];
        return this;
    }

    equals(v) {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    fromArray(arr, offset = 0) {
        this.x = arr[offset];
        this.y = arr[offset + 1];
        this.z = arr[offset + 2];
        return this;
    }

    toArray(arr = [], offset = 0) {
        arr[offset]     = this.x;
        arr[offset + 1] = this.y;
        arr[offset + 2] = this.z;
        return arr;
    }

    static add(a, b) {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    static sub(a, b) {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    static cross(a, b) {
        return new Vector3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    static lerp(a, b, t) {
        return new Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static distanceSq(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return dx * dx + dy * dy + dz * dz;
    }
}
