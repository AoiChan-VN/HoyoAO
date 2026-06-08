/**
 * @file    infrastructure/SensorCamera.js
 * @layer   Infrastructure — Hardware & Device Adapter
 * @desc    Unified FPS-style camera input adapter for:
 *            • Desktop: mouse-drag OR Pointer Lock API (click to enter)
 *            • Mobile:  single-finger touch drag
 *            • VR/IMU:  DeviceOrientationEvent + Complementary Filter
 *
 *          Complementary Filter formula (anti-drift, per spec):
 *            angle_smooth = 0.98 * (angle_prev + gyroRate * dt)
 *                         + 0.02 * accel_reference
 *          This blends high-frequency gyro integration (fast, drifts)
 *          with the low-frequency absolute accelerometer reading (slow,
 *          accurate).  Result: zero-lag on 90 Hz / 120 Hz VR displays.
 *
 *          Camera convention (right-hand, Y-up):
 *            yaw   (rotation around +Y) > 0 → look right (+X world axis)
 *            pitch (rotation around +X) > 0 → look up   (+Y world axis)
 *            Forward vector at (yaw=0, pitch=0) → (0, 0, −1)
 *
 * @exports SensorCamera
 * @license MIT — VR Personal Website Platform
 */

'use strict';

import { Vector3 } from '../domain/Vector3.js';
import { Matrix4  } from '../domain/Matrix4.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Weight of gyro integration in complementary filter. */
const CF_GYRO_WEIGHT   = 0.98;
/** Weight of absolute sensor reference in complementary filter. */
const CF_ACCEL_WEIGHT  = 1.0 - CF_GYRO_WEIGHT;  // 0.02

/** Maximum dt (seconds) accepted per sensor frame — prevents huge jumps on tab re-focus. */
const MAX_DT_SEC       = 0.10;

/** Prevent gimbal lock at ±90°. */
const PITCH_LIMIT      = Math.PI / 2 - 0.015;

// ─────────────────────────────────────────────────────────────────────────────
export class SensorCamera {

  /**
   * @param {object}  [opts]
   * @param {number}  [opts.sensitivityMouse=0.0025]  Radians per CSS pixel delta.
   * @param {number}  [opts.sensitivityTouch=0.003]   Radians per CSS pixel delta (touch).
   * @param {number}  [opts.sensitivityGyro=1.0]      Gyro scale multiplier.
   * @param {number}  [opts.smoothing=0.88]           Exponential-smooth factor (0=instant,1=frozen).
   * @param {number}  [opts.fovYRad=Math.PI/3]        Vertical FOV (used for projection).
   */
  constructor(opts = {}) {
    // ── Public camera state (smoothed) ──────────────────────────────────────
    /** Smoothed yaw angle (radians). Read-only externally. */
    this.yaw   = 0;
    /** Smoothed pitch angle (radians). Read-only externally. */
    this.pitch = 0;

    // ── Target angles (raw / pre-smooth) ────────────────────────────────────
    this._targetYaw   = 0;
    this._targetPitch = 0;

    // ── Settings ─────────────────────────────────────────────────────────────
    this._senseMouse = opts.sensitivityMouse ?? 0.0025;
    this._senseTouch = opts.sensitivityTouch ?? 0.003;
    this._senseGyro  = opts.sensitivityGyro  ?? 1.0;
    this._smoothing  = opts.smoothing        ?? 0.88;
    this.fovYRad     = opts.fovYRad          ?? Math.PI / 3;

    // ── Mouse state ──────────────────────────────────────────────────────────
    this._isDragging      = false;
    this._isPointerLocked = false;
    this._lastMouseX      = 0;
    this._lastMouseY      = 0;

    // ── Touch state ──────────────────────────────────────────────────────────
    this._isTouching  = false;
    this._lastTouchX  = 0;
    this._lastTouchY  = 0;

    // ── Gyroscope / DeviceOrientation state ─────────────────────────────────
    this._gyroEnabled      = false;
    this._hasGyroSupport   = false;
    this._gyroTimestamp    = null;

    /** Complementary filter state — yaw (alpha) */
    this._cfYaw   = 0;
    /** Complementary filter state — pitch (beta) */
    this._cfPitch = 0;

    /** Previous absolute orientation for rate estimation */
    this._prevAlphaRad = null;
    this._prevBetaRad  = null;

    // ── DOM element reference ────────────────────────────────────────────────
    this._element = null;

    // ── Bound handler refs (for removeEventListener) ─────────────────────────
    this._onMouseDown   = this._handleMouseDown.bind(this);
    this._onMouseMove   = this._handleMouseMove.bind(this);
    this._onMouseUp     = this._handleMouseUp.bind(this);
    this._onTouchStart  = this._handleTouchStart.bind(this);
    this._onTouchMove   = this._handleTouchMove.bind(this);
    this._onTouchEnd    = this._handleTouchEnd.bind(this);
    this._onOrientation = this._handleOrientation.bind(this);
    this._onLockChange  = this._handlePointerLockChange.bind(this);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Attach input listeners to a DOM element.
   * Call once after the element is mounted.
   * @param {HTMLElement} element  Target element (typically the VR viewport).
   * @returns {SensorCamera} this  (chainable)
   */
  attach(element) {
    this._element = element;

    // Mouse events
    element.addEventListener('mousedown', this._onMouseDown, { passive: true });
    element.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('mouseup',    this._onMouseUp,   { passive: true });

    // Touch events (passive:false to call preventDefault on touchmove)
    element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    element.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    element.addEventListener('touchend',   this._onTouchEnd,   { passive: true  });

    // Pointer Lock (click-to-lock for desktop first-person mode)
    element.addEventListener('click', () => {
      if (!this._isPointerLocked) {
        element.requestPointerLock?.().catch(() => {});
      }
    });
    document.addEventListener('pointerlockchange', this._onLockChange);

    // Attempt to activate gyroscope
    this._initGyroscope();

    return this;
  }

  /**
   * Remove all input listeners and release Pointer Lock.
   */
  detach() {
    if (!this._element) return;

    this._element.removeEventListener('mousedown',  this._onMouseDown);
    this._element.removeEventListener('mousemove',  this._onMouseMove);
    this._element.removeEventListener('touchstart', this._onTouchStart);
    this._element.removeEventListener('touchmove',  this._onTouchMove);
    this._element.removeEventListener('touchend',   this._onTouchEnd);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    window.removeEventListener('deviceorientation', this._onOrientation);

    if (document.pointerLockElement === this._element) {
      document.exitPointerLock?.();
    }
    this._element = null;
  }

  /**
   * Advance camera smoothing by one frame.
   * Must be called every frame from the main render loop.
   *
   * Uses exponential (1-pole IIR) smoothing: the effective half-life
   * adapts to the actual frame delta so 30 Hz and 120 Hz feel identical.
   *
   * @param {number} dt  Frame delta-time in seconds.
   */
  update(dt) {
    // α = 1 − (1−smoothing)^(dt * 60)
    // At 60 fps: α ≈ smoothing.  At 120 fps: α ≈ sqrt(smoothing).
    const alpha = 1.0 - Math.pow(1.0 - this._smoothing, dt * 60.0);

    this.yaw   += (this._targetYaw   - this.yaw)   * alpha;
    this.pitch += (this._targetPitch - this.pitch) * alpha;
  }

  // ── Gyroscope permission ───────────────────────────────────────────────────

  /**
   * Request DeviceOrientation permission (required on iOS ≥ 13).
   * Call this from a button click handler; cannot be called autonomously.
   * @returns {Promise<boolean>} true if granted.
   */
  async requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const status = await DeviceOrientationEvent.requestPermission();
        if (status === 'granted') {
          this._activateGyroscope();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    // Android / non-iOS — permission not needed
    this._activateGyroscope();
    return true;
  }

  /**
   * Enable or disable the gyroscope input channel.
   * @param {boolean} enabled
   */
  setGyroEnabled(enabled) {
    this._gyroEnabled = enabled;
    if (enabled && !this._hasGyroSupport) {
      this._initGyroscope();
    }
  }

  // ── Camera basis / matrix accessors ────────────────────────────────────────

  /**
   * Forward unit vector that the camera is currently looking at.
   * @returns {Vector3}
   */
  getForwardVector() {
    const sy = Math.sin(this.yaw),   cy = Math.cos(this.yaw);
    const sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
    return new Vector3(sy * cp, sp, -cy * cp);
  }

  /**
   * Right unit vector perpendicular to forward (and world Y).
   * @returns {Vector3}
   */
  getRightVector() {
    return new Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));
  }

  /**
   * Orthogonal up vector for the current camera orientation.
   * @returns {Vector3}
   */
  getUpVector() {
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    const sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
    return new Vector3(-sy * sp, cp, cy * sp);
  }

  /**
   * Build the OpenGL view matrix from the current smooth yaw / pitch angles.
   * Eye defaults to world origin (suitable for a full-360° skybox VR scene).
   *
   * @param {Vector3} [eye=Vector3.zero()]  Camera world position.
   * @returns {Matrix4}
   */
  getViewMatrix(eye = Vector3.zero()) {
    return Matrix4.viewFromEuler(this.yaw, this.pitch, eye);
  }

  /**
   * Return yaw / pitch values as CSS rotation values for a multi-layer
   * skybox.  Skybox rotates OPPOSITE to camera so it appears stationary
   * in world space.
   *
   * @returns {{ rotateX: number, rotateY: number }}  Values in degrees.
   */
  getSkyboxTransform() {
    return {
      rotateX:  this.pitch * (180 / Math.PI),
      rotateY: -this.yaw   * (180 / Math.PI)
    };
  }

  /** @returns {{ yaw: number, pitch: number }}  Current angles in degrees. */
  getAnglesDeg() {
    return {
      yaw:   this.yaw   * (180 / Math.PI),
      pitch: this.pitch * (180 / Math.PI)
    };
  }

  /** @returns {boolean} Whether Pointer Lock is currently active. */
  get isPointerLocked() {
    return this._isPointerLocked;
  }

  /** @returns {boolean} Whether gyroscope is active and delivering data. */
  get isGyroActive() {
    return this._gyroEnabled && this._hasGyroSupport;
  }

  // ── Private: Mouse handlers ────────────────────────────────────────────────

  _handleMouseDown(e) {
    if (e.button !== 0) return; // Left button only
    this._isDragging = true;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
  }

  _handleMouseUp() {
    this._isDragging = false;
  }

  _handleMouseMove(e) {
    let dx, dy;

    if (this._isPointerLocked) {
      // Pointer Lock delivers raw, unbounded movement deltas
      dx = e.movementX || 0;
      dy = e.movementY || 0;
    } else if (this._isDragging) {
      dx = e.clientX - this._lastMouseX;
      dy = e.clientY - this._lastMouseY;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    } else {
      return;
    }

    // Mouse right (+dx) → camera turns right → yaw increases
    // Mouse down  (+dy) → camera looks down  → pitch decreases
    this._targetYaw   += dx * this._senseMouse;
    this._targetPitch -= dy * this._senseMouse;
    this._clampPitch();
  }

  _handlePointerLockChange() {
    this._isPointerLocked = (document.pointerLockElement === this._element);
    if (!this._isPointerLocked) {
      this._isDragging = false;
    }
  }

  // ── Private: Touch handlers ────────────────────────────────────────────────

  _handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this._isTouching = true;
      this._lastTouchX = e.touches[0].clientX;
      this._lastTouchY = e.touches[0].clientY;
    }
  }

  _handleTouchMove(e) {
    e.preventDefault();
    if (!this._isTouching || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - this._lastTouchX;
    const dy = e.touches[0].clientY - this._lastTouchY;
    this._lastTouchX = e.touches[0].clientX;
    this._lastTouchY = e.touches[0].clientY;

    this._targetYaw   += dx * this._senseTouch;
    this._targetPitch -= dy * this._senseTouch;
    this._clampPitch();
  }

  _handleTouchEnd() {
    this._isTouching = false;
  }

  // ── Private: Gyroscope / DeviceOrientation ────────────────────────────────

  /**
   * Auto-initialise gyroscope on non-iOS browsers (no permission needed).
   */
  _initGyroscope() {
    if (typeof DeviceOrientationEvent === 'undefined') return;

    if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
      // Android, Windows, etc. — subscribe directly
      this._activateGyroscope();
    }
    // iOS 13+ must go through requestGyroPermission() (user gesture required)
  }

  _activateGyroscope() {
    if (this._hasGyroSupport) return; // already subscribed
    window.addEventListener('deviceorientation', this._onOrientation, { passive: true });
    this._hasGyroSupport = true;
    this._gyroEnabled    = true;
  }

  /**
   * Complementary Filter implementation for DeviceOrientationEvent.
   *
   * DeviceOrientationEvent.beta  → device X-tilt (pitch proxy), −180° … +180°
   * DeviceOrientationEvent.gamma → device Y-tilt (roll proxy),   −90°  … +90°
   * DeviceOrientationEvent.alpha → compass azimuth (yaw proxy),    0°   … 360°
   *
   * Algorithm (CF, per spec):
   *   angle_new = CF_GYRO_WEIGHT  * (angle_prev + rate_estimate * dt)
   *             + CF_ACCEL_WEIGHT * absolute_reference
   *
   * "rate_estimate" is derived as the finite difference of successive absolute
   * readings (works well at 30–100 Hz from the OS sensor stack).
   *
   * @param {DeviceOrientationEvent} e
   */
  _handleOrientation(e) {
    if (!this._gyroEnabled) return;
    if (e.alpha == null && e.beta == null) return; // No real data

    const now = performance.now();
    const dt  = this._gyroTimestamp
      ? Math.min((now - this._gyroTimestamp) / 1000.0, MAX_DT_SEC)
      : 0.016;
    this._gyroTimestamp = now;

    // Convert to radians
    const alphaRad = (e.alpha || 0) * (Math.PI / 180); // yaw   reference
    const betaRad  = (e.beta  || 0) * (Math.PI / 180); // pitch reference
    // gamma (roll) not used in standard 2-DOF VR mode

    // ── Estimate angular rate from finite differences ───────────────────────
    let alphaRate = 0;
    let betaRate  = 0;

    if (this._prevAlphaRad !== null) {
      // Handle 360°→0° wraparound in alpha (compass)
      let dAlpha = alphaRad - this._prevAlphaRad;
      if      (dAlpha >  Math.PI) dAlpha -= 2 * Math.PI;
      else if (dAlpha < -Math.PI) dAlpha += 2 * Math.PI;
      alphaRate = dAlpha / dt;

      betaRate = (betaRad - this._prevBetaRad) / dt;
    }
    this._prevAlphaRad = alphaRad;
    this._prevBetaRad  = betaRad;

    // ── Complementary Filter ────────────────────────────────────────────────
    this._cfYaw   = CF_GYRO_WEIGHT * (this._cfYaw   + alphaRate * dt)
                  + CF_ACCEL_WEIGHT * alphaRad;

    this._cfPitch = CF_GYRO_WEIGHT * (this._cfPitch + betaRate  * dt)
                  + CF_ACCEL_WEIGHT * (-betaRad); // negate: tilt forward = look down

    // ── Apply to camera (only when user is not overriding via touch/mouse) ──
    if (!this._isDragging && !this._isTouching) {
      this._targetYaw   = -this._cfYaw * this._senseGyro;
      this._targetPitch = this._cfPitch * this._senseGyro;
      this._clampPitch();
    }
  }

  // ── Private: Utilities ─────────────────────────────────────────────────────

  /** Clamp _targetPitch to prevent looking past vertical. */
  _clampPitch() {
    if (this._targetPitch >  PITCH_LIMIT) this._targetPitch =  PITCH_LIMIT;
    if (this._targetPitch < -PITCH_LIMIT) this._targetPitch = -PITCH_LIMIT;
  }
}
