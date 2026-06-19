/**
 * @file   js/components/home/skybox-viewer.js
 * @layer  components/home
 * @depends event-bus.js, state-manager.js, config.js, skybox-repository.js
 */

import EventBus,          { EVENTS } from '../../core/event-bus.js';
import StateManager                   from '../../core/state-manager.js';
import Config                         from '../../core/config.js';
import SkyboxRepository               from '../../data/skybox-repository.js';

const SkyboxViewer = (() => {

  // ── DOM refs ─────────────────────────────────────────────────────
  let _cube    = null;
  let _faces   = {};      // { front, back, left, right, top, bottom }
  let _loader  = null;
  let _error   = null;

  // ── RAF ──────────────────────────────────────────────────────────
  let _rafId   = null;
  let _running = false;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _cube   = document.querySelector('[data-skybox-cube]');
    _loader = document.querySelector('[data-home-loader]');
    _error  = document.querySelector('[data-home-error]');

    if (!_cube) {
      console.error('[SkyboxViewer] Không tìm thấy [data-skybox-cube].');
      _showError('Không tìm thấy phần tử Skybox trong DOM.');
      return;
    }

    _cacheFaceRefs();
    _bindEvents();

    const imageSet = SkyboxRepository.getDefault();
    _loadImageSet(imageSet);

    EventBus.emit(EVENTS.SKYBOX_INIT, { imageSetId: imageSet.id });
  }

  // ── Face refs ────────────────────────────────────────────────────

  function _cacheFaceRefs() {
    ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach(face => {
      const el = _cube.querySelector(`[data-face="${face}"]`);
      if (!el) {
        console.warn(`[SkyboxViewer] Thiếu face element: [data-face="${face}"]`);
        return;
      }
      _faces[face] = el;
    });
  }

  // ── Image loading ────────────────────────────────────────────────

  function _loadImageSet(imageSet) {
    const validation = SkyboxRepository.validate(imageSet);
    if (!validation.valid) {
      _showError(`Image set thiếu faces: ${validation.missing.join(', ')}`);
      return;
    }

    const faces   = SkyboxRepository.getFaces(imageSet.id);
    const total   = faces.length;
    let   loaded  = 0;
    let   failed  = 0;

    StateManager.setBatch({
      'skybox.imagesTotal':   total,
      'skybox.imagesLoaded':  0,
      'skybox.ready':         false,
      'skybox.currentImageSet': imageSet.id,
    });

    faces.forEach(({ face, url, alt }) => {
      const faceEl = _faces[face];
      if (!faceEl) return;

      faceEl.setAttribute('data-loading', '');
      faceEl.removeAttribute('data-error');

      const img    = faceEl.querySelector('img') || _createFaceImg(faceEl);
      img.alt      = alt;
      img.removeAttribute('data-loaded');

      const onLoad = () => {
        faceEl.removeAttribute('data-loading');
        img.setAttribute('data-loaded', '');
        loaded++;
        StateManager.set('skybox.imagesLoaded', loaded);
        EventBus.emit(EVENTS.SKYBOX_IMAGE_LOAD, { face, loaded, total });
        if (loaded + failed === total) _onAllLoaded(loaded, total);
      };

      const onError = () => {
        faceEl.removeAttribute('data-loading');
        faceEl.setAttribute('data-error', '');
        failed++;
        console.warn(`[SkyboxViewer] Không tải được ảnh: ${url}`);
        EventBus.emit(EVENTS.SKYBOX_IMAGE_ERROR, { face, url });
        if (loaded + failed === total) _onAllLoaded(loaded, total);
      };

      img.addEventListener('load',  onLoad,  { once: true });
      img.addEventListener('error', onError, { once: true });
      img.src = url;
    });
  }

  function _createFaceImg(faceEl) {
    const img = document.createElement('img');
    img.className = 'home-domain__face-img';
    img.decoding  = 'async';
    img.loading   = 'eager';
    faceEl.appendChild(img);
    return img;
  }

  function _onAllLoaded(loaded, total) {
    if (loaded === 0) {
      _showError('Không thể tải ảnh Skybox. Kiểm tra đường dẫn assets.');
      return;
    }

    StateManager.set('skybox.ready', true);
    _hideLoader();
    _startLoop();
    EventBus.emit(EVENTS.SKYBOX_READY, { loaded, total });
  }

  // ── Transform ────────────────────────────────────────────────────

  /**
   * Áp dụng rotationX / rotationY từ state lên CSS transform của cube.
   * Gọi từ RAF loop — không dùng transition khi dragging.
   */
  function _applyTransform() {
    const rotX = StateManager.get('skybox.rotationX');
    const rotY = StateManager.get('skybox.rotationY');
    _cube.style.transform = `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  // ── Inertia RAF loop ─────────────────────────────────────────────

  function _loop() {
    const { SKYBOX } = Config;
    const isDragging = StateManager.get('skybox.isDragging');

    if (!isDragging) {
      let inertiaX = StateManager.get('skybox.inertiaX');
      let inertiaY = StateManager.get('skybox.inertiaY');

      const hasInertia = Math.abs(inertiaX) > SKYBOX.INERTIA_THRESHOLD ||
                         Math.abs(inertiaY) > SKYBOX.INERTIA_THRESHOLD;

      if (hasInertia) {
        inertiaX *= SKYBOX.INERTIA_DAMPING;
        inertiaY *= SKYBOX.INERTIA_DAMPING;

        const newRotX = _clampPitch(StateManager.get('skybox.rotationX') + inertiaX);
        const newRotY = StateManager.get('skybox.rotationY') + inertiaY;

        StateManager.setBatch({
          'skybox.rotationX': newRotX,
          'skybox.rotationY': newRotY,
          'skybox.inertiaX':  inertiaX,
          'skybox.inertiaY':  inertiaY,
        });

        _applyTransform();
      }
    }

    _rafId = requestAnimationFrame(_loop);
  }

  function _startLoop() {
    if (_running) return;
    _running = true;
    _rafId   = requestAnimationFrame(_loop);
  }

  function _stopLoop() {
    _running = false;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  function _clampPitch(angle) {
    return Math.max(-Config.SKYBOX.MAX_PITCH, Math.min(Config.SKYBOX.MAX_PITCH, angle));
  }

  function _hideLoader() {
    if (!_loader) return;
    _loader.setAttribute('data-loaded', '');
    setTimeout(() => { _loader.style.display = 'none'; }, Config.SKYBOX.TRANSITION_MS);
  }

  function _showError(message) {
    _hideLoader();
    if (!_error) { console.error('[SkyboxViewer]', message); return; }
    const msgEl = _error.querySelector('[data-error-message]');
    if (msgEl) msgEl.textContent = message;
    _error.setAttribute('data-visible', '');
  }

  // ── Event bindings ───────────────────────────────────────────────

  function _bindEvents() {
    // Input controller → rotate cube
    EventBus.on(EVENTS.INPUT_DRAG_DELTA, ({ deltaX, deltaY }) => {
      const { SKYBOX } = Config;
      const newRotX = _clampPitch(StateManager.get('skybox.rotationX') - deltaY * SKYBOX.ROTATION_SPEED);
      const newRotY = StateManager.get('skybox.rotationY') + deltaX * SKYBOX.ROTATION_SPEED;

      StateManager.setBatch({
        'skybox.rotationX': newRotX,
        'skybox.rotationY': newRotY,
        'skybox.inertiaX':  -deltaY * SKYBOX.ROTATION_SPEED,
        'skybox.inertiaY':   deltaX * SKYBOX.ROTATION_SPEED,
      });

      _applyTransform();
    });

    EventBus.on(EVENTS.INPUT_DRAG_START, () => {
      StateManager.set('skybox.isDragging', true);
      _cube.setAttribute('data-dragging', '');
    });

    EventBus.on(EVENTS.INPUT_DRAG_END, () => {
      StateManager.set('skybox.isDragging', false);
      _cube.removeAttribute('data-dragging');
    });

    // Reset
    EventBus.on(EVENTS.SKYBOX_RESET, () => {
      StateManager.setBatch({
        'skybox.rotationX': 0,
        'skybox.rotationY': 0,
        'skybox.inertiaX':  0,
        'skybox.inertiaY':  0,
      });
      _cube.removeAttribute('data-dragging');
      _cube.style.transition = `transform ${Config.SKYBOX.TRANSITION_MS}ms`;
      _applyTransform();
      setTimeout(() => { _cube.style.transition = ''; }, Config.SKYBOX.TRANSITION_MS);
    });

    // Page visibility — tạm dừng RAF khi tab ẩn
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        _stopLoop();
      } else if (StateManager.get('skybox.ready')) {
        _startLoop();
      }
    });
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    _stopLoop();
    EventBus.off(EVENTS.INPUT_DRAG_DELTA, () => {});
    EventBus.off(EVENTS.INPUT_DRAG_START, () => {});
    EventBus.off(EVENTS.INPUT_DRAG_END,   () => {});
    EventBus.off(EVENTS.SKYBOX_RESET,     () => {});
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default SkyboxViewer; 
