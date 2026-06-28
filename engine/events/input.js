import { eventBus } from './event-bus.js';

const CAMERA_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'a', 'A', 'w', 'W', 's', 'S', 'd', 'D',
]);

const PINCH_THRESHOLD = 0.5;

class InputHandler {
    #canvas = null;
    #pointers = new Map();
    #dragging = false;
    #pinchDistance = 0;
    #gyroEnabled = false;

    #onPointerDown = null;
    #onPointerMove = null;
    #onPointerUp = null;
    #onPointerCancel = null;
    #onContextMenu = null;
    #onKeyDown = null;
    #onKeyUp = null;
    #onDeviceOrientation = null;

    init(canvas) {
        this.#canvas = canvas;

        this.#onPointerDown    = (e) => this.#handlePointerDown(e);
        this.#onPointerMove    = (e) => this.#handlePointerMove(e);
        this.#onPointerUp      = (e) => this.#handlePointerUp(e);
        this.#onPointerCancel  = (e) => this.#handlePointerUp(e);
        this.#onContextMenu    = (e) => e.preventDefault();
        this.#onKeyDown        = (e) => this.#handleKey(e, true);
        this.#onKeyUp          = (e) => this.#handleKey(e, false);

        canvas.addEventListener('pointerdown',   this.#onPointerDown);
        canvas.addEventListener('pointermove',   this.#onPointerMove);
        canvas.addEventListener('pointerup',     this.#onPointerUp);
        canvas.addEventListener('pointercancel', this.#onPointerCancel);
        canvas.addEventListener('contextmenu',   this.#onContextMenu);

        window.addEventListener('keydown', this.#onKeyDown);
        window.addEventListener('keyup',   this.#onKeyUp);
    }

    async enableGyroscope() {
        if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
            try {
                const result = await DeviceOrientationEvent.requestPermission();
                if (result !== 'granted') return false;
            } catch {
                return false;
            }
        }

        this.#onDeviceOrientation = (e) => this.#handleDeviceOrientation(e);
        window.addEventListener('deviceorientation', this.#onDeviceOrientation, { passive: true });
        this.#gyroEnabled = true;
        return true;
    }

    #handlePointerDown(e) {
        this.#canvas.setPointerCapture(e.pointerId);
        this.#pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.#pointers.size === 1) {
            this.#dragging = true;
            eventBus.emit('input:dragStart', { x: e.clientX, y: e.clientY });
        } else if (this.#pointers.size === 2) {
            const pts = [...this.#pointers.values()];
            const dx = pts[1].x - pts[0].x;
            const dy = pts[1].y - pts[0].y;
            this.#pinchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    #handlePointerMove(e) {
        if (!this.#pointers.has(e.pointerId)) return;

        const prev = this.#pointers.get(e.pointerId);
        this.#pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.#pointers.size === 1 && this.#dragging) {
            eventBus.emit('input:drag', {
                deltaX: e.clientX - prev.x,
                deltaY: e.clientY - prev.y,
                x: e.clientX,
                y: e.clientY,
            });
        } else if (this.#pointers.size === 2) {
            this.#handlePinch();
        }
    }

    #handlePointerUp(e) {
        this.#pointers.delete(e.pointerId);
        if (this.#pointers.size === 0 && this.#dragging) {
            this.#dragging = false;
            eventBus.emit('input:dragEnd', { x: e.clientX, y: e.clientY });
        }
    }

    #handlePinch() {
        const pts = [...this.#pointers.values()];
        if (pts.length < 2) return;
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delta = distance - this.#pinchDistance;
        if (Math.abs(delta) < PINCH_THRESHOLD) return;
        this.#pinchDistance = distance;
        eventBus.emit('input:pinch', { distance, delta });
    }

    #handleKey(e, down) {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (!CAMERA_KEYS.has(e.key)) return;
        eventBus.emit('input:key', { key: e.key, down });
    }

    #handleDeviceOrientation(e) {
        eventBus.emit('input:gyro', {
            alpha: e.alpha,
            beta:  e.beta,
            gamma: e.gamma,
        });
    }

    get isDragging()   { return this.#dragging; }
    get gyroEnabled()  { return this.#gyroEnabled; }

    destroy() {
        if (this.#canvas) {
            this.#canvas.removeEventListener('pointerdown',   this.#onPointerDown);
            this.#canvas.removeEventListener('pointermove',   this.#onPointerMove);
            this.#canvas.removeEventListener('pointerup',     this.#onPointerUp);
            this.#canvas.removeEventListener('pointercancel', this.#onPointerCancel);
            this.#canvas.removeEventListener('contextmenu',   this.#onContextMenu);
            this.#canvas = null;
        }

        window.removeEventListener('keydown', this.#onKeyDown);
        window.removeEventListener('keyup',   this.#onKeyUp);

        if (this.#onDeviceOrientation) {
            window.removeEventListener('deviceorientation', this.#onDeviceOrientation);
            this.#onDeviceOrientation = null;
        }

        this.#pointers.clear();
        this.#dragging    = false;
        this.#gyroEnabled = false;
    }
}

export const inputHandler = new InputHandler(); 
