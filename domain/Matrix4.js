/**
 * @file    domain/Matrix4.js
 * @layer   Domain — Enterprise Core Math
 * @desc    Column-major 4×4 matrix (OpenGL / WebGL convention).
 *          Storage layout (column-major, 16 Float32 values):
 *
 *          col:  0     1     2     3
 *          row0: e[0]  e[4]  e[8]  e[12]
 *          row1: e[1]  e[5]  e[9]  e[13]
 *          row2: e[2]  e[6]  e[10] e[14]
 *          row3: e[3]  e[7]  e[11] e[15]
 *
 *          Element (row i, col j) → elements[j*4 + i]
 *
 * @license MIT — VR Personal Website Platform
 */

'use strict';

import { Vector3 } from './Vector3.js';

// ─── Numeric guard ───────────────────────────────────────────────────────────
const EPSILON = 1e-10;

// ─────────────────────────────────────────────────────────────────────────────
export class Matrix4 {

  constructor() {
    /**
     * Internal Float32Array in column-major order.
     * Initialized as the 4×4 identity matrix.
     * @type {Float32Array}
     */
    this.elements = new Float32Array([
      1, 0, 0, 0,   // col 0
      0, 1, 0, 0,   // col 1
      0, 0, 1, 0,   // col 2
      0, 0, 0, 1    // col 3
    ]);
  }

  // ── Identity ────────────────────────────────────────────────────────────────

  /**
   * Reset this matrix to the identity matrix in-place.
   * @returns {Matrix4} this
   */
  identity() {
    const e = this.elements;
    e[0]=1; e[1]=0; e[2]=0; e[3]=0;
    e[4]=0; e[5]=1; e[6]=0; e[7]=0;
    e[8]=0; e[9]=0; e[10]=1; e[11]=0;
    e[12]=0; e[13]=0; e[14]=0; e[15]=1;
    return this;
  }

  // ── Clone / Copy ────────────────────────────────────────────────────────────

  /** @returns {Matrix4} Deep copy. */
  clone() {
    const m = new Matrix4();
    m.elements.set(this.elements);
    return m;
  }

  /**
   * Copy another matrix into this in-place.
   * @param {Matrix4} m
   * @returns {Matrix4} this
   */
  copy(m) {
    this.elements.set(m.elements);
    return this;
  }

  // ── Multiplication ──────────────────────────────────────────────────────────

  /**
   * Return a NEW matrix = this × m.
   * @param {Matrix4} m
   * @returns {Matrix4}
   */
  multiply(m) {
    return Matrix4.multiply(this, m);
  }

  /**
   * Return a NEW matrix = m × this  (pre-multiply).
   * @param {Matrix4} m
   * @returns {Matrix4}
   */
  premultiply(m) {
    return Matrix4.multiply(m, this);
  }

  /**
   * Static matrix multiply: returns a NEW Matrix4 = a × b.
   * Uses fully-unrolled 64-multiply form for maximum JIT performance.
   * Column-major convention: C[col][row] = Σ_k A[k][row] * B[col][k]
   *                    i.e. te[j*4+i] = Σ_k ae[k*4+i] * be[j*4+k]
   *
   * @param {Matrix4} a
   * @param {Matrix4} b
   * @returns {Matrix4}
   */
  static multiply(a, b) {
    const result = new Matrix4();
    const ae = a.elements;
    const be = b.elements;
    const te = result.elements;

    // Rows of A × columns of B, unrolled over 4 columns × 4 rows = 16 elements.
    // For column j, row i: te[j*4+i] = ae[0*4+i]*be[j*4+0] + ae[1*4+i]*be[j*4+1]
    //                                 + ae[2*4+i]*be[j*4+2] + ae[3*4+i]*be[j*4+3]
    //
    // col 0 (j=0):
    te[0]  = ae[0]*be[0]  + ae[4]*be[1]  + ae[8]*be[2]  + ae[12]*be[3];
    te[1]  = ae[1]*be[0]  + ae[5]*be[1]  + ae[9]*be[2]  + ae[13]*be[3];
    te[2]  = ae[2]*be[0]  + ae[6]*be[1]  + ae[10]*be[2] + ae[14]*be[3];
    te[3]  = ae[3]*be[0]  + ae[7]*be[1]  + ae[11]*be[2] + ae[15]*be[3];
    // col 1 (j=1):
    te[4]  = ae[0]*be[4]  + ae[4]*be[5]  + ae[8]*be[6]  + ae[12]*be[7];
    te[5]  = ae[1]*be[4]  + ae[5]*be[5]  + ae[9]*be[6]  + ae[13]*be[7];
    te[6]  = ae[2]*be[4]  + ae[6]*be[5]  + ae[10]*be[6] + ae[14]*be[7];
    te[7]  = ae[3]*be[4]  + ae[7]*be[5]  + ae[11]*be[6] + ae[15]*be[7];
    // col 2 (j=2):
    te[8]  = ae[0]*be[8]  + ae[4]*be[9]  + ae[8]*be[10] + ae[12]*be[11];
    te[9]  = ae[1]*be[8]  + ae[5]*be[9]  + ae[9]*be[10] + ae[13]*be[11];
    te[10] = ae[2]*be[8]  + ae[6]*be[9]  + ae[10]*be[10]+ ae[14]*be[11];
    te[11] = ae[3]*be[8]  + ae[7]*be[9]  + ae[11]*be[10]+ ae[15]*be[11];
    // col 3 (j=3):
    te[12] = ae[0]*be[12] + ae[4]*be[13] + ae[8]*be[14] + ae[12]*be[15];
    te[13] = ae[1]*be[12] + ae[5]*be[13] + ae[9]*be[14] + ae[13]*be[15];
    te[14] = ae[2]*be[12] + ae[6]*be[13] + ae[10]*be[14]+ ae[14]*be[15];
    te[15] = ae[3]*be[12] + ae[7]*be[13] + ae[11]*be[14]+ ae[15]*be[15];

    return result;
  }

  // ── Projection matrices ─────────────────────────────────────────────────────

  /**
   * Create a perspective projection matrix (OpenGL NDC, Z from −1 to +1).
   *
   * @param {number} fovYRad  Vertical field of view in radians.
   * @param {number} aspect   Width / height ratio.
   * @param {number} near     Near clip plane distance (> 0).
   * @param {number} far      Far  clip plane distance (> near).
   * @returns {Matrix4}
   */
  static perspective(fovYRad, aspect, near, far) {
    const m   = new Matrix4();
    const e   = m.elements;
    const f   = 1.0 / Math.tan(fovYRad * 0.5); // cot(fovY/2)
    const nf  = 1.0 / (near - far);

    // Column-major layout:
    // [ f/aspect  0    0                    0            ]
    // [ 0         f    0                    0            ]
    // [ 0         0    (far+near)/(near-far) 2*far*near/(near-far) ]
    // [ 0         0   -1                    0            ]
    m.identity();            // start from zero (not all needed but safe)

    e[0]  = f / aspect;      // col0, row0
    e[5]  = f;               // col1, row1
    e[10] = (far + near) * nf;   // col2, row2
    e[11] = -1;              // col2, row3  ← sets w = -z_view
    e[14] = 2.0 * far * near * nf; // col3, row2
    e[15] = 0;               // col3, row3

    return m;
  }

  /**
   * Asymmetric frustum matrix (useful for VR stereo offsets).
   * @param {number} left   @param {number} right
   * @param {number} bottom @param {number} top
   * @param {number} near   @param {number} far
   * @returns {Matrix4}
   */
  static frustum(left, right, bottom, top, near, far) {
    const m  = new Matrix4();
    const e  = m.elements;
    const rl = 1.0 / (right - left);
    const tb = 1.0 / (top - bottom);
    const nf = 1.0 / (near - far);

    e[0]  = 2.0 * near * rl;
    e[5]  = 2.0 * near * tb;
    e[8]  = (right + left) * rl;
    e[9]  = (top + bottom) * tb;
    e[10] = (far + near) * nf;
    e[11] = -1;
    e[14] = 2.0 * far * near * nf;
    e[15] = 0;

    return m;
  }

  /**
   * Orthographic projection.
   * @param {number} left @param {number} right
   * @param {number} bottom @param {number} top
   * @param {number} near @param {number} far
   * @returns {Matrix4}
   */
  static orthographic(left, right, bottom, top, near, far) {
    const m  = new Matrix4();
    const e  = m.elements;
    const rl = 1.0 / (right - left);
    const tb = 1.0 / (top - bottom);
    const nf = 1.0 / (near - far);

    e[0]  = 2.0 * rl;
    e[5]  = 2.0 * tb;
    e[10] = 2.0 * nf;
    e[12] = -(right + left) * rl;
    e[13] = -(top + bottom) * tb;
    e[14] = (far + near) * nf;

    return m;
  }

  // ── View matrix ─────────────────────────────────────────────────────────────

  /**
   * Classic LookAt view matrix (camera at `eye`, looking toward `target`,
   * with `up` as the world-up hint).
   *
   * Produces the column-major view matrix that transforms world-space
   * positions into camera / eye space.
   *
   * @param {Vector3} eye     World position of the camera.
   * @param {Vector3} target  World position being looked at.
   * @param {Vector3} up      World-space up hint (usually +Y).
   * @returns {Matrix4}
   */
  static lookAt(eye, target, up) {
    const m = new Matrix4();
    const e = m.elements;

    // z-axis = normalize(eye - target)  [camera looks −Z, so zAxis points "back"]
    let zAxis = eye.sub(target);
    if (zAxis.lengthSq() < EPSILON) {
      zAxis = new Vector3(0, 0, 1); // degenerate: eye == target
    } else {
      zAxis.normalizeSelf();
    }

    // x-axis = normalize(up × zAxis)  [right]
    let xAxis = up.cross(zAxis);
    if (xAxis.lengthSq() < EPSILON) {
      // up and zAxis are parallel — nudge to break collinearity
      const nudgedZ = new Vector3(zAxis.x, zAxis.y, zAxis.z + 0.0001);
      nudgedZ.normalizeSelf();
      xAxis = up.cross(nudgedZ);
    }
    xAxis.normalizeSelf();

    // y-axis = zAxis × xAxis  [recalculated up — orthogonal]
    const yAxis = zAxis.cross(xAxis);

    // Column-major layout:
    //   col 0: (xAxis.x, yAxis.x, zAxis.x, 0)
    //   col 1: (xAxis.y, yAxis.y, zAxis.y, 0)
    //   col 2: (xAxis.z, yAxis.z, zAxis.z, 0)
    //   col 3: (−xAxis·eye, −yAxis·eye, −zAxis·eye, 1)
    e[0]  = xAxis.x;  e[1]  = yAxis.x;  e[2]  = zAxis.x;  e[3]  = 0;
    e[4]  = xAxis.y;  e[5]  = yAxis.y;  e[6]  = zAxis.y;  e[7]  = 0;
    e[8]  = xAxis.z;  e[9]  = yAxis.z;  e[10] = zAxis.z;  e[11] = 0;
    e[12] = -xAxis.dot(eye);
    e[13] = -yAxis.dot(eye);
    e[14] = -zAxis.dot(eye);
    e[15] = 1;

    return m;
  }

  // ── Euler-angle rotation shortcuts ─────────────────────────────────────────

  /**
   * Build view matrix directly from yaw / pitch Euler angles (FPS camera),
   * skipping the LookAt overhead. Eye defaults to origin.
   *
   * Convention (right-hand Y-up):
   *   yaw   > 0 → turn right (+X direction)
   *   pitch > 0 → look up   (+Y direction)
   *
   * @param {number}  yaw    Radians.
   * @param {number}  pitch  Radians, clamped outside to [−π/2, π/2].
   * @param {Vector3} [eye]  Camera world position.
   * @returns {Matrix4}
   */
  static viewFromEuler(yaw, pitch, eye = Vector3.zero()) {
    const cy = Math.cos(yaw),   sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);

    // Camera basis vectors (world space):
    // right   = ( cos(yaw),           0,          sin(yaw)           )
    // up      = (−sin(yaw)*sin(pitch), cos(pitch), cos(yaw)*sin(pitch))
    // zAxis   = (−sin(yaw)*cos(pitch),−sin(pitch), cos(yaw)*cos(pitch))
    //           [zAxis points backward; camera looks in −zAxis direction]

    const rxX =  cy,      rxY = 0,   rxZ =  sy;
    const ryX = -sy * sp, ryY = cp,  ryZ =  cy * sp;
    const rzX = -sy * cp, rzY = -sp, rzZ =  cy * cp;

    const m = new Matrix4();
    const e = m.elements;

    e[0]  = rxX;  e[1]  = ryX;  e[2]  = rzX;  e[3]  = 0;
    e[4]  = rxY;  e[5]  = ryY;  e[6]  = rzY;  e[7]  = 0;
    e[8]  = rxZ;  e[9]  = ryZ;  e[10] = rzZ;  e[11] = 0;
    e[12] = -(rxX * eye.x + rxY * eye.y + rxZ * eye.z);
    e[13] = -(ryX * eye.x + ryY * eye.y + ryZ * eye.z);
    e[14] = -(rzX * eye.x + rzY * eye.y + rzZ * eye.z);
    e[15] = 1;

    return m;
  }

  // ── Rigid-body transforms ───────────────────────────────────────────────────

  /**
   * Pure translation matrix.
   * @param {number} x @param {number} y @param {number} z
   * @returns {Matrix4}
   */
  static translation(x, y, z) {
    const m = new Matrix4();
    m.elements[12] = x;
    m.elements[13] = y;
    m.elements[14] = z;
    return m;
  }

  /**
   * Uniform or non-uniform scale matrix.
   * @param {number} x @param {number} y @param {number} z
   * @returns {Matrix4}
   */
  static scaling(x, y, z) {
    const m = new Matrix4();
    m.elements[0]  = x;
    m.elements[5]  = y;
    m.elements[10] = z;
    return m;
  }

  /**
   * Rotation around the X axis (right-hand rule, angle in radians).
   * Positive angle → counterclockwise when viewed from +X.
   * @param {number} angle Radians.
   * @returns {Matrix4}
   */
  static rotationX(angle) {
    const m = new Matrix4();
    const e = m.elements;
    const c = Math.cos(angle), s = Math.sin(angle);
    // [ 1  0   0  0 ]
    // [ 0  c  -s  0 ]
    // [ 0  s   c  0 ]
    // [ 0  0   0  1 ]
    e[5]  =  c;  e[6]  = s;
    e[9]  = -s;  e[10] = c;
    return m;
  }

  /**
   * Rotation around the Y axis.
   * Positive angle → counterclockwise viewed from +Y (i.e., looking left).
   * @param {number} angle Radians.
   * @returns {Matrix4}
   */
  static rotationY(angle) {
    const m = new Matrix4();
    const e = m.elements;
    const c = Math.cos(angle), s = Math.sin(angle);
    // [ c  0  s  0 ]
    // [ 0  1  0  0 ]
    // [-s  0  c  0 ]
    // [ 0  0  0  1 ]
    e[0]  =  c;  e[2]  = -s;
    e[8]  =  s;  e[10] =  c;
    return m;
  }

  /**
   * Rotation around the Z axis.
   * @param {number} angle Radians.
   * @returns {Matrix4}
   */
  static rotationZ(angle) {
    const m = new Matrix4();
    const e = m.elements;
    const c = Math.cos(angle), s = Math.sin(angle);
    // [ c -s  0  0 ]
    // [ s  c  0  0 ]
    // [ 0  0  1  0 ]
    // [ 0  0  0  1 ]
    e[0] =  c;  e[1] = s;
    e[4] = -s;  e[5] = c;
    return m;
  }

  /**
   * Rotation around an arbitrary world-space axis (Rodrigues).
   * @param {Vector3} axis  Unit axis (must be normalized).
   * @param {number}  angle Radians.
   * @returns {Matrix4}
   */
  static rotationAxis(axis, angle) {
    const m = new Matrix4();
    const e = m.elements;
    const n = axis.normalize();
    const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
    const { x, y, z } = n;

    // Rodrigues rotation matrix (column-major):
    e[0]  = t*x*x + c;    e[1]  = t*x*y + s*z;  e[2]  = t*x*z - s*y;  e[3]  = 0;
    e[4]  = t*x*y - s*z;  e[5]  = t*y*y + c;    e[6]  = t*y*z + s*x;  e[7]  = 0;
    e[8]  = t*x*z + s*y;  e[9]  = t*y*z - s*x;  e[10] = t*z*z + c;    e[11] = 0;
    e[12] = 0;            e[13] = 0;            e[14] = 0;            e[15] = 1;
    return m;
  }

  // ── Inverse / Transpose ─────────────────────────────────────────────────────

  /**
   * Return the algebraic inverse of this matrix via cofactor expansion.
   * Returns identity if the matrix is singular (det ≈ 0).
   * @returns {Matrix4}
   */
  inverse() {
    const m  = new Matrix4();
    const te = m.elements;
    const e  = this.elements;

    const a00=e[0], a01=e[1], a02=e[2], a03=e[3];
    const a10=e[4], a11=e[5], a12=e[6], a13=e[7];
    const a20=e[8], a21=e[9], a22=e[10],a23=e[11];
    const a30=e[12],a31=e[13],a32=e[14],a33=e[15];

    const b00 = a00*a11 - a01*a10;  const b01 = a00*a12 - a02*a10;
    const b02 = a00*a13 - a03*a10;  const b03 = a01*a12 - a02*a11;
    const b04 = a01*a13 - a03*a11;  const b05 = a02*a13 - a03*a12;
    const b06 = a20*a31 - a21*a30;  const b07 = a20*a32 - a22*a30;
    const b08 = a20*a33 - a23*a30;  const b09 = a21*a32 - a22*a31;
    const b10 = a21*a33 - a23*a31;  const b11 = a22*a33 - a23*a32;

    let det = b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06;
    if (Math.abs(det) < EPSILON) {
      console.warn('[Matrix4.inverse] Singular matrix — returning identity.');
      return m; // already identity from constructor
    }
    det = 1.0 / det;

    te[0]  = ( a11*b11 - a12*b10 + a13*b09) * det;
    te[1]  = (-a01*b11 + a02*b10 - a03*b09) * det;
    te[2]  = ( a31*b05 - a32*b04 + a33*b03) * det;
    te[3]  = (-a21*b05 + a22*b04 - a23*b03) * det;
    te[4]  = (-a10*b11 + a12*b08 - a13*b07) * det;
    te[5]  = ( a00*b11 - a02*b08 + a03*b07) * det;
    te[6]  = (-a30*b05 + a32*b02 - a33*b01) * det;
    te[7]  = ( a20*b05 - a22*b02 + a23*b01) * det;
    te[8]  = ( a10*b10 - a11*b08 + a13*b06) * det;
    te[9]  = (-a00*b10 + a01*b08 - a03*b06) * det;
    te[10] = ( a30*b04 - a31*b02 + a33*b00) * det;
    te[11] = (-a20*b04 + a21*b02 - a23*b00) * det;
    te[12] = (-a10*b09 + a11*b07 - a12*b06) * det;
    te[13] = ( a00*b09 - a01*b07 + a02*b06) * det;
    te[14] = (-a30*b03 + a31*b01 - a32*b00) * det;
    te[15] = ( a20*b03 - a21*b01 + a22*b00) * det;

    return m;
  }

  /**
   * Return the transpose of this matrix.
   * @returns {Matrix4}
   */
  transpose() {
    const m  = new Matrix4();
    const e  = this.elements;
    const te = m.elements;

    te[0]  = e[0];  te[1]  = e[4];  te[2]  = e[8];  te[3]  = e[12];
    te[4]  = e[1];  te[5]  = e[5];  te[6]  = e[9];  te[7]  = e[13];
    te[8]  = e[2];  te[9]  = e[6];  te[10] = e[10]; te[11] = e[14];
    te[12] = e[3];  te[13] = e[7];  te[14] = e[11]; te[15] = e[15];

    return m;
  }

  // ── Determinant ─────────────────────────────────────────────────────────────

  /** @returns {number} Scalar determinant via 2×2 sub-minor expansion. */
  determinant() {
    const e = this.elements;
    const a00=e[0], a01=e[1], a02=e[2], a03=e[3];
    const a10=e[4], a11=e[5], a12=e[6], a13=e[7];
    const a20=e[8], a21=e[9], a22=e[10],a23=e[11];
    const a30=e[12],a31=e[13],a32=e[14],a33=e[15];

    // Leibniz formula via 2×2 sub-minors (mirrors inverse() for consistency)
    const b00 = a00*a11 - a01*a10;  const b01 = a00*a12 - a02*a10;
    const b02 = a00*a13 - a03*a10;  const b03 = a01*a12 - a02*a11;
    const b04 = a01*a13 - a03*a11;  const b05 = a02*a13 - a03*a12;
    const b06 = a20*a31 - a21*a30;  const b07 = a20*a32 - a22*a30;
    const b08 = a20*a33 - a23*a30;  const b09 = a21*a32 - a22*a31;
    const b10 = a21*a33 - a23*a31;  const b11 = a22*a33 - a23*a32;

    return b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06;
  }

  // ── Translation / scale accessors ──────────────────────────────────────────

  /**
   * Extract the translation vector from column 3.
   * @returns {Vector3}
   */
  getTranslation() {
    return new Vector3(this.elements[12], this.elements[13], this.elements[14]);
  }

  /**
   * Overwrite the translation components (column 3) in-place.
   * @param {number} x @param {number} y @param {number} z
   * @returns {Matrix4} this
   */
  setTranslation(x, y, z) {
    this.elements[12] = x;
    this.elements[13] = y;
    this.elements[14] = z;
    return this;
  }

  /**
   * Extract the scale factor for each axis from the length of each basis column.
   * @returns {Vector3}
   */
  getScale() {
    const e = this.elements;
    return new Vector3(
      Math.sqrt(e[0]*e[0] + e[1]*e[1] + e[2]*e[2]),  // |col0|
      Math.sqrt(e[4]*e[4] + e[5]*e[5] + e[6]*e[6]),  // |col1|
      Math.sqrt(e[8]*e[8] + e[9]*e[9] + e[10]*e[10]) // |col2|
    );
  }

  // ── CSS interop ────────────────────────────────────────────────────────────

  /**
   * Return a CSS `matrix3d(...)` string for use with `element.style.transform`.
   * CSS matrix3d accepts column-major order identical to WebGL's Float32 layout.
   * @returns {string}
   */
  toCSSMatrix3d() {
    const e = this.elements;
    // prettier-ignore
    return `matrix3d(${
      e[0]},${e[1]},${e[2]},${e[3]},${
      e[4]},${e[5]},${e[6]},${e[7]},${
      e[8]},${e[9]},${e[10]},${e[11]},${
      e[12]},${e[13]},${e[14]},${e[15]})`;
  }

  // ── Debug ──────────────────────────────────────────────────────────────────

  /** @returns {string} 4-row grid for console display. */
  toString() {
    const e = this.elements;
    const f = (v) => v.toFixed(4).padStart(10);
    return [
      `| ${f(e[0])} ${f(e[4])} ${f(e[8])}  ${f(e[12])} |`,
      `| ${f(e[1])} ${f(e[5])} ${f(e[9])}  ${f(e[13])} |`,
      `| ${f(e[2])} ${f(e[6])} ${f(e[10])} ${f(e[14])} |`,
      `| ${f(e[3])} ${f(e[7])} ${f(e[11])} ${f(e[15])} |`
    ].join('\n');
  }
} 
