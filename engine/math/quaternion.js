export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    copy(q) {
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;
        return this;
    }

    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    identity() {
        return this.set(0, 0, 0, 1);
    }

    multiplyQuaternions(a, b) {
        const ax = a.x, ay = a.y, az = a.z, aw = a.w;
        const bx = b.x, by = b.y, bz = b.z, bw = b.w;
        this.x = ax * bw + aw * bx + ay * bz - az * by;
        this.y = ay * bw + aw * by + az * bx - ax * bz;
        this.z = az * bw + aw * bz + ax * by - ay * bx;
        this.w = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    multiply(q) {
        return this.multiplyQuaternions(this, q);
    }

    premultiply(q) {
        return this.multiplyQuaternions(q, this);
    }

    dot(q) {
        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    length() {
        return Math.sqrt(this.lengthSq());
    }

    normalize() {
        let l = this.length();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }

    conjugate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    invert() {
        const lenSq = this.lengthSq();
        if (lenSq === 0) return this;
        const invLenSq = 1 / lenSq;
        this.x = -this.x * invLenSq;
        this.y = -this.y * invLenSq;
        this.z = -this.z * invLenSq;
        this.w =  this.w * invLenSq;
        return this;
    }

    setFromAxisAngle(axis, angle) {
        const half = angle / 2;
        const s = Math.sin(half);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(half);
        return this;
    }

    setFromRotationMatrix(m) {
        const te = m.elements;
        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];
        const trace = m11 + m22 + m33;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1);
            this.w = 0.25 / s;
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {
            const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
            this.w = (m32 - m23) / s;
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;
        } else if (m22 > m33) {
            const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
            this.w = (m13 - m31) / s;
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;
        } else {
            const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
            this.w = (m21 - m12) / s;
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;
        }
        return this;
    }

    setFromEuler(ex, ey, ez, order = 'XYZ') {
        const c1 = Math.cos(ex / 2), s1 = Math.sin(ex / 2);
        const c2 = Math.cos(ey / 2), s2 = Math.sin(ey / 2);
        const c3 = Math.cos(ez / 2), s3 = Math.sin(ez / 2);

        switch (order) {
            case 'XYZ':
                this.x = s1*c2*c3 + c1*s2*s3;
                this.y = c1*s2*c3 - s1*c2*s3;
                this.z = c1*c2*s3 + s1*s2*c3;
                this.w = c1*c2*c3 - s1*s2*s3;
                break;
            case 'YXZ':
                this.x = s1*c2*c3 + c1*s2*s3;
                this.y = c1*s2*c3 - s1*c2*s3;
                this.z = c1*c2*s3 - s1*s2*c3;
                this.w = c1*c2*c3 + s1*s2*s3;
                break;
            case 'ZXY':
                this.x = s1*c2*c3 - c1*s2*s3;
                this.y = c1*s2*c3 + s1*c2*s3;
                this.z = c1*c2*s3 + s1*s2*c3;
                this.w = c1*c2*c3 - s1*s2*s3;
                break;
            case 'ZYX':
                this.x = s1*c2*c3 - c1*s2*s3;
                this.y = c1*s2*c3 + s1*c2*s3;
                this.z = c1*c2*s3 - s1*s2*c3;
                this.w = c1*c2*c3 + s1*s2*s3;
                break;
            case 'YZX':
                this.x = s1*c2*c3 + c1*s2*s3;
                this.y = c1*s2*c3 + s1*c2*s3;
                this.z = c1*c2*s3 - s1*s2*c3;
                this.w = c1*c2*c3 - s1*s2*s3;
                break;
            case 'XZY':
                this.x = s1*c2*c3 - c1*s2*s3;
                this.y = c1*s2*c3 - s1*c2*s3;
                this.z = c1*c2*s3 + s1*s2*c3;
                this.w = c1*c2*c3 + s1*s2*s3;
                break;
        }
        return this;
    }

    setFromUnitVectors(vFrom, vTo) {
        let r = vFrom.x * vTo.x + vFrom.y * vTo.y + vFrom.z * vTo.z + 1;

        if (r < Number.EPSILON) {
            r = 0;
            if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
                this.x = -vFrom.y;
                this.y =  vFrom.x;
                this.z = 0;
                this.w = r;
            } else {
                this.x = 0;
                this.y = -vFrom.z;
                this.z =  vFrom.y;
                this.w = r;
            }
        } else {
            this.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
            this.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
            this.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
            this.w = r;
        }
        return this.normalize();
    }

    toEuler(order = 'XYZ') {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        const x2 = x+x, y2 = y+y, z2 = z+z;
        const xx = x*x2, xy = x*y2, xz = x*z2;
        const yy = y*y2, yz = y*z2, zz = z*z2;
        const wx = w*x2, wy = w*y2, wz = w*z2;

        const m11 = 1-(yy+zz), m12 = xy-wz,     m13 = xz+wy;
        const m21 = xy+wz,     m22 = 1-(xx+zz), m23 = yz-wx;
        const m31 = xz-wy,     m32 = yz+wx,     m33 = 1-(xx+yy);

        const out = { x: 0, y: 0, z: 0 };

        switch (order) {
            case 'XYZ':
                out.y = Math.asin(Math.max(-1, Math.min(1, m13)));
                if (Math.abs(m13) < 0.9999999) {
                    out.x = Math.atan2(-m23, m33);
                    out.z = Math.atan2(-m12, m11);
                } else {
                    out.x = Math.atan2(m32, m22);
                    out.z = 0;
                }
                break;
            case 'YXZ':
                out.x = Math.asin(-Math.max(-1, Math.min(1, m23)));
                if (Math.abs(m23) < 0.9999999) {
                    out.y = Math.atan2(m13, m33);
                    out.z = Math.atan2(m21, m22);
                } else {
                    out.y = Math.atan2(-m31, m11);
                    out.z = 0;
                }
                break;
            case 'ZXY':
                out.x = Math.asin(Math.max(-1, Math.min(1, m32)));
                if (Math.abs(m32) < 0.9999999) {
                    out.y = Math.atan2(-m31, m33);
                    out.z = Math.atan2(-m12, m22);
                } else {
                    out.y = 0;
                    out.z = Math.atan2(m21, m11);
                }
                break;
            case 'ZYX':
                out.y = Math.asin(-Math.max(-1, Math.min(1, m31)));
                if (Math.abs(m31) < 0.9999999) {
                    out.x = Math.atan2(m32, m33);
                    out.z = Math.atan2(m21, m11);
                } else {
                    out.x = 0;
                    out.z = Math.atan2(-m12, m22);
                }
                break;
            case 'YZX':
                out.z = Math.asin(Math.max(-1, Math.min(1, m21)));
                if (Math.abs(m21) < 0.9999999) {
                    out.x = Math.atan2(-m23, m22);
                    out.y = Math.atan2(-m31, m11);
                } else {
                    out.x = 0;
                    out.y = Math.atan2(m13, m33);
                }
                break;
            case 'XZY':
                out.z = Math.asin(-Math.max(-1, Math.min(1, m12)));
                if (Math.abs(m12) < 0.9999999) {
                    out.x = Math.atan2(m32, m22);
                    out.y = Math.atan2(m13, m11);
                } else {
                    out.x = Math.atan2(-m23, m33);
                    out.y = 0;
                }
                break;
        }
        return out;
    }

    angleTo(q) {
        return 2 * Math.acos(Math.abs(Math.max(-1, Math.min(1, this.dot(q)))));
    }

    slerp(qb, t) {
        if (t === 0) return this;
        if (t === 1) return this.copy(qb);

        const x = this.x, y = this.y, z = this.z, w = this.w;
        let cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

        if (cosHalfTheta < 0) {
            this.w = -qb.w;
            this.x = -qb.x;
            this.y = -qb.y;
            this.z = -qb.z;
            cosHalfTheta = -cosHalfTheta;
        } else {
            this.copy(qb);
        }

        if (cosHalfTheta >= 1) {
            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        const sqrSinHalfTheta = 1 - cosHalfTheta * cosHalfTheta;
        if (sqrSinHalfTheta <= Number.EPSILON) {
            const s = 1 - t;
            this.w = s * w + t * this.w;
            this.x = s * x + t * this.x;
            this.y = s * y + t * this.y;
            this.z = s * z + t * this.z;
            return this.normalize();
        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta    = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta)       / sinHalfTheta;

        this.w = w * ratioA + this.w * ratioB;
        this.x = x * ratioA + this.x * ratioB;
        this.y = y * ratioA + this.y * ratioB;
        this.z = z * ratioA + this.z * ratioB;

        return this;
    }

    slerpQuaternions(qa, qb, t) {
        return this.copy(qa).slerp(qb, t);
    }

    rotateTowards(q, step) {
        const angle = this.angleTo(q);
        if (angle === 0) return this;
        return this.slerp(q, Math.min(1, step / angle));
    }

    equals(q) {
        return this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w;
    }

    fromArray(arr, offset = 0) {
        this.x = arr[offset];
        this.y = arr[offset + 1];
        this.z = arr[offset + 2];
        this.w = arr[offset + 3];
        return this;
    }

    toArray(arr = [], offset = 0) {
        arr[offset]     = this.x;
        arr[offset + 1] = this.y;
        arr[offset + 2] = this.z;
        arr[offset + 3] = this.w;
        return arr;
    }

    static slerp(qa, qb, qm, t) {
        return qm.copy(qa).slerp(qb, t);
    }

    static multiply(a, b) {
        return new Quaternion().multiplyQuaternions(a, b);
    }
} 
