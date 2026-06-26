export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    addScalar(s) {
        this.x += s;
        this.y += s;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    subScalar(s) {
        this.x -= s;
        this.y -= s;
        return this;
    }

    mul(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    mulScalar(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    div(v) {
        this.x /= v.x;
        this.y /= v.y;
        return this;
    }

    divScalar(s) {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
        } else {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    length() {
        return Math.sqrt(this.lengthSq());
    }

    normalize() {
        return this.divScalar(this.length());
    }

    distanceTo(v) {
        return Math.sqrt(this.distanceToSq(v));
    }

    distanceToSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    }

    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        return this;
    }

    clampScalar(minVal, maxVal) {
        this.x = Math.max(minVal, Math.min(maxVal, this.x));
        this.y = Math.max(minVal, Math.min(maxVal, this.y));
        return this;
    }

    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    angleTo(v) {
        const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
        if (denominator === 0) return Math.PI / 2;
        const theta = this.dot(v) / denominator;
        return Math.acos(Math.max(-1, Math.min(1, theta)));
    }

    rotateAround(center, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = this.x - center.x;
        const y = this.y - center.y;
        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;
        return this;
    }

    equals(v) {
        return this.x === v.x && this.y === v.y;
    }

    fromArray(arr, offset = 0) {
        this.x = arr[offset];
        this.y = arr[offset + 1];
        return this;
    }

    toArray(arr = [], offset = 0) {
        arr[offset] = this.x;
        arr[offset + 1] = this.y;
        return arr;
    }

    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    static sub(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceSq(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
} 
