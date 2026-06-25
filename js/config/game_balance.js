import { WEAPON_TYPES } from "./constants.js";

export const BALANCE = {
    PLAYER: {
        BASE_HP: 100,
        BASE_SHIELD: 50,
        SPEED_X: 380,
        SPEED_Y: 280,
        SHIELD_REGEN: 2,
        SHIELD_REGEN_DELAY: 3.0
    },
    WEAPONS: {
        [WEAPON_TYPES.STANDARD]: {
            DAMAGE: 10,
            COOLDOWN: 0.15,
            SPEED: 1200,
            COST: 0
        },
        [WEAPON_TYPES.DUAL]: {
            DAMAGE: 12,
            COOLDOWN: 0.12,
            SPEED: 1400,
            COST: 500
        },
        [WEAPON_TYPES.PLASMA]: {
            DAMAGE: 35,
            COOLDOWN: 0.35,
            SPEED: 900,
            COST: 1200
        }
    },
    ENEMIES: {
        DRONE: {
            HP: 20,
            SPEED: 250,
            DAMAGE: 15,
            CREDITS: 25,
            SCORE: 10,
            SPAWN_RATE_START: 1.5,
            SPAWN_RATE_MIN: 0.4
        },
        BOSS: {
            HP: 350,
            SPEED: 80,
            DAMAGE: 40,
            CREDITS: 200,
            SCORE: 100,
            SPAWN_SCORE_TRIGGER: 500
        }
    },
    PROGRESSION: {
        DIFFICULTY_RAMP: 0.02,
        SPAWN_ACCELERATION: 0.005
    }
};
 
