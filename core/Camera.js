export class VRCamera {
    constructor() {
        this.rotation = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.sensitivity = 0.05;
        this.initListeners();
    }

    initListeners() {
        // Chuột di chuyển tạo hiệu ứng Parallax góc nhìn sâu
        window.addEventListener('mousemove', (e) => {
            this.target.x = (e.clientX - window.innerWidth / 2) * this.sensitivity;
            this.target.y = (e.clientY - window.innerHeight / 2) * this.sensitivity;
        });

        // Kích hoạt cảm biến con quay hồi chuyển Gyroscope cho thiết bị VR di động
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.beta && e.gamma) {
                    this.target.y = (e.beta - 60) * 2; // Góc nghiêng trục X
                    this.target.x = e.gamma * 2;       // Góc nghiêng trục Y
                }
            });
        }
    }

    update() {
        // Thuật toán Lerp mượt mà (Linear Interpolation) chống giật khung hình khi quay đầu
        this.rotation.x += (this.target.x - this.rotation.x) * 0.1;
        this.rotation.y += (this.target.y - this.rotation.y) * 0.1;
    }
}
 
