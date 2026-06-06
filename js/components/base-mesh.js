// ./js/components/base-mesh.js

import { Vector3 } from '../math/vector3.js';
import { Quaternion } from '../math/quaternion.js';
import { Matrix4 } from '../math/matrix4.js';

export class BaseMesh {
    constructor() {
        this.position =
            new Vector3();

        this.rotation =
            new Quaternion();

        this.scale =
            new Vector3(
                1,
                1,
                1
            );

        this.modelMatrix =
            new Matrix4();

        this.geometry = {
            vertices: null,
            normals: null,
            uvs: null,
            indices: null
        };

        this.material = {
            visible: true
        };

        this.boundingBox = {
            min: new Vector3(
                -0.5,
                -0.5,
                -0.5
            ),
            max: new Vector3(
                0.5,
                0.5,
                0.5
            )
        };
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

        this.updateModelMatrix();

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

        this.updateModelMatrix();

        return this;
    }

    setScale(
        x,
        y,
        z
    ) {
        this.scale.set(
            x,
            y,
            z
        );

        this.updateModelMatrix();

        return this;
    }

    setGeometry(
        geometry
    ) {
        this.geometry =
            geometry;

        return this;
    }

    setMaterial(
        material
    ) {
        this.material =
            material;

        return this;
    }

    setBoundingBox(
        min,
        max
    ) {
        this.boundingBox.min =
            min;

        this.boundingBox.max =
            max;

        return this;
    }

    updateModelMatrix() {
        const rotationMatrix =
            this.rotation.toMatrix4();

        const matrix =
            this.modelMatrix
                .elements;

        matrix[0] =
            rotationMatrix[0] *
            this.scale.x;

        matrix[1] =
            rotationMatrix[1] *
            this.scale.x;

        matrix[2] =
            rotationMatrix[2] *
            this.scale.x;

        matrix[3] = 0;

        matrix[4] =
            rotationMatrix[4] *
            this.scale.y;

        matrix[5] =
            rotationMatrix[5] *
            this.scale.y;

        matrix[6] =
            rotationMatrix[6] *
            this.scale.y;

        matrix[7] = 0;

        matrix[8] =
            rotationMatrix[8] *
            this.scale.z;

        matrix[9] =
            rotationMatrix[9] *
            this.scale.z;

        matrix[10] =
            rotationMatrix[10] *
            this.scale.z;

        matrix[11] = 0;

        matrix[12] =
            this.position.x;

        matrix[13] =
            this.position.y;

        matrix[14] =
            this.position.z;

        matrix[15] = 1;
    }

    update() {
    }

    render() {
    }

    getModelMatrix() {
        return this.modelMatrix;
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    getScale() {
        return this.scale;
    }

    getGeometry() {
        return this.geometry;
    }

    getMaterial() {
        return this.material;
    }

    isVisible() {
        return this.material.visible;
    }
} 
