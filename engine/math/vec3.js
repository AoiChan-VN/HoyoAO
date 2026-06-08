export class Vec3 {

    constructor(
        x = 0,
        y = 0,
        z = 0
    ) {

        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(
        x,
        y,
        z
    ) {

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

        return new Vec3(
            this.x,
            this.y,
            this.z
        );
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

    multiplyScalar(s) {

        this.x *= s;
        this.y *= s;
        this.z *= s;

        return this;
    }

    divideScalar(s) {

        if (s === 0) {

            throw new Error(
                'Division by zero.'
            );
        }

        const inv = 1 / s;

        this.x *= inv;
        this.y *= inv;
        this.z *= inv;

        return this;
    }

    dot(v) {

        return (
            this.x * v.x +
            this.y * v.y +
            this.z * v.z
        );
    }

    cross(v) {

        const x =
            this.y * v.z -
            this.z * v.y;

        const y =
            this.z * v.x -
            this.x * v.z;

        const z =
            this.x * v.y -
            this.y * v.x;

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

        const len =
            this.length();

        if (len === 0) {

            this.x = 0;
            this.y = 0;
            this.z = 0;

            return this;
        }

        return this.divideScalar(
            len
        );
    }

    distanceSquared(v) {

        const dx =
            this.x - v.x;

        const dy =
            this.y - v.y;

        const dz =
            this.z - v.z;

        return (
            dx * dx +
            dy * dy +
            dz * dz
        );
    }

    distance(v) {

        return Math.sqrt(
            this.distanceSquared(v)
        );
    }

    lerp(
        target,
        alpha
    ) {

        this.x +=
            (
                target.x -
                this.x
            ) * alpha;

        this.y +=
            (
                target.y -
                this.y
            ) * alpha;

        this.z +=
            (
                target.z -
                this.z
            ) * alpha;

        return this;
    }

    equals(v) {

        return (
            this.x === v.x &&
            this.y === v.y &&
            this.z === v.z
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

        this.x = array[0] || 0;
        this.y = array[1] || 0;
        this.z = array[2] || 0;

        return this;
    }

    zero() {

        this.x = 0;
        this.y = 0;
        this.z = 0;

        return this;
    }

    negate() {

        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;

        return this;
    }

    static add(
        a,
        b
    ) {

        return new Vec3(
            a.x + b.x,
            a.y + b.y,
            a.z + b.z
        );
    }

    static subtract(
        a,
        b
    ) {

        return new Vec3(
            a.x - b.x,
            a.y - b.y,
            a.z - b.z
        );
    }

    static cross(
        a,
        b
    ) {

        return new Vec3(
            a.y * b.z -
            a.z * b.y,

            a.z * b.x -
            a.x * b.z,

            a.x * b.y -
            a.y * b.x
        );
    }

    static dot(
        a,
        b
    ) {

        return (
            a.x * b.x +
            a.y * b.y +
            a.z * b.z
        );
    }

    static lerp(
        a,
        b,
        alpha
    ) {

        return new Vec3(
            a.x +
                (
                    b.x -
                    a.x
                ) * alpha,

            a.y +
                (
                    b.y -
                    a.y
                ) * alpha,

            a.z +
                (
                    b.z -
                    a.z
                ) * alpha
        );
    }

    static zero() {

        return new Vec3(
            0,
            0,
            0
        );
    }

    static one() {

        return new Vec3(
            1,
            1,
            1
        );
    }
} 
