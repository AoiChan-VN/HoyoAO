/**
 * @file   js/components/home/overlay-ui.js
 * @layer  components/home
 * @depends event-bus.js, state-manager.js, config.js
 */

import EventBus,  { EVENTS } from '../../core/event-bus.js';
import StateManager           from '../../core/state-manager.js';
import Config                 from '../../core/config.js';

const OverlayUI = (() => {

  // ── DOM refs ─────────────────────────────────────────────────────
  let _overlay        = null;
  let _heroTitle      = null;
  let _heroSubtitle   = null;
  let _heroActions    = null;
  let _resetBtn       = null;
  let _imageSetBtns   = [];
  let _dragHint       = null;

  // ── State ────────────────────────────────────────────────────────
  let _dragHintTimer  = null;
  let _hasInteracted  = false;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _overlay      = document.querySelector('[data-home-overlay]');
    _heroTitle    = document.querySelector('[data-hero-title]');
    _heroSubtitle = document.querySelector('[data-hero-subtitle]');
    _heroActions  = document.querySelector('[data-hero-actions]');
    _resetBtn     = document.querySelector('[data-skybox-reset]');
    _imageSetBtns = [...document.querySelectorAll('[data-image-set]')];
    _dragHint     = document.querySelector('[data-drag-hint]');

    if (!_overlay) {
      console.warn('[OverlayUI] Không tìm thấy [data-home-overlay].');
      return;
    }

    _bindEvents();
    _scheduleHint();
    _revealHero();
  }

  // ── Hero reveal ──────────────────────────────────────────────────

  function _revealHero() {
    // Chờ skybox ready rồi mới reveal để tránh text xuất hiện trên màn hình đen
    EventBus.once(EVENTS.SKYBOX_READY, () => {
      const elements = [_heroTitle, _heroSubtitle, _heroActions].filter(Boolean);
      elements.forEach((el, i) => {
        setTimeout(() => {
          el.setAttribute('data-visible', '');
        }, i * Config.PERF.TRANSITION_STAGGER_MS * 3);
      });
    });
  }

  // ── Drag hint ────────────────────────────────────────────────────

  function _scheduleHint() {
    if (!_dragHint) return;
    // Hiển thị hint sau 2s nếu user chưa interact
    _dragHintTimer = setTimeout(() => {
      if (!_hasInteracted) {
        _dragHint.setAttribute('data-visible', '');
      }
    }, 2000);
  }

  function _hideHint() {
    if (!_dragHint || _hasInteracted) return;
    _hasInteracted = true;
    _dragHint.removeAttribute('data-visible');
    clearTimeout(_dragHintTimer);
  }

  // ── Image set switcher ───────────────────────────────────────────

  function _activateImageSetBtn(activeId) {
    _imageSetBtns.forEach(btn => {
      const id = btn.getAttribute('data-image-set');
      btn.classList.toggle('is-active', id === activeId);
      btn.setAttribute('aria-pressed', String(id === activeId));
    });
  }

  // ── Skybox state feedback ────────────────────────────────────────

  function _onDragStart() {
    _hideHint();
    if (_overlay) _overlay.setAttribute('data-dragging', '');
  }

  function _onDragEnd() {
    if (_overlay) _overlay.removeAttribute('data-dragging');
  }

  // ── Bind events ──────────────────────────────────────────────────

  function _bindEvents() {
    // Reset button
    if (_resetBtn) {
      _resetBtn.addEventListener('click', () => {
        EventBus.emit(EVENTS.SKYBOX_RESET);
        _hideHint();
      });
    }

    // Image set switcher buttons
    _imageSetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-image-set');
        if (!id) return;
        _activateImageSetBtn(id);
        EventBus.emit(EVENTS.SKYBOX_INIT, { imageSetId: id });
      });
    });

    // Drag start/end — ẩn hint
    EventBus.on(EVENTS.INPUT_DRAG_START, _onDragStart);
    EventBus.on(EVENTS.INPUT_DRAG_END,   _onDragEnd);

    // Phản ánh image set đang active từ state
    StateManager.watch('skybox.currentImageSet', ({ next }) => {
      if (next) _activateImageSetBtn(next);
    });

    // Loading state — disable buttons khi đang load ảnh mới
    StateManager.watch('skybox.ready', ({ next }) => {
      _imageSetBtns.forEach(btn => {
        btn.disabled = !next;
        btn.setAttribute('aria-disabled', String(!next));
      });
      if (_resetBtn) {
        _resetBtn.disabled = !next;
      }
    });

    // Error state — thông báo lên overlay
    EventBus.on(EVENTS.SKYBOX_IMAGE_ERROR, ({ face }) => {
      console.warn(`[OverlayUI] Face "${face}" lỗi tải ảnh.`);
    });

    // Keyboard: Space hoặc Enter để reset
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && e.target === document.body) {
        e.preventDefault();
        EventBus.emit(EVENTS.SKYBOX_RESET);
      }
    });
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    clearTimeout(_dragHintTimer);
    EventBus.off(EVENTS.INPUT_DRAG_START, _onDragStart);
    EventBus.off(EVENTS.INPUT_DRAG_END,   _onDragEnd);
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default OverlayUI; 
