import { BaseEntity } from "./base_entity.js";
import { inputManager } from "../core/input_manager.js";
import { audioSystem } from "../core/audio_system.js";
import { gameState } from "../state/game_state.js";
import { database } from "../state/database.js";
import { BALANCE } from "../config/game_balance.js";
import { RENDER_CONFIG, ENTITY_TYPES, WEAPON_TYPES } from "../config/constants.js";

export class Player extends BaseEntity {
    constructor() {
        super(0, 0, RENDER_CONFIG.PLAYER_Z, 36, 18, 45);
        this.maxHp = BALANCE.PLAYER.BASE_HP;
        this.hp = this.maxHp;
        this.maxShield = BALANCE.PLAYER.BASE_SHIELD;
        this.shield = this.maxShield;
        this.cooldown = 0;
        this.shieldRegenTimer = 0;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.z = RENDER_CONFIG.PLAYER_Z;
        this.maxHp = BALANCE.PLAYER.BASE_HP;
        this.hp = this.maxHp;
        this.maxShield = BALANCE.PLAYER.BASE_SHIELD;
        this.shield = this.maxShield;
        this.cooldown = 0;
        this.shieldRegenTimer = 0;
        this.isDead = false;
    }

    update(dt) {
        if (this.isDead) return;

        const moveX = inputManager.getMoveX();
        const moveY = inputManager.getMoveY();

        this.x += moveX * BALANCE.PLAYER.SPEED_X * dt;
        this.y -= moveY * BALANCE.PLAYER.SPEED_Y * dt;

        this.x = Math.max(-RENDER_CONFIG.BOUNDS_X, Math.min(RENDER_CONFIG.BOUNDS_X, this.x));
        this.y = Math.max(-RENDER_CONFIG.BOUNDS_Y, Math.min(RENDER_CONFIG.BOUNDS_Y, this.y));

        if (this.shieldRegenTimer > 0) {
            this.shieldRegenTimer -= dt;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + BALANCE.PLAYER.SHIELD_REGEN * dt);
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (inputManager.isFiring() && this.cooldown <= 0) {
            this.fire();
        }
    }

    fire() {
        const equippedWeapon = database.getEquippedWeapon();
        const config = BALANCE.WEAPONS[equippedWeapon];
        this.cooldown = config.COOLDOWN;

        audioSystem.playSFX("sfx_laser");

        if (equippedWeapon === WEAPON_TYPES.STANDARD) {
            gameState.spawnBullet(this.x, this.y, this.z + 20, config.SPEED, config.DAMAGE, ENTITY_TYPES.BULLET_PLAYER);
        } else if (equippedWeapon === WEAPON_TYPES.DUAL) {
            gameState.spawnBullet(this.x - 14, this.y, this.z + 20, config.SPEED, config.DAMAGE, ENTITY_TYPES.BULLET_PLAYER);
            gameState.spawnBullet(this.x + 14, this.y, this.z + 20, config.SPEED, config.DAMAGE, ENTITY_TYPES.BULLET_PLAYER);
        } else if (equippedWeapon === WEAPON_TYPES.PLASMA) {
            gameState.spawnBullet(this.x, this.y, this.z + 25, config.SPEED, config.DAMAGE, ENTITY_TYPES.BULLET_PLAYER);
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.shieldRegenTimer = BALANCE.PLAYER.SHIELD_REGEN_DELAY;

        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hp += this.shield;
                this.shield = 0;
            }
        } else {
            this.hp -= amount;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }
}
 
