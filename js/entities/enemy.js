import { BaseEntity } from "./base_entity.js";
import { BALANCE } from "../config/game_balance.js";
import { ENTITY_TYPES, RENDER_CONFIG } from "../config/constants.js";

export class Enemy extends BaseEntity {
    constructor(type, x, y, z) {
        let width = 30;
        let height = 20;
        let depth = 30;
        let hp = BALANCE.ENEMIES.DRONE.HP;
        let speed = BALANCE.ENEMIES.DRONE.SPEED;

        if (type === ENTITY_TYPES.ENEMY_BOSS) {
            width = 120;
            height = 60;
            depth = 120;
            hp = BALANCE.ENEMIES.BOSS.HP;
            speed = BALANCE.ENEMIES.BOSS.SPEED;
        }

        super(x, y, z, width, height, depth);
        this.type = type;
        this.hp = hp;
        this.speed = speed;
        this.timeAlive = Math.random() * 100;
    }

    update(dt) {
        this.z -= this.speed * dt;
        this.timeAlive += dt;

        if (this.type === ENTITY_TYPES.ENEMY_DRONE) {
            this.x += Math.sin(this.timeAlive * 3) * 80 * dt;
            this.y += Math.cos(this.timeAlive * 2) * 40 * dt;
        } else if (this.type === ENTITY_TYPES.ENEMY_BOSS) {
            this.x += Math.sin(this.timeAlive * 1.5) * 120 * dt;
        }

        if (this.z < RENDER_CONFIG.PLAYER_Z - 50) {
            this.isDead = true;
            this.reachedBoundary = true;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.isKilledByPlayer = true;
        }
    }

    getReward() {
        if (this.type === ENTITY_TYPES.ENEMY_BOSS) {
            return {
                score: BALANCE.ENEMIES.BOSS.SCORE,
                credits: BALANCE.ENEMIES.BOSS.CREDITS
            };
        }
        return {
            score: BALANCE.ENEMIES.DRONE.SCORE,
            credits: BALANCE.ENEMIES.DRONE.CREDITS
        };
    }

    getCollisionDamage() {
        if (this.type === ENTITY_TYPES.ENEMY_BOSS) {
            return BALANCE.ENEMIES.BOSS.DAMAGE;
        }
        return BALANCE.ENEMIES.DRONE.DAMAGE;
    }
}
 
