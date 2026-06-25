import { PARTICLE_CONFIG } from "../config/constants.js";

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    reset() {
        this.particles.length = 0;
    }

    spawnExplosion(x, y, z, count) {
        const remainingCapacity = PARTICLE_CONFIG.MAX_PARTICLES - this.particles.length;
        const actualCount = Math.min(count, remainingCapacity);

        for (let i = 0; i < actualCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 120 + Math.random() * 280;

            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.sin(phi) * Math.sin(theta) * speed;
            const vz = Math.cos(phi) * speed;

            const maxLife = PARTICLE_CONFIG.DEFAULT_LIFE * (0.4 + Math.random() * 0.6);

            this.particles.push({
                x,
                y,
                z,
                vx,
                vy,
                vz,
                life: maxLife,
                maxLife,
                size: 2 + Math.random() * 5
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;

            p.vx *= (1 - 0.5 * dt);
            p.vy *= (1 - 0.5 * dt);
            p.vz *= (1 - 0.5 * dt);
        }
    }

    getParticles() {
        return this.particles;
    }
}
 
