// ./js/interaction/raycaster.js

import { Vector3 } from '../math/vector3.js';

export class Raycaster {
    constructor() {
        this.origin =
            new Vector3();

        this.direction =
            new Vector3(
                0,
                0,
                -1
            );
    }

    setRay(
        origin,
        direction
    ) {
        this.origin.copy(
            origin
        );

        this.direction
            .copy(direction)
            .normalize();
    }

    intersectAABB(
        boxMin,
        boxMax
    ) {
        let tMin = -Infinity;
        let tMax = Infinity;

        const origin =
            this.origin;

        const direction =
            this.direction;

        const axes = [
            'x',
            'y',
            'z'
        ];

        for (
            let i = 0;
            i < axes.length;
            i += 1
        ) {
            const axis =
                axes[i];

            const dir =
                direction[axis];

            const rayOrigin =
                origin[axis];

            const min =
                boxMin[axis];

            const max =
                boxMax[axis];

            if (
                Math.abs(dir) <
                0.000001
            ) {
                if (
                    rayOrigin < min ||
                    rayOrigin > max
                ) {
                    return null;
                }

                continue;
            }

            const inverse =
                1 / dir;

            let t1 =
                (min - rayOrigin) *
                inverse;

            let t2 =
                (max - rayOrigin) *
                inverse;

            if (t1 > t2) {
                const temp =
                    t1;

                t1 = t2;
                t2 = temp;
            }

            tMin =
                Math.max(
                    tMin,
                    t1
                );

            tMax =
                Math.min(
                    tMax,
                    t2
                );

            if (
                tMin > tMax
            ) {
                return null;
            }
        }

        if (
            tMax < 0
        ) {
            return null;
        }

        const distance =
            tMin >= 0
                ? tMin
                : tMax;

        return {
            distance,
            point:
                this.getPointAt(
                    distance
                )
        };
    }

    getPointAt(
        distance
    ) {
        return new Vector3(
            this.origin.x +
                this.direction.x *
                    distance,
            this.origin.y +
                this.direction.y *
                    distance,
            this.origin.z +
                this.direction.z *
                    distance
        );
    }

    cast(
        objects
    ) {
        let nearest =
            null;

        let nearestDistance =
            Infinity;

        for (
            let i = 0;
            i < objects.length;
            i += 1
        ) {
            const object =
                objects[i];

            if (
                !object ||
                !object.boundingBox
            ) {
                continue;
            }

            const hit =
                this.intersectAABB(
                    object.boundingBox.min,
                    object.boundingBox.max
                );

            if (
                !hit
            ) {
                continue;
            }

            if (
                hit.distance <
                nearestDistance
            ) {
                nearestDistance =
                    hit.distance;

                nearest = {
                    object,
                    distance:
                        hit.distance,
                    point:
                        hit.point
                };
            }
        }

        return nearest;
    }
} 
