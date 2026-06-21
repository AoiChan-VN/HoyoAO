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

  // ── RAF — chỉ chạy khi thật sự có chuyển động (inertia decay) ────
  let _rafId   = null;
  let _running = false;

  // ── Named handler refs (để destroy() unsubscribe đúng) ───────────
  let _onDragDelta        = null;
  let _onDragStart        = null;
  let _onDragEnd          = null;
  let _onSkyboxReset      = null;
  let _onSkyboxInit       = null;
  let _onVisibilityChange = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _cube   = document.querySelector('[data-skybox-cube]');
    _loader = document.querySelector('[data-home-loader]');
    _error  = document.querySelector('[data-home-error]');

    if (!_cube) {
      console.error('[SkyboxViewer] Không tìm thấy [data-skybox-cube].');
      console.error('[SkyboxViewer] Không tìm thấy phần tử [data-skybox-cube] trong DOM.');
      _showError();
      return;
    }

    _cacheFaceRefs();
    _bindEvents();

    const imageSet = SkyboxRepository.getDefault();
    _loadImageSet(imageSet);
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
      console.error(`[SkyboxViewer] Image set "${imageSet.id}" thiếu faces: ${validation.missing.join(', ')}`);
      _showError();
      return;
    }

    _hideError(); // Xóa thông báo lỗi của lần thử trước (nếu có) — đây là lần thử MỚI

    const faces  = SkyboxRepository.getFaces(imageSet.id);
    const total  = faces.length;
    let   loaded = 0;
    let   failed = 0;

    StateManager.setBatch({
      'skybox.imagesTotal':     total,
      'skybox.imagesLoaded':    0,
      'skybox.ready':           false,
      'skybox.loading':         true,
      'skybox.currentImageSet': imageSet.id,
    });

    faces.forEach(({ face, url, alt }) => {
      const faceEl = _faces[face];
      if (!faceEl) return;

      faceEl.setAttribute('data-loading', '');
      faceEl.removeAttribute('data-error');

      const img = faceEl.querySelector('img') || _createFaceImg(faceEl);
      img.alt   = alt;
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
    StateManager.set('skybox.loading', false);

    if (loaded === 0) {
      console.error(
        `[SkyboxViewer] Toàn bộ ${total} ảnh đều tải thất bại cho set hiện tại. ` +
        `Kiểm tra đường dẫn assets/skybox/ trên server.`
      );
      _showError();
      return;
    }

    StateManager.set('skybox.ready', true);
    _hideLoader();
    EventBus.emit(EVENTS.SKYBOX_READY, { loaded, total });
  }

  // ── Transform ────────────────────────────────────────────────────

  /**
   * Áp dụng rotationX / rotationY từ state lên CSS transform của cube.
   */
  function _applyTransform() {
    const rotX = StateManager.get('skybox.rotationX');
    const rotY = StateManager.get('skybox.rotationY');
    _cube.style.transform = `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  // ── Inertia RAF loop ─────────────────────────────────────────────
  // CHỈ chạy trong lúc cube còn trớn sau khi thả tay — không chạy
  // vô tận khi cube đứng yên. Tiết kiệm pin/CPU trên mobile.

  function _loop() {
    const { SKYBOX } = Config;

    let inertiaX = StateManager.get('skybox.inertiaX');
    let inertiaY = StateManager.get('skybox.inertiaY');

    const hasInertia = Math.abs(inertiaX) > SKYBOX.INERTIA_THRESHOLD ||
                       Math.abs(inertiaY) > SKYBOX.INERTIA_THRESHOLD;

    if (!hasInertia) {
      _stopLoop();
      return;
    }

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

  /**
   * Hiện thông báo lỗi cho NGƯỜI DÙNG CUỐI — không bao giờ lộ chi tiết
   * kỹ thuật (đường dẫn file, tên thư mục...). Chi tiết kỹ thuật chỉ
   * log ra console cho người phát triển ở nơi gọi hàm này.
   */
  function _showError() {
    _hideLoader();
    if (!_error) return;
    _error.setAttribute('data-visible', '');
  }

  function _hideError() {
    if (!_error) return;
    _error.removeAttribute('data-visible');
  }

  // ── Event bindings ───────────────────────────────────────────────

  function _bindEvents() {
    // Drag delta áp dụng transform NGAY (đồng bộ) — không cần RAF khi đang kéo
    _onDragDelta = ({ deltaX, deltaY }) => {
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
    };

    _onDragStart = () => {
      _stopLoop(); // Hủy inertia cũ nếu user tóm cube giữa chừng
      StateManager.set('skybox.isDragging', true);
      _cube.setAttribute('data-dragging', '');
    };

    _onDragEnd = () => {
      StateManager.set('skybox.isDragging', false);
      _cube.removeAttribute('data-dragging');
      _startLoop(); // Bắt đầu giảm tốc tự nhiên — tự dừng khi hết trớn
    };

    _onSkyboxReset = () => {
      _stopLoop();
      StateManager.setBatch({
        'skybox.rotationX': Config.SKYBOX.DEFAULT_ROTATION_X,
        'skybox.rotationY': Config.SKYBOX.DEFAULT_ROTATION_Y,
        'skybox.inertiaX':  0,
        'skybox.inertiaY':  0,
      });
      _cube.removeAttribute('data-dragging');
      _cube.style.transition = `transform ${Config.SKYBOX.TRANSITION_MS}ms`;
      _applyTransform();
      setTimeout(() => { _cube.style.transition = ''; }, Config.SKYBOX.TRANSITION_MS);
    };

    // Chuyển sang bộ ảnh khác — đây là handler THỰC SỰ thực thi yêu cầu
    // chuyển ảnh (trước đây sự kiện này được emit nhưng không ai lắng nghe,
    // khiến nút chọn Image Set đổi trạng thái active nhưng ảnh không đổi).
    _onSkyboxInit = ({ imageSetId }) => {
      if (!imageSetId) return;
      if (StateManager.get('skybox.currentImageSet') === imageSetId) return;

      const imageSet = SkyboxRepository.getById(imageSetId);
      if (!imageSet) {
        console.warn(`[SkyboxViewer] Image set "${imageSetId}" không tồn tại.`);
        return;
      }

      SkyboxRepository.savePreference(imageSetId);
      _loadImageSet(imageSet);
    };

    // Tab ẩn — tạm dừng RAF nếu đang chạy
    _onVisibilityChange = () => {
      if (document.hidden) _stopLoop();
    };

    EventBus.on(EVENTS.INPUT_DRAG_DELTA, _onDragDelta);
    EventBus.on(EVENTS.INPUT_DRAG_START, _onDragStart);
    EventBus.on(EVENTS.INPUT_DRAG_END,   _onDragEnd);
    EventBus.on(EVENTS.SKYBOX_RESET,     _onSkyboxReset);
    EventBus.on(EVENTS.SKYBOX_INIT,      _onSkyboxInit);
    document.addEventListener('visibilitychange', _onVisibilityChange);
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    _stopLoop();
    EventBus.off(EVENTS.INPUT_DRAG_DELTA, _onDragDelta);
    EventBus.off(EVENTS.INPUT_DRAG_START, _onDragStart);
    EventBus.off(EVENTS.INPUT_DRAG_END,   _onDragEnd);
    EventBus.off(EVENTS.SKYBOX_RESET,     _onSkyboxReset);
    EventBus.off(EVENTS.SKYBOX_INIT,      _onSkyboxInit);
    document.removeEventListener('visibilitychange', _onVisibilityChange);
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default SkyboxViewer;
