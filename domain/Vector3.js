/**
 * @file    domain/Vector3.js
 * @layer   Domain — Enterprise Core Math
 * @desc    Immutable-first 3-D vector arithmetic (column-vector, right-hand Y-up).
 *          All "pure" methods return new Vector3 instances; mutating counterparts
 *          end in "Self" for hot-path loops that must avoid GC pressure.
 *
 * @license MIT — VR Personal Website Platform
 */

'use strict';

// ─── Numeric guard ───────────────────────────────────────────────────────────
const EPSILON = 1e-10;

// ─────────────────────────────────────────────────────────────────────────────
export class Vector3 {

  /** @param {number} x @param {number} y @param {number} z */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // ── Mutating setters ────────────────────────────────────────────────────────

  /**
   * Overwrite this vector's components in-place.
   * @param {number} x @param {number} y @param {number} z
   * @returns {Vector3} this
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /** Copy another vector into this. @param {Vector3} v @returns {Vector3} this */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  /** Add v to this in-place. @param {Vector3} v @returns {Vector3} this */
  addSelf(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /** Subtract v from this in-place. @param {Vector3} v @returns {Vector3} this */
  subSelf(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /** Scale this in-place by scalar s. @param {number} s @returns {Vector3} this */
  scaleSelf(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  /** Component-wise multiply this by v in-place. @param {Vector3} v @returns {Vector3} this */
  multiplySelf(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  /**
   * Normalize this in-place. Silently becomes zero-vector if length < EPSILON.
   * @returns {Vector3} this
   */
  normalizeSelf() {
    const l = this.length();
    if (l > EPSILON) {
      this.x /= l;
      this.y /= l;
      this.z /= l;
    } else {
      this.x = 0; this.y = 0; this.z = 0;
    }
    return this;
  }

  /** Negate this in-place. @returns {Vector3} this */
  negateSelf() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  /**
   * Linear interpolate this → v by t in-place.
   * @param {Vector3} v  @param {number} t  [0, 1]
   * @returns {Vector3} this
   */
  lerpSelf(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    this.z += (v.z - this.z) * t;
    return this;
  }

  // ── Pure / immutable operations (return NEW Vector3) ───────────────────────

  /** @returns {Vector3} Deep copy. */
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  /** @returns {Vector3} -this */
  negate() {
    return new Vector3(-this.x, -this.y, -this.z);
  }

  /**
   * @param {Vector3} v
   * @returns {Vector3} this + v
   */
  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  /**
   * @param {Vector3} v
   * @returns {Vector3} this - v
   */
  sub(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * @param {number} s
   * @returns {Vector3} this * s
   */
  scale(s) {
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }

  /**
   * Component-wise multiply.
   * @param {Vector3} v
   * @returns {Vector3} new Vector3(this.x*v.x, this.y*v.y, this.z*v.z)
   */
  multiply(v) {
    return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  /**
   * Return normalized copy. Returns zero-vector if nearly zero-length.
   * @returns {Vector3}
   */
  normalize() {
    const l = this.length();
    if (l < EPSILON) return new Vector3(0, 0, 0);
    return new Vector3(this.x / l, this.y / l, this.z / l);
  }

  /**
   * Linear interpolation: this + (v - this) * t
   * @param {Vector3} v @param {number} t
   * @returns {Vector3}
   */
  lerp(v, t) {
    return new Vector3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }

  /**
   * Reflect this direction around normal n.
   * Formula: r = this - 2 * (this·n) * n
   * @param {Vector3} n  Unit normal vector.
   * @returns {Vector3}
   */
  reflect(n) {
    const d = 2.0 * this.dot(n);
    return new Vector3(
      this.x - d * n.x,
      this.y - d * n.y,
      this.z - d * n.z
    );
  }

  // ── Scalar results ──────────────────────────────────────────────────────────

  /** @param {Vector3} v @returns {number} Dot product. */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /** @returns {number} Squared length (avoids sqrt). */
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /** @returns {number} Euclidean length. */
  length() {
    return Math.sqrt(this.lengthSq());
  }

  /**
   * @param {Vector3} v
   * @returns {number} Euclidean distance.
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * @param {Vector3} v
   * @returns {number} Squared distance (avoids sqrt).
   */
  distanceSqTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  // ── Cross product ───────────────────────────────────────────────────────────

  /**
   * Right-hand cross product: this × v
   * @param {Vector3} v
   * @returns {Vector3} Perpendicular to both vectors.
   */
  cross(v) {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  // ── Matrix transforms ───────────────────────────────────────────────────────

  /**
   * Apply a full Matrix4 (4×4 homogeneous) to this vector.
   * Performs perspective divide if w ≠ 1.
   * @param {import('./Matrix4.js').Matrix4} m
   * @returns {Vector3} Transformed vector.
   */
  applyMatrix4(m) {
    const e = m.elements;
    const x = this.x, y = this.y, z = this.z;
    // w component (for perspective divide)
    const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    const invW = (Math.abs(w) > EPSILON) ? 1.0 / w : 1.0;
    return new Vector3(
      (e[0]  * x + e[4]  * y + e[8]  * z + e[12]) * invW,
      (e[1]  * x + e[5]  * y + e[9]  * z + e[13]) * invW,
      (e[2]  * x + e[6]  * y + e[10] * z + e[14]) * invW
    );
  }

  /**
   * Apply only the upper-left 3×3 rotation block of a Matrix4.
   * Correct for transforming normals and direction vectors (ignores translation).
   * @param {import('./Matrix4.js').Matrix4} m
   * @returns {Vector3}
   */
  applyMatrix3(m) {
    const e = m.elements;
    const x = this.x, y = this.y, z = this.z;
    return new Vector3(
      e[0] * x + e[4] * y + e[8]  * z,
      e[1] * x + e[5] * y + e[9]  * z,
      e[2] * x + e[6] * y + e[10] * z
    );
  }

  // ── Conversion helpers ──────────────────────────────────────────────────────

  /** @returns {[number, number, number]} Plain JS array [x, y, z]. */
  toArray() {
    return [this.x, this.y, this.z];
  }

  /** @returns {Float32Array} Typed array for WebGL uniform uploads. */
  toFloat32Array() {
    return new Float32Array([this.x, this.y, this.z]);
  }

  /**
   * Populate this from a flat array.
   * @param {ArrayLike<number>} arr @param {number} [offset=0]
   * @returns {Vector3} this
   */
  fromArray(arr, offset = 0) {
    this.x = arr[offset];
    this.y = arr[offset + 1];
    this.z = arr[offset + 2];
    return this;
  }

  /**
   * Component-wise equality within epsilon tolerance.
   * @param {Vector3} v @param {number} [eps=EPSILON]
   * @returns {boolean}
   */
  equals(v, eps = EPSILON) {
    return (
      Math.abs(this.x - v.x) < eps &&
      Math.abs(this.y - v.y) < eps &&
      Math.abs(this.z - v.z) < eps
    );
  }

  /** @returns {string} Human-readable form for debugging. */
  toString() {
    return `Vector3(${this.x.toFixed(5)}, ${this.y.toFixed(5)}, ${this.z.toFixed(5)})`;
  }

  // ── Static factory constants ────────────────────────────────────────────────

  /**
   * Construct from flat array.
   * @param {ArrayLike<number>} arr @param {number} [offset=0]
   * @returns {Vector3}
   */
  static fromArray(arr, offset = 0) {
    return new Vector3(arr[offset], arr[offset + 1], arr[offset + 2]);
  }

  static zero()    { return new Vector3( 0,  0,  0); }
  static one()     { return new Vector3( 1,  1,  1); }
  static up()      { return new Vector3( 0,  1,  0); }
  static down()    { return new Vector3( 0, -1,  0); }
  /** Default forward: camera looks −Z in right-hand / OpenGL system. */
  static forward() { return new Vector3( 0,  0, -1); }
  static back()    { return new Vector3( 0,  0,  1); }
  static right()   { return new Vector3( 1,  0,  0); }
  static left()    { return new Vector3(-1,  0,  0); }
} 
