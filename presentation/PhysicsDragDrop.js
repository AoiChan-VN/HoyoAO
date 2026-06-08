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
        const state = {
            element: element,
            pos: { x: initialX, y: initialY, z: initialZ },
            velocity: { x: 0, y: 0 },
            targetAngle: { x: 0, y: 0 },
            currentAngle: { x: 0, y: 0 },
            damping: 0.85,          // Lực cản môi trường triệt tiêu vận tốc rơi tự do
            stiffness: 12.0        // Độ đàn hồi để kéo thẳng bề mặt phẳng về vị trí cân bằng
        };

        element.style.transform = `translate3d(${state.pos.x}px, ${state.pos.y}px, ${state.pos.z}px) rotateX(0deg) rotateY(0deg)`;
        this.trackedElements.push(state);

        // Gắn sự kiện kích hoạt kéo thả riêng cho thanh tiêu đề hoặc toàn bảng
        element.addEventListener('mousedown', (e) => this.onPointerDown(e, state));
        element.addEventListener('touchstart', (e) => this.onPointerDown(e, state), { passive: true });
    }

    onPointerDown(e, state) {
        // Không xử lý kéo thả nếu click trúng các nút hoặc vùng nhập liệu
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

            // Tính toán tức thời vận tốc kéo dời vật thể
            const nextX = this.currentOffset.x + deltaX;
            const nextY = this.currentOffset.y + deltaY;

            this.activeTarget.velocity.x = nextX - this.activeTarget.pos.x;
            this.activeTarget.velocity.y = nextY - this.activeTarget.pos.y;

            this.activeTarget.pos.x = nextX;
            this.activeTarget.pos.y = nextY;

            // Tạo góc nghiêng dựa trên tốc độ di chuyển chuột (Mô phỏng sức cản không khí)
            this.activeTarget.targetAngle.y = Math.max(-25, Math.min(25, this.activeTarget.velocity.x * 0.4));
            this.activeTarget.targetAngle.x = Math.max(-25, Math.min(25, -this.activeTarget.velocity.y * 0.4));
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
                // Áp dụng quán tính giảm chấn lướt khi buông tay
                state.pos.x += state.velocity.x;
                state.pos.y += state.velocity.y;

                state.velocity.x *= state.damping;
                state.velocity.y *= state.damping;

                if (Math.abs(state.velocity.x) < 0.01) state.velocity.x = 0;
                if (Math.abs(state.velocity.y) < 0.01) state.velocity.y = 0;
            }

            // Đồng bộ góc xoay mượt mà trả về cân bằng phẳng ban đầu (Lerp)
            state.currentAngle.x += (state.targetAngle.x - state.currentAngle.x) * state.stiffness * dt;
            state.currentAngle.y += (state.targetAngle.y - state.currentAngle.y) * state.stiffness * dt;

            // Cập nhật ma trận CSS Transforms thực thi hiển thị phần cứng
            state.element.style.transform = `translate3d(${state.pos.x}px, ${state.pos.y}px, ${state.pos.z}px) rotateX(${state.currentAngle.x}deg) rotateY(${state.currentAngle.y}deg)`;
        }
    }
}
 
