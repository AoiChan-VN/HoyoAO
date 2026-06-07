export class DragDropDashboard {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.initDrag();
    }

    initDrag() {
        const header = this.element.querySelector('.dashboard-header') || this.element;
        
        header.addEventListener('mousedown', (e) => this.dragStart(e));
        window.addEventListener('mousemove', (e) => this.drag(e));
        window.addEventListener('mouseup', () => this.dragEnd());

        // Hỗ trợ cảm ứng đa điểm trên kính VR di động
        header.addEventListener('touchstart', (e) => this.dragStart(e.touches[0]));
        window.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
        window.addEventListener('touchend', () => this.dragEnd());
    }

    dragStart(e) {
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;
        if (e.target === this.element.querySelector('.dashboard-header') || e.target === this.element) {
            this.isDragging = true;
            this.element.style.cursor = 'grabbing';
        }
    }

    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.currentX = e.clientX - this.initialX;
        this.currentY = e.clientY - this.initialY;
        this.xOffset = this.currentX;
        this.yOffset = this.currentY;

        // Biến đổi CSS Matrix3D kết hợp tọa độ kéo thả
        this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 100px) rotateY(15deg)`;
    }

    dragEnd() {
        this.isDragging = false;
        this.element.style.cursor = 'grab';
    }
}
 
