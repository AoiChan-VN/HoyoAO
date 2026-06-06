export default class EntityFactory {

    static create({

        id,
        element,

        x = 0,
        y = 0,
        z = 0,

        rx = 0,
        ry = 0,
        rz = 0
    }) {

        element.dataset.spatialId =
            id;

        element.style.position =
            "absolute";

        return {

            id,
            element,

            x,
            y,
            z,

            rx,
            ry,
            rz,

            vx: 0,
            vy: 0,
            vz: 0
        };
    }
} 
