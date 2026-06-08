export default class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x);
        this.y = Number(y);
        this.z = Number(z);
    }

    static zero() {
        return new Vector3(0, 0, 0);
    }

    static one() {
        return new Vector3(1, 1, 1);
    }

    static up() {
        return new Vector3(0, 1, 0);
    }

    static down() {
        return new Vector3(0, -1, 0);
    }

    static left() {
        return new Vector3(-1, 0, 0);
    }

    static right() {
        return new Vector3(1, 0, 0);
    }

    static forward() {
        return new Vector3(0, 0, -1);
    }

    static backward() {
        return new Vector3(0, 0, 1);
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    set(x, y, z) {
        this.x = Number(x);
        this.y = Number(y);
        this.z = Number(z);
        return this;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    divideScalar(s) {
        if (s === 0) {
            throw new Error("Division by zero.");
        }

        this.x /= s;
        this.y /= s;
        this.z /= s;

        return this;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    lengthSquared() {
        return (
            this.x * this.x +
            this.y * this.y +
            this.z * this.z
        );
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    normalize() {
        const len = this.length();

        if (len > 0) {
            this.divideScalar(len);
        }

        return this;
    }

    distanceSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;

        return dx * dx + dy * dy + dz * dz;
    }

    distance(v) {
        return Math.sqrt(this.distanceSquared(v));
    }

    dot(v) {
        return (
            this.x * v.x +
            this.y * v.y +
            this.z * v.z
        );
    }

    cross(v) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;

        return new Vector3(x, y, z);
    }

    angleTo(v) {
        const denominator =
            this.length() * v.length();

        if (denominator === 0) {
            return 0;
        }

        const theta =
            this.dot(v) / denominator;

        return Math.acos(
            Math.max(-1, Math.min(1, theta))
        );
    }

    lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;

        return this;
    }

    equals(v, epsilon = 1e-6) {
        return (
            Math.abs(this.x - v.x) < epsilon &&
            Math.abs(this.y - v.y) < epsilon &&
            Math.abs(this.z - v.z) < epsilon
        );
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    fromArray(arr) {
        this.x = arr[0] ?? 0;
        this.y = arr[1] ?? 0;
        this.z = arr[2] ?? 0;
        return this;
    }

    static add(a, b) {
        return a.clone().add(b);
    }

    static subtract(a, b) {
        return a.clone().subtract(b);
    }

    static multiplyScalar(v, scalar) {
        return v.clone().multiplyScalar(scalar);
    }

    static normalize(v) {
        return v.clone().normalize();
    }

    static dot(a, b) {
        return a.dot(b);
    }

    static cross(a, b) {
        return a.cross(b);
    }

    static distance(a, b) {
        return a.distance(b);
    }

    static lerp(a, b, alpha) {
        return a.clone().lerp(b, alpha);
    }
    }
