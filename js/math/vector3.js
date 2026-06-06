// ./js/math/vector3.js

export class Vector3 {
    constructor(
        x = 0,
        y = 0,
        z = 0
    ) {
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

    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;

        return this;
    }

    clone() {
        return new Vector3(
            this.x,
            this.y,
            this.z
        );
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;

        return this;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;

        return this;
    }

    multiplyScalar(value) {
        this.x *= value;
        this.y *= value;
        this.z *= value;

        return this;
    }

    divideScalar(value) {
        if (value === 0) {
            throw new Error(
                '[VECTOR3] Division by zero.'
            );
        }

        this.x /= value;
        this.y /= value;
        this.z /= value;

        return this;
    }

    dot(vector) {
        return (
            this.x * vector.x +
            this.y * vector.y +
            this.z * vector.z
        );
    }

    cross(vector) {
        const x =
            this.y * vector.z -
            this.z * vector.y;

        const y =
            this.z * vector.x -
            this.x * vector.z;

        const z =
            this.x * vector.y -
            this.y * vector.x;

        this.x = x;
        this.y = y;
        this.z = z;

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
        return Math.sqrt(
            this.lengthSquared()
        );
    }

    normalize() {
        const magnitude =
            this.length();

        if (magnitude === 0) {
            return this;
        }

        return this.divideScalar(
            magnitude
        );
    }

    distanceTo(vector) {
        const dx =
            this.x - vector.x;

        const dy =
            this.y - vector.y;

        const dz =
            this.z - vector.z;

        return Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );
    }

    equals(vector) {
        return (
            this.x === vector.x &&
            this.y === vector.y &&
            this.z === vector.z
        );
    }

    toArray() {
        return [
            this.x,
            this.y,
            this.z
        ];
    }

    fromArray(array) {
        this.x = array[0] ?? 0;
        this.y = array[1] ?? 0;
        this.z = array[2] ?? 0;

        return this;
    }

    static add(a, b) {
        return new Vector3(
            a.x + b.x,
            a.y + b.y,
            a.z + b.z
        );
    }

    static subtract(a, b) {
        return new Vector3(
            a.x - b.x,
            a.y - b.y,
            a.z - b.z
        );
    }

    static dot(a, b) {
        return (
            a.x * b.x +
            a.y * b.y +
            a.z * b.z
        );
    }

    static cross(a, b) {
        return new Vector3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    static distance(a, b) {
        return a.distanceTo(b);
    }
} 
