export class Mat4 {
  static create() {
    const out = new Float32Array(16);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }

  static identity(out) {
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }

  static perspective(out, fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1.0 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
  }

  static multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }

  static fromXRotation(out, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = c; out[6] = s; out[7] = 0;
    out[8] = 0; out[9] = -s; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }

  static fromYRotation(out, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = c; out[1] = 0; out[2] = -s; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = s; out[9] = 0; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }
}

export class Quat {
  static create() {
    const out = new Float32Array(4);
    out[3] = 1;
    return out;
  }

  static fromEuler(out, x, y, z) {
    const halfX = x * 0.5;
    const halfY = y * 0.5;
    const halfZ = z * 0.5;

    const sx = Math.sin(halfX);
    const cx = Math.cos(halfX);
    const sy = Math.sin(halfY);
    const cy = Math.cos(halfY);
    const sz = Math.sin(halfZ);
    const cz = Math.cos(halfZ);

    out[0] = sx * cy * cz - cx * sy * sz;
    out[1] = cx * sy * cz + sx * cy * sz;
    out[2] = cx * cy * sz - sx * sy * cz;
    out[3] = cx * cy * cz + sx * sy * sz;
    return out;
  }

  static toMat4(out, q) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;

    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
}

export class VRCameraController {
  constructor() {
    this.lon = 0;
    this.lat = 0;
    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.hasGyro = false;
    this.gyroMatrix = Mat4.create();
    this.screenMatrix = Mat4.create();
    
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
    this.onScreenOrientation = this.onScreenOrientation.bind(this);
  }

  init() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.onDeviceOrientation, true);
    }
    window.addEventListener('orientationchange', this.onScreenOrientation, true);
    this.onScreenOrientation();
  }

  onDeviceOrientation(e) {
    if (e.alpha !== null && e.alpha !== undefined) {
      this.hasGyro = true;
      this.deviceOrientation.alpha = e.alpha;
      this.deviceOrientation.beta = e.beta;
      this.deviceOrientation.gamma = e.gamma;
    }
  }

  onScreenOrientation() {
    const angle = window.orientation || 0;
    const rad = angle * (Math.PI / 180);
    Mat4.fromYRotation(this.screenMatrix, -rad);
  }

  updateCameraMatrix(outViewMatrix, mouseState) {
    if (this.hasGyro && mouseState.useGyro) {
      const alpha = this.deviceOrientation.alpha * (Math.PI / 180);
      const beta = this.deviceOrientation.beta * (Math.PI / 180);
      const gamma = this.deviceOrientation.gamma * (Math.PI / 180);

      const q = Quat.create();
      Quat.fromEuler(q, beta, alpha, -gamma);
      Quat.toMat4(this.gyroMatrix, q);

      Mat4.identity(outViewMatrix);
      Mat4.multiply(outViewMatrix, outViewMatrix, this.gyroMatrix);
      Mat4.multiply(outViewMatrix, outViewMatrix, this.screenMatrix);
    } else {
      this.lon += mouseState.deltaX;
      this.lat = Math.max(-85, Math.min(85, this.lat + mouseState.deltaY));

      const phi = (90 - this.lat) * (Math.PI / 180);
      const theta = this.lon * (Math.PI / 180);

      const matX = Mat4.create();
      const matY = Mat4.create();
      Mat4.fromXRotation(matX, phi - Math.PI / 2);
      Mat4.fromYRotation(matY, theta);
      
      Mat4.identity(outViewMatrix);
      Mat4.multiply(outViewMatrix, matX, matY);
    }
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.onDeviceOrientation, true);
    window.removeEventListener('orientationchange', this.onScreenOrientation, true);
  }
  } 
