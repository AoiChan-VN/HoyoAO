export class VREngine {
    constructor(canvas, textures) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) throw new Error("WebGL2 không được hỗ trợ!");
        
        this.rotation = { x: 0, y: 0 };
        this.initGyro();
    }

    initGyro() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Cho iOS thiết bị Apple yêu cầu quyền
            window.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission().then(res => {
                    if(res === 'granted') window.addEventListener('deviceorientation', (e) => this.handleGyro(e));
                });
            }, { once: true });
        } else {
            window.addEventListener('deviceorientation', (e) => this.handleGyro(e));
        }
    }

    handleGyro(e) {
        if (e.alpha && e.beta) {
            // Mapping dữ liệu Gyroscope vào ma trận góc quay Camera
            this.rotation.y = (e.alpha * Math.PI) / 180;
            this.rotation.x = (e.beta * Math.PI) / 180;
            this.draw();
        }
    }

    // Luồng logic thiết lập Matrix 3D Shader và vẽ Cubebox cục bộ nằm tại đây...
    draw() {
        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Tại đây thực thi lập trình Matrix 3D Vertex & Fragment Shader cục bộ
    }
}
 
