export class Camera {
    constructor(canvas, store, eventBus) {
        this.canvas = canvas;
        this.store = store;
        this.eventBus = eventBus;
        
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        
        this.pitch = 0;
        this.yaw = 0;
        
        this.isDragging = false;
        this.previousMouseX = 0;
        this.previousMouseY = 0;
        
        this.gyroPitchOffset = 0;
        this.gyroYawOffset = 0;
        this.hasInitializedGyro = false;

        this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);
    }

    initialize() {
        this.identity(this.viewMatrix);
        this.identity(this.projectionMatrix);
        this.setupMouseControls();
        this.setupGyroControls();
    }

    setupMouseControls() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMouseX = e.clientX;
            this.previousMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.previousMouseX;
            const deltaY = e.clientY - this.previousMouseY;
            
            this.previousMouseX = e.clientX;
            this.previousMouseY = e.clientY;

            const sensitivity = 0.003;
            this.yaw -= deltaX * sensitivity;
            this.pitch -= deltaY * sensitivity;

            const maxPitch = Math.PI / 2 - 0.05;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            this.isDragging = true;
            this.previousMouseX = e.touches[0].clientX;
            this.previousMouseY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;
            
            const deltaX = e.touches[0].clientX - this.previousMouseX;
            const deltaY = e.touches[0].clientY - this.previousMouseY;
            
            this.previousMouseX = e.touches[0].clientX;
            this.previousMouseY = e.touches[0].clientY;

            const sensitivity = 0.005;
            this.yaw -= deltaX * sensitivity;
            this.pitch -= deltaY * sensitivity;
            this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
        });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    setupGyroControls() {
        window.addEventListener('deviceorientation', this.handleDeviceOrientation);
    }

    handleDeviceOrientation(event) {
        if (!this.store.state.gyroscopeEnabled) {
            this.hasInitializedGyro = false;
            return;
        }

        const alpha = event.alpha * (Math.PI / 180);
        const beta = event.beta * (Math.PI / 180);

        if (!this.hasInitializedGyro) {
            this.gyroYawOffset = alpha - this.yaw;
            this.gyroPitchOffset = beta - this.pitch;
            this.hasInitializedGyro = true;
        }

        this.yaw = alpha - this.gyroYawOffset;
        this.pitch = beta - this.gyroPitchOffset;
        this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
    }

    updateProjection(width, height) {
        const fieldOfView = 60 * (Math.PI / 180);
        const aspect = width / height;
        const zNear = 0.1;
        const zFar = 100.0;
        
        this.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
    }

    update() {
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const cosYaw = Math.cos(this.yaw);
        const sinYaw = Math.sin(this.yaw);

        const xAxis = new Float32Array([cosYaw, 0, -sinYaw]);
        const yAxis = new Float32Array([sinYaw * sinPitch, cosPitch, cosYaw * sinPitch]);
        const zAxis = new Float32Array([sinYaw * cosPitch, -sinPitch, cosYaw * cosPitch]);

        this.viewMatrix[0] = xAxis[0]; this.viewMatrix[1] = yAxis[0]; this.viewMatrix[2] = zAxis[0]; this.viewMatrix[3] = 0;
        this.viewMatrix[4] = xAxis[1]; this.viewMatrix[5] = yAxis[1]; this.viewMatrix[6] = zAxis[1]; this.viewMatrix[7] = 0;
        this.viewMatrix[8] = xAxis[2]; this.viewMatrix[9] = yAxis[2]; this.viewMatrix[10] = zAxis[2]; this.viewMatrix[11] = 0;
        this.viewMatrix[12] = 0;        this.viewMatrix[13] = 0;        this.viewMatrix[14] = 0;         this.viewMatrix[15] = 1;
        
        this.eventBus.emit('CAMERA_UPDATED', this.viewMatrix);
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    identity(out) {
        for (let i = 0; i < 16; i++) out[i] = i % 5 === 0 ? 1 : 0;
    }

    perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0;          out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0;          out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0;         out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0;
    }

    destroy() {
        window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
    }
}
 
