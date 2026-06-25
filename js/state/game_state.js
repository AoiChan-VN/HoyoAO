import { GAME_STATES, ENTITY_TYPES } from "../config/constants.js";
import { BALANCE } from "../config/game_balance.js";
import { Player } from "../entities/player.js";
import { Enemy } from "../entities/enemy.js";
import { Bullet } from "../entities/bullet.js";
import { ParticleSystem } from "../entities/particle_system.js";
import { database } from "./database.js";
import { localStorageSystem } from "./local_storage.js";
import { audioSystem } from "../core/audio_system.js";
import { renderer } from "../graphics/renderer.js";

export const gameState = {
    currentState: GAME_STATES.BOOT,
    score: 0,
    creditsEarned: 0,
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    particleSystem: null,
    spawnTimer: 0,
    bossSpawned: false,

    initialize() {
        this.player = new Player();
        this.particleSystem = new ParticleSystem();
        this.particles = this.particleSystem.getParticles();
        this.currentState = GAME_STATES.MENU;
    },

    changeState(newState) {
        this.currentState = newState;

        if (newState === GAME_STATES.PLAYING) {
            audioSystem.playBGM("bgm_space_battle");
        } else if (newState === GAME_STATES.MENU || newState === GAME_STATES.GAMEOVER) {
            audioSystem.stopBGM();
        }
    },

    getCurrentState() {
        return this.currentState;
    },

    resetGame() {
        this.score = 0;
        this.creditsEarned = 0;
        this.enemies.length = 0;
        this.bullets.length = 0;
        this.particleSystem.reset();
        this.particles = this.particleSystem.getParticles();
        this.player.reset();
        this.spawnTimer = 0;
        this.bossSpawned = false;
    },

    spawnBullet(x, y, z, speed, damage, type) {
        this.bullets.push(new Bullet(x, y, z, speed, damage, type));
    },

    update(dt) {
        if (this.currentState !== GAME_STATES.PLAYING) return;

        this.player.update(dt);
        if (this.player.isDead) {
            this.handleGameOver();
            return;
        }

        this.particleSystem.update(dt);

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt);
            if (b.isDead) {
                this.bullets.splice(i, 1);
            }
        }

        this.handleSpawning(dt);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt);

            if (e.isDead) {
                if (e.reachedBoundary) {
                    this.player.takeDamage(e.getCollisionDamage());
                    if (renderer.camera) renderer.camera.triggerShake(15, 0.2);
                } else if (e.isKilledByPlayer) {
                    const reward = e.getReward();
                    this.score += reward.score;
                    this.creditsEarned += reward.credits;
                    database.addCredits(reward.credits);
                    audioSystem.playSFX("sfx_explosion");
                    this.particleSystem.spawnExplosion(e.x, e.y, e.z, e.type === ENTITY_TYPES.ENEMY_BOSS ? 60 : 25);
                    if (e.type === ENTITY_TYPES.ENEMY_BOSS) {
                        this.bossSpawned = false;
                    }
                }
                this.enemies.splice(i, 1);
                continue;
            }

            if (this.player.collidesWith(e)) {
                this.player.takeDamage(e.getCollisionDamage());
                audioSystem.playSFX("sfx_explosion");
                this.particleSystem.spawnExplosion(e.x, e.y, e.z, 30);
                if (renderer.camera) renderer.camera.triggerShake(25, 0.3);
                if (e.type === ENTITY_TYPES.ENEMY_BOSS) {
                    this.bossSpawned = false;
                }
                this.enemies.splice(i, 1);
                continue;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const b = this.bullets[j];
                if (b.type === ENTITY_TYPES.BULLET_PLAYER && b.collidesWith(e)) {
                    e.takeDamage(b.damage);
                    b.isDead = true;
                    this.bullets.splice(j, 1);
                    break;
                }
            }
        }
    },

    handleSpawning(dt) {
        this.spawnTimer += dt;

        const dynamicRamp = this.score * BALANCE.PROGRESSION.SPAWN_ACCELERATION;
        const currentSpawnRate = Math.max(
            BALANCE.ENEMIES.DRONE.SPAWN_RATE_MIN,
            BALANCE.ENEMIES.DRONE.SPAWN_RATE_START - dynamicRamp
        );

        if (this.score >= BALANCE.ENEMIES.BOSS.SPAWN_SCORE_TRIGGER && !this.bossSpawned) {
            this.bossSpawned = true;
            this.enemies.push(new Enemy(ENTITY_TYPES.ENEMY_BOSS, 0, 100, 1800));
        }

        if (this.spawnTimer >= currentSpawnRate) {
            this.spawnTimer = 0;
            if (this.enemies.length < 15) {
                const spawnX = (Math.random() - 0.5) * 800;
                const spawnY = (Math.random() - 0.5) * 400;
                this.enemies.push(new Enemy(ENTITY_TYPES.ENEMY_DRONE, spawnX, spawnY, 1800));
            }
        }
    },

    handleGameOver() {
        this.changeState(GAME_STATES.GAMEOVER);
        localStorageSystem.save();
    }
};
 
