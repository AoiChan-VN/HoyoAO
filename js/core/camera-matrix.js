// ./js/core/camera-matrix.js

import { Vector3 } from '../math/vector3.js';
import { Quaternion } from '../math/quaternion.js';
import { Matrix4 } from '../math/matrix4.js';

export class CameraMatrix {
    constructor() {
        this.position =
            new Vector3(
                0,
                1.6,
                0
            );

        this.rotation =
            new Quaternion();

        this.viewMatrix =
            new Matrix4();

        this.projectionMatrix =
            new Matrix4();

        this.fieldOfView = 70;

        this.aspectRatio =
            window.innerWidth /
            window.innerHeight;

        this.near = 0.01;

        this.far = 1000;

        this.updateProjection();

        this.updateView();
    }

    setPosition(
        x,
        y,
        z
    ) {
        this.position.set(
            x,
            y,
            z
        );

        this.updateView();

        return this;
    }

    setRotationQuaternion(
        x,
        y,
        z,
        w
    ) {
        this.rotation.set(
            x,
            y,
            z,
            w
        );

        this.rotation.normalize();

        this.updateView();

        return this;
    }

    setEuler(
        pitch,
        yaw,
        roll = 0
    ) {
        this.rotation
            .setFromEuler(
                pitch,
                yaw,
                roll
            );

        this.updateView();

        return this;
    }

    setPerspective(
        fieldOfView,
        aspectRatio,
        near,
        far
    ) {
        this.fieldOfView =
            fieldOfView;

        this.aspectRatio =
            aspectRatio;

        this.near = near;

        this.far = far;

        this.updateProjection();

        return this;
    }

    updateProjection() {
        this.projectionMatrix
            .makePerspective(
                this.fieldOfView,
                this.aspectRatio,
                this.near,
                this.far
            );
    }

    updateAspectRatio(
        width,
        height
    ) {
        this.aspectRatio =
            width / height;

        this.updateProjection();
    }

    updateView() {
        const matrix =
            this.viewMatrix
                .elements;

        const rotation =
            this.rotation
                .toMatrix4();

        matrix[0] =
            rotation[0];

        matrix[1] =
            rotation[4];

        matrix[2] =
            rotation[8];

        matrix[3] = 0;

        matrix[4] =
            rotation[1];

        matrix[5] =
            rotation[5];

        matrix[6] =
            rotation[9];

        matrix[7] = 0;

        matrix[8] =
            rotation[2];

        matrix[9] =
            rotation[6];

        matrix[10] =
            rotation[10];

        matrix[11] = 0;

        matrix[12] =
            -this.position.x;

        matrix[13] =
            -this.position.y;

        matrix[14] =
            -this.position.z;

        matrix[15] = 1;
    }

    getForwardVector() {
        const rotation =
            this.rotation
                .toMatrix4();

        return new Vector3(
            -rotation[8],
            -rotation[9],
            -rotation[10]
        ).normalize();
    }

    getRightVector() {
        const rotation =
            this.rotation
                .toMatrix4();

        return new Vector3(
            rotation[0],
            rotation[1],
            rotation[2]
        ).normalize();
    }

    getUpVector() {
        const rotation =
            this.rotation
                .toMatrix4();

        return new Vector3(
            rotation[4],
            rotation[5],
            rotation[6]
        ).normalize();
    }

    moveForward(
        distance
    ) {
        const forward =
            this.getForwardVector();

        this.position.add(
            forward.multiplyScalar(
                distance
            )
        );

        this.updateView();
    }

    moveRight(
        distance
    ) {
        const right =
            this.getRightVector();

        this.position.add(
            right.multiplyScalar(
                distance
            )
        );

        this.updateView();
    }

    moveUp(
        distance
    ) {
        const up =
            this.getUpVector();

        this.position.add(
            up.multiplyScalar(
                distance
            )
        );

        this.updateView();
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    getViewArray() {
        return this.viewMatrix
            .toFloat32Array();
    }

    getProjectionArray() {
        return this.projectionMatrix
            .toFloat32Array();
    }
} 
