import { Matrix4 }       from '../math/matrix4.js';
import { Quaternion }    from '../math/quaternion.js';
import { Vector3 }       from '../math/vector3.js';
import { damp }          from '../math/interpolation.js';
import { eventBus }      from '../events/event-bus.js';
import { resizeHandler } from '../events/resize.js';

const TWO_PI     = Math.PI * 2;
const HALF_PI    = Math.PI / 2;
const TO_RAD     = Math.PI / 180;
const PITCH_CLAMP = HALF_PI - 0.02;

const DEFAULTS = {
    fov:              75,
    fovMin:           20,
    fovMax:           120,
    dragSensitivity:  0.004,
    keySensitivity:   1.2,
    gyroSensitivity:  0.8,
    pinchSensitivity: 0.005,
    smoothLambda:     10,
    autoRotateSpeed:  0.0,
    initialYaw:       0,
    initialPitch:     0,
};

class Camera {
    #yaw          = 0;
    #pitch        = 0;
    #yawTarget    = 0;
    #pitchTarget  = 0;
    #fov          = 75;
    #fovTarget    = 75;
    #fovMin       = 20;
    #fovMax       = 120;

    #dragSensitivity  = 0.004;
    #keySensitivity   = 1.2;
    #gyroSensitivity  = 0.8;
    #pinchSensitivity = 0.005;
    #smoothLambda     = 10;
    #autoRotateSpeed  = 0;

    #keys         = new Set();

    #viewMatrix   = new Matrix4();
    #projMatrix   = new Matrix4();
    #vpMatrix     = new Matrix4();
    #quatX        = new Quaternion();
    #quatY        = new Quaternion();
    #quatCombined = new Quaternion();
    #axisX        = new Vector3(1, 0, 0);
    #axisY        = new Vector3(0, 1, 0);

    #gyroBaseBeta  = null;
    #gyroBaseGamma = null;

    #offDrag  = null;
    #offKey   = null;
    #offGyro  = null;
    #offPinch = null;
    #offResize = null;

    init(options = {}) {
        const cfg = { ...DEFAULTS, ...options };

        this.#fov             = cfg.fov;
        this.#fovTarget       = cfg.fov;
        this.#fovMin          = cfg.fovMin;
        this.#fovMax          = cfg.fovMax;
        this.#dragSensitivity = cfg.dragSensitivity;
        this.#keySensitivity  = cfg.keySensitivity;
        this.#gyroSensitivity = cfg.gyroSensitivity;
        this.#pinchSensitivity= cfg.pinchSensitivity;
        this.#smoothLambda    = cfg.smoothLambda;
        this.#autoRotateSpeed = cfg.autoRotateSpeed;
        this.#yaw             = cfg.initialYaw;
        this.#yawTarget       = cfg.initialYaw;
        this.#pitch           = cfg.initialPitch;
        this.#pitchTarget     = cfg.initialPitch;

        this.#offDrag  = eventBus.on('input:drag',  (e) => this.#onDrag(e));
        this.#offKey   = eventBus.on('input:key',   (e) => this.#onKey(e));
        this.#offGyro  = eventBus.on('input:gyro',  (e) => this.#onGyro(e));
        this.#offPinch = eventBus.on('input:pinch', (e) => this.#onPinch(e));
        this.#offResize = eventBus.on('resize',     ()  => this.#buildProjection());

        this.#buildProjection();
        this.#buildView();
    }

    update(dt) {
        this.#processKeys(dt);

        if (this.#autoRotateSpeed !== 0) {
            this.#yawTarget += this.#autoRotateSpeed * dt;
        }

        const lambda = this.#smoothLambda;
        this.#yaw   = damp(this.#yaw,   this.#yawTarget,   lambda, dt);
        this.#pitch = damp(this.#pitch, this.#pitchTarget, lambda, dt);
        this.#fov   = damp(this.#fov,   this.#fovTarget,   lambda, dt);

        if (Math.abs(this.#fov - this.#fovTarget) > 0.01) {
            this.#buildProjection();
        }

        this.#buildView();
    }

    #onDrag({ deltaX, deltaY }) {
        this.#yawTarget   -= deltaX * this.#dragSensitivity;
        this.#pitchTarget -= deltaY * this.#dragSensitivity;
        this.#pitchTarget  = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, this.#pitchTarget));
        this.#yawTarget    = ((this.#yawTarget % TWO_PI) + TWO_PI) % TWO_PI;
    }

    #onKey({ key, down }) {
        if (down) {
            this.#keys.add(key);
        } else {
            this.#keys.delete(key);
        }
    }

    #processKeys(dt) {
        const speed = this.#keySensitivity * dt;
        if (this.#keys.size === 0) return;

        if (this.#keys.has('ArrowLeft')  || this.#keys.has('a') || this.#keys.has('A')) {
            this.#yawTarget -= speed;
        }
        if (this.#keys.has('ArrowRight') || this.#keys.has('d') || this.#keys.has('D')) {
            this.#yawTarget += speed;
        }
        if (this.#keys.has('ArrowUp')    || this.#keys.has('w') || this.#keys.has('W')) {
            this.#pitchTarget += speed;
        }
        if (this.#keys.has('ArrowDown')  || this.#keys.has('s') || this.#keys.has('S')) {
            this.#pitchTarget -= speed;
        }

        this.#pitchTarget = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, this.#pitchTarget));
        this.#yawTarget   = ((this.#yawTarget % TWO_PI) + TWO_PI) % TWO_PI;
    }

    #onGyro({ beta, gamma }) {
        if (this.#gyroBaseBeta  === null) this.#gyroBaseBeta  = beta;
        if (this.#gyroBaseGamma === null) this.#gyroBaseGamma = gamma;

        const dBeta  = (beta  - this.#gyroBaseBeta)  * TO_RAD * this.#gyroSensitivity;
        const dGamma = (gamma - this.#gyroBaseGamma) * TO_RAD * this.#gyroSensitivity;

        this.#pitchTarget = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, dBeta));
        this.#yawTarget   = ((- dGamma % TWO_PI) + TWO_PI) % TWO_PI;
    }

    #onPinch({ delta }) {
        this.#fovTarget += delta * this.#pinchSensitivity;
        this.#fovTarget  = Math.max(this.#fovMin, Math.min(this.#fovMax, this.#fovTarget));
    }

    #buildView() {
        this.#quatY.setFromAxisAngle(this.#axisY, this.#yaw);
        this.#quatX.setFromAxisAngle(this.#axisX, this.#pitch);
        this.#quatCombined.multiplyQuaternions(this.#quatY, this.#quatX);
        this.#viewMatrix.makeRotationFromQuaternion(this.#quatCombined);
        this.#vpMatrix.multiplyMatrices(this.#projMatrix, this.#viewMatrix);
    }

    #buildProjection() {
        const aspect = resizeHandler.aspect || 1;
        const near   = 0.1;
        const far    = 100000;
        const top    = near * Math.tan(this.#fov * TO_RAD / 2);
        const right  = top * aspect;
        this.#projMatrix.makePerspective(-right, right, top, -top, near, far);
        this.#vpMatrix.multiplyMatrices(this.#projMatrix, this.#viewMatrix);
    }

    setFov(fov) {
        this.#fovTarget = Math.max(this.#fovMin, Math.min(this.#fovMax, fov));
    }

    setOrientation(yaw, pitch) {
        this.#yawTarget   = ((yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.#pitchTarget = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, pitch));
    }

    setAutoRotateSpeed(speed) {
        this.#autoRotateSpeed = speed;
    }

    setSensitivity(drag, key, gyro, pinch) {
        if (drag  !== undefined) this.#dragSensitivity  = drag;
        if (key   !== undefined) this.#keySensitivity   = key;
        if (gyro  !== undefined) this.#gyroSensitivity  = gyro;
        if (pinch !== undefined) this.#pinchSensitivity = pinch;
    }

    resetGyroBaseline() {
        this.#gyroBaseBeta  = null;
        this.#gyroBaseGamma = null;
    }

    get viewMatrix()  { return this.#viewMatrix; }
    get projMatrix()  { return this.#projMatrix; }
    get vpMatrix()    { return this.#vpMatrix; }
    get yaw()         { return this.#yaw; }
    get pitch()       { return this.#pitch; }
    get fov()         { return this.#fov; }

    destroy() {
        if (this.#offDrag)   this.#offDrag();
        if (this.#offKey)    this.#offKey();
        if (this.#offGyro)   this.#offGyro();
        if (this.#offPinch)  this.#offPinch();
        if (this.#offResize) this.#offResize();
        this.#keys.clear();
        this.#gyroBaseBeta  = null;
        this.#gyroBaseGamma = null;
    }
}

export const camera = new Camera(); 
