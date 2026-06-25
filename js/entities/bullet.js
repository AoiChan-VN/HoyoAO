import { BaseEntity } from "./base_entity.js";
import { RENDER_CONFIG } from "../config/constants.js";

export class Bullet extends BaseEntity {
    constructor(x, y, z, speed, damage, type) {
        super(x, y, z, 4, 4, 16);
        this.speed = speed;
        this.damage = damage;
        this.type = type;
    }

    update(dt) {
        this.z += this.speed * dt;

        if (this.z > RENDER_CONFIG.FAR || this.z < -200) {
            this.isDead = true;
        }
    }
}
 
