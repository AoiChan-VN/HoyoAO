/**
 * PhysicsDragDrop.js
 * Engine vật lý kéo thả tự do, giả lập lực cản không khí tạo góc nghiêng quán tính cho các Panel UI.
 */
export class PhysicsDragDrop {
    constructor() {
        this.trackedElements = [];
        this.activeTarget = null;
        this.pointerStart = { x: 0, y: 0 };
        this.currentOffset = { x: 0, y: 0 };
        this.initGlobalEvents();
    }

    registerElement(element, initialX, initialY, initialZ) {
        // Kiểm tra xem phần tử đã được đăng ký trước đó chưa để tránh trùng lặp trạng thái
        let state = this.trackedElements.find(item => item.element === element);
        if (!state) {
            state = {
                element: element,
                pos: { x: initialX, y: initialY, z: initialZ },
                velocity: { x: 0, y: 0 },
                targetAngle: { x: 0, y: 0 },
                currentAngle: { x: 0, y: 0 },
                damping: 0.88,
                stiffness: 14.0
            };
            this.trackedElements.push(state);

            element.addEventListener('mousedown', (e) => this.onPointerDown(e, state));
            element.addEventListener('touchstart', (e) => this.onPointerDown(e, state), { passive: true });
        } else {
            // Nếu đã tồn tại, reset lại tọa độ mục tiêu khi tái kích hoạt spawn
            state.pos.x = initialX;
            state.pos.y = initialY;
            state.pos.z = initialZ;
            state.velocity.x = 0;
            state.velocity.y = 0;
            state.targetAngle.x = 0;
            state.targetAngle.y = 0;
        }

        element.style.transform = `translate3d(${state.pos.x}px, ${state.pos.y}px, ${state.pos.z}px) rotateX(0deg) rotateY(0deg)`;
    }

    onPointerDown(e, state) {
        if (e.target.closest('button') || e.target.closest('.post-item') || e.target.closest('.panel-content')) return;

        this.activeTarget = state;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.pointerStart.x = clientX;
        this.pointerStart.y = clientY;
        this.currentOffset.x = state.pos.x;
        this.currentOffset.y = state.pos.y;
    }

    initGlobalEvents() {
        const onPointerMove = (e) => {
            if (!this.activeTarget) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - this.pointerStart.x;
            const deltaY = clientY - this.pointerStart.y;

            const nextX = this.currentOffset.x + deltaX;
            const nextY = this.currentOffset.y + deltaY;

            this.activeTarget.velocity.x = nextX - this.activeTarget.pos.x;
            this.activeTarget.velocity.y = nextY - this.activeTarget.pos.y;

            this.activeTarget.pos.x = nextX;
            this.activeTarget.pos.y = nextY;

            this.activeTarget.targetAngle.y = Math.max(-20, Math.min(20, this.activeTarget.velocity.x * 0.3));
            this.activeTarget.targetAngle.x = Math.max(-20, Math.min(20, -this.activeTarget.velocity.y * 0.3));
        };

        const onPointerUp = () => {
            if (this.activeTarget) {
                this.activeTarget.targetAngle.x = 0;
                this.activeTarget.targetAngle.y = 0;
                this.activeTarget = null;
            }
        };

        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchend', onPointerUp);
    }

    update(dt) {
        for (const state of this.trackedElements) {
            if (this.activeTarget !== state) {
                state.pos.x += state.velocity.x;
                state.pos.y += state.velocity.y;
                state.velocity.x *= state.damping;
                state.velocity.y *= state.damping;

                if (Math.abs(state.velocity.x) < 0.005) state.velocity.x = 0;
                if (Math.abs(state.velocity.y) < 0.005) state.velocity.y = 0;
            }

            state.currentAngle.x += (state.targetAngle.x - state.currentAngle.x) * state.stiffness * dt;
            state.currentAngle.y += (state.targetAngle.y - state.currentAngle.y) * state.stiffness * dt;

            state.element.style.transform = `translate3d(${state.pos.x}px, ${state.pos.y}px, ${state.pos.z}px) rotateX(${state.currentAngle.x}deg) rotateY(${state.currentAngle.y}deg)`;
        }
    }
}
 
