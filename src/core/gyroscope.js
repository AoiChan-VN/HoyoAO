export class VRGyroscopeSensor {
    constructor(onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        this.isActive = false;
        this.initialPitch = null;
        this.initialYaw = null;
        this.smoothedX = 0;
        this.smoothedY = 0;
        this.filterFactor = 0.22;
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
        if (event.alpha === null || event.beta === null || event.gamma === null) return;

        const pitch = event.beta;
        const yaw = event.alpha;

        if (this.initialPitch === null) {
            this.initialPitch = pitch;
            this.initialYaw = yaw;
            this.smoothedX = 0;
            this.smoothedY = 0;
            return;
        }

        const targetX = pitch - this.initialPitch;
        let targetY = -(yaw - this.initialYaw);

        targetY = ((targetY + 180) % 360 + 360) % 360 - 180;

        this.smoothedX += (targetX - this.smoothedX) * this.filterFactor;

        let diffY = targetY - this.smoothedY;
        diffY = ((diffY + 180) % 360 + 360) % 360 - 180;
        this.smoothedY += diffY * this.filterFactor;

        this.onUpdateCallback(this.smoothedX, this.smoothedY);
    }
}
 
