export class VRGyroscopeSensor {
    constructor(onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        this.isActive = false;
        this.initialPitch = null;
        this.initialYaw = null;
        this._handleDeviceOrientation = this._handleDeviceOrientation.bind(this);
    }

    async start() {
        if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return false;

        try {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    this._activate();
                    return true;
                }
            } else {
                this._activate();
                return true;
            }
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    _activate() {
        window.addEventListener('deviceorientation', this._handleDeviceOrientation, true);
        this.isActive = true;
    }

    stop() {
        window.removeEventListener('deviceorientation', this._handleDeviceOrientation, true);
        this.isActive = false;
        this.initialPitch = null;
        this.initialYaw = null;
    }

    _handleDeviceOrientation(event) {
        if (!event.alpha || !event.beta || !event.gamma) return;

        const pitch = event.beta; 
        const yaw = event.alpha;  

        if (this.initialPitch === null) {
            this.initialPitch = pitch;
            this.initialYaw = yaw;
            return;
        }

        let deltaX = pitch - this.initialPitch;
        let deltaY = -(yaw - this.initialYaw);

        deltaY = ((deltaY + 180) % 360 + 360) % 360 - 180;

        this.onUpdateCallback(deltaX, deltaY);
    }
}
 
