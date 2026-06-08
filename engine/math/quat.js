import { Vec3 } from './vec3.js';

export class Quat {

    constructor(
        x = 0,
        y = 0,
        z = 0,
        w = 1
    ) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(
        x,
        y,
        z,
        w
    ) {

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

        return new Quat(
            this.x,
            this.y,
            this.z,
            this.w
        );
    }

    identity() {

        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;

        return this;
    }

    length() {

        return Math.sqrt(
            this.x * this.x +
            this.y * this.y +
            this.z * this.z +
            this.w * this.w
        );
    }

    normalize() {

        const len =
            this.length();

        if (
            len === 0
        ) {

            return this.identity();
        }

        const inv =
            1 / len;

        this.x *= inv;
        this.y *= inv;
        this.z *= inv;
        this.w *= inv;

        return this;
    }

    conjugate() {

        this.x =
            -this.x;

        this.y =
            -this.y;

        this.z =
            -this.z;

        return this;
    }

    invert() {

        return this
            .conjugate()
            .normalize();
    }

    multiply(q) {

        const ax =
            this.x;

        const ay =
            this.y;

        const az =
            this.z;

        const aw =
            this.w;

        const bx =
            q.x;

        const by =
            q.y;

        const bz =
            q.z;

        const bw =
            q.w;

        this.x =
            aw * bx +
            ax * bw +
            ay * bz -
            az * by;

        this.y =
            aw * by -
            ax * bz +
            ay * bw +
            az * bx;

        this.z =
            aw * bz +
            ax * by -
            ay * bx +
            az * bw;

        this.w =
            aw * bw -
            ax * bx -
            ay * by -
            az * bz;

        return this;
    }

    fromAxisAngle(
        axis,
        angle
    ) {

        const half =
            angle * 0.5;

        const s =
            Math.sin(
                half
            );

        this.x =
            axis.x * s;

        this.y =
            axis.y * s;

        this.z =
            axis.z * s;

        this.w =
            Math.cos(
                half
            );

        return this;
    }

    fromEuler(
        pitch,
        yaw,
        roll
    ) {

        const cx =
            Math.cos(
                pitch * 0.5
            );

        const sx =
            Math.sin(
                pitch * 0.5
            );

        const cy =
            Math.cos(
                yaw * 0.5
            );

        const sy =
            Math.sin(
                yaw * 0.5
            );

        const cz =
            Math.cos(
                roll * 0.5
            );

        const sz =
            Math.sin(
                roll * 0.5
            );

        this.x =
            sx * cy * cz -
            cx * sy * sz;

        this.y =
            cx * sy * cz +
            sx * cy * sz;

        this.z =
            cx * cy * sz -
            sx * sy * cz;

        this.w =
            cx * cy * cz +
            sx * sy * sz;

        return this.normalize();
    }

    toEuler() {

        const sinr =
            2 *
            (
                this.w *
                    this.x +
                this.y *
                    this.z
            );

        const cosr =
            1 -
            2 *
            (
                this.x *
                    this.x +
                this.y *
                    this.y
            );

        const pitch =
            Math.atan2(
                sinr,
                cosr
            );

        const sinp =
            2 *
            (
                this.w *
                    this.y -
                this.z *
                    this.x
            );

        let yaw;

        if (
            Math.abs(
                sinp
            ) >= 1
        ) {

            yaw =
                Math.sign(
                    sinp
                ) *
                Math.PI /
                2;
        }
        else {

            yaw =
                Math.asin(
                    sinp
                );
        }

        const siny =
            2 *
            (
                this.w *
                    this.z +
                this.x *
                    this.y
            );

        const cosy =
            1 -
            2 *
            (
                this.y *
                    this.y +
                this.z *
                    this.z
            );

        const roll =
            Math.atan2(
                siny,
                cosy
            );

        return {
            pitch,
            yaw,
            roll
        };
    }

    rotateVector(v) {

        const qv =
            new Quat(
                v.x,
                v.y,
                v.z,
                0
            );

        const inv =
            this.clone()
                .invert();

        const result =
            this.clone()
                .multiply(
                    qv
                )
                .multiply(
                    inv
                );

        return new Vec3(
            result.x,
            result.y,
            result.z
        );
    }

    slerp(
        target,
        alpha
    ) {

        let cosTheta =
            this.x *
                target.x +
            this.y *
                target.y +
            this.z *
                target.z +
            this.w *
                target.w;

        if (
            cosTheta < 0
        ) {

            cosTheta =
                -cosTheta;
        }

        if (
            cosTheta >
            0.9995
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

            this.w +=
                (
                    target.w -
                    this.w
                ) * alpha;

            return this
                .normalize();
        }

        const theta =
            Math.acos(
                cosTheta
            );

        const sinTheta =
            Math.sin(
                theta
            );

        const a =
            Math.sin(
                (
                    1 -
                    alpha
                ) * theta
            ) /
            sinTheta;

        const b =
            Math.sin(
                alpha *
                theta
            ) /
            sinTheta;

        this.x =
            a * this.x +
            b * target.x;

        this.y =
            a * this.y +
            b * target.y;

        this.z =
            a * this.z +
            b * target.z;

        this.w =
            a * this.w +
            b * target.w;

        return this;
    }

    static identity() {

        return new Quat(
            0,
            0,
            0,
            1
        );
    }
} 
