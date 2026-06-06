// ./js/interaction/drag-3d.js

import { Vector3 } from '../math/vector3.js';

export class Drag3D {
    constructor() {
        this.isDragging = false;

        this.target = null;

        this.dragDistance = 2.5;

        this.pointerPosition = {
            x: 0,
            y: 0
        };

        this.worldPosition =
            new Vector3();
    }

    beginDrag(
        target
    ) {
        if (!target) {
            return;
        }

        this.target = target;
        this.isDragging = true;
    }

    endDrag() {
        this.isDragging = false;
        this.target = null;
    }

    updatePointerPosition(
        clientX,
        clientY
    ) {
        this.pointerPosition.x =
            clientX;

        this.pointerPosition.y =
            clientY;
    }

    screenToWorld(
        clientX,
        clientY,
        viewportWidth,
        viewportHeight,
        cameraPosition
    ) {
        const normalizedX =
            (clientX /
                viewportWidth) *
                2 -
            1;

        const normalizedY =
            -(
                (clientY /
                    viewportHeight) *
                    2 -
                1
            );

        this.worldPosition.set(
            cameraPosition.x +
                normalizedX *
                    this.dragDistance,
            cameraPosition.y +
                normalizedY *
                    this.dragDistance,
            cameraPosition.z -
                this.dragDistance
        );

        return this.worldPosition;
    }

    update(
        viewportWidth,
        viewportHeight,
        cameraPosition
    ) {
        if (
            !this.isDragging ||
            !this.target
        ) {
            return;
        }

        const worldPosition =
            this.screenToWorld(
                this.pointerPosition.x,
                this.pointerPosition.y,
                viewportWidth,
                viewportHeight,
                cameraPosition
            );

        if (
            typeof this.target.setPosition ===
            'function'
        ) {
            this.target.setPosition(
                worldPosition.x,
                worldPosition.y,
                worldPosition.z
            );
        }
    }

    getTarget() {
        return this.target;
    }

    dragging() {
        return this.isDragging;
    }
} 
