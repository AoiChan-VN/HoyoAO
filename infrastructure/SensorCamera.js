/**
 * SensorCamera.js
 * Xử lý tương tác phần cứng tự động đồng bộ chuột và Gyroscope bằng Complementary Filter.
 */
export class SensorCamera {
    constructor() {
        this.rotation = { x: 0, y: 0, z: 0 };
        this.mouseSpeed = 0.002;
        this.gyroSpeed = 0.98;
        this.isInteracting = false;
        
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        this.gyroVelocity = { x: 0, y: 0 };
        this.accelAngle = { x: 0, y: 0 };
        this.lastTimestamp = performance.now();

        this.initEvents();
    }

    initEvents() {
        // Sự kiện chuột điều hướng
        window.addEventListener('mousedown', (e) => {
            this.isInteracting = true;
            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isInteracting) return;
            const deltaX = e.clientX - this.prevMouseX;
            const deltaY = e.clientY - this.prevMouseY;

            this.rotation.y -= deltaX * this.mouseSpeed;
            this.rotation.x -= deltaY * this.mouseSpeed;

            // Giới hạn góc nhìn dọc tránh đảo ngược camera
            this.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.rotation.x));

            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => this.isInteracting = false);

        // Đăng ký bộ cảm biến di động (Gyroscope + Accelerometer)
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
            // Hỗ trợ cấu trúc cấp quyền của iOS
            window.addEventListener('click', () => {
                DeviceMotionEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        this.bindHardwareSensors();
                    }
                }).catch(console.error);
            }, { once: true });
        } else {
            this.bindHardwareSensors();
        }
    }

    bindHardwareSensors() {
        window.addEventListener('devicemotion', (event) => {
            const now = performance.now();
            const dt = (now - this.lastTimestamp) / 1000;
            this.lastTimestamp = now;

            if (dt <= 0 || dt > 0.1) return;

            // Đọc tốc độ góc từ con quay hồi chuyển (rad/s)
            const gyro = event.rotationRate;
            if (gyro) {
                this.gyroVelocity.x = gyro.alpha * (Math.PI / 180);
                this.gyroVelocity.y = gyro.beta * (Math.PI / 180);
            }

            // Đọc gia tốc để tính góc hạ (Gravity Vector Alignment)
            const accel = event.accelerationIncludingGravity;
            if (accel) {
                this.accelAngle.x = Math.atan2(accel.y, Math.sqrt(accel.x * accel.x + accel.z * accel.z));
                this.accelAngle.y = Math.atan2(-accel.x, accel.z);
            }

            // Áp dụng bộ lọc bù Complementary Filter khử nhiễu/trôi góc tần số cao
            this.rotation.x = this.gyroSpeed * (this.rotation.x + this.gyroVelocity.x * dt) + (1 - this.gyroSpeed) * this.accelAngle.x;
            this.rotation.y = this.gyroSpeed * (this.rotation.y + this.gyroVelocity.y * dt) + (1 - this.gyroSpeed) * this.accelAngle.y;
        });
    }

    getOrientationEuler() {
        return this.rotation;
    }
}
