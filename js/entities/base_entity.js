export class BaseEntity {
    constructor(x = 0, y = 0, z = 0, width = 0, height = 0, depth = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.isDead = false;
    }

    update(dt) {}

    getBounds() {
        return {
            minX: this.x - this.width / 2,
            maxX: this.x + this.width / 2,
            minY: this.y - this.height / 2,
            maxY: this.y + this.height / 2,
            minZ: this.z - this.depth / 2,
            maxZ: this.z + this.depth / 2
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();

        return (
            a.minX <= b.maxX &&
            a.maxX >= b.minX &&
            a.minY <= b.maxY &&
            a.maxY >= b.minY &&
            a.minZ <= b.maxZ &&
            a.maxZ >= b.minZ
        );
    }

    takeDamage(amount) {}
}
 
