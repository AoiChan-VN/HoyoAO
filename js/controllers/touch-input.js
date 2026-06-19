/**
 * @file   js/controllers/touch-input.js
 * @layer  controllers
 * @depends event-bus.js, config.js
 */

import EventBus, { EVENTS } from '../core/event-bus.js';
import Config                from '../core/config.js';

const TouchInput = (() => {

  // ── State ────────────────────────────────────────────────────────
  let _active    = false;
  let _startX    = 0;
  let _startY    = 0;
  let _lastX     = 0;
  let _lastY     = 0;
  let _isDragging = false;
  let _target    = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init(target = document) {
    _target = target;
    _bindEvents();
  }

  // ── Handlers ─────────────────────────────────────────────────────

  function _onTouchStart(e) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    _active     = true;
    _isDragging = false;
    _startX     = touch.clientX;
    _startY     = touch.clientY;
    _lastX      = touch.clientX;
    _lastY      = touch.clientY;
  }

  function _onTouchMove(e) {
    if (!_active || e.touches.length !== 1) return;

    const touch   = e.touches[0];
    const deltaX  = (touch.clientX - _lastX) * Config.INPUT.TOUCH_MULTIPLIER;
    const deltaY  = (touch.clientY - _lastY) * Config.INPUT.TOUCH_MULTIPLIER;
    const totalDX = Math.abs(touch.clientX - _startX);
    const totalDY = Math.abs(touch.clientY - _startY);

    // Xác định drag khi vượt ngưỡng tối thiểu
    if (!_isDragging) {
      const dist = Math.sqrt(totalDX * totalDX + totalDY * totalDY);
      if (dist < Config.INPUT.MIN_DRAG_DISTANCE) return;
      _isDragging = true;
      EventBus.emit(EVENTS.INPUT_DRAG_START, { source: 'touch' });
    }

    // Ngăn scroll trang khi đang drag skybox
    e.preventDefault();

    EventBus.emit(EVENTS.INPUT_DRAG_DELTA, { deltaX, deltaY, source: 'touch' });

    _lastX = touch.clientX;
    _lastY = touch.clientY;
  }

  function _onTouchEnd() {
    if (!_active) return;
    _active = false;

    if (_isDragging) {
      EventBus.emit(EVENTS.INPUT_DRAG_END, { source: 'touch' });
    }

    _isDragging = false;
  }

  function _onTouchCancel() {
    _active     = false;
    _isDragging = false;
    EventBus.emit(EVENTS.INPUT_DRAG_END, { source: 'touch' });
  }

  // ── Bind ─────────────────────────────────────────────────────────

  function _bindEvents() {
    // passive: false trên touchmove để cho phép preventDefault()
    _target.addEventListener('touchstart', _onTouchStart, { passive: true  });
    _target.addEventListener('touchmove',  _onTouchMove,  { passive: false });
    _target.addEventListener('touchend',   _onTouchEnd,   { passive: true  });
    _target.addEventListener('touchcancel',_onTouchCancel,{ passive: true  });
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    _target.removeEventListener('touchstart',  _onTouchStart);
    _target.removeEventListener('touchmove',   _onTouchMove);
    _target.removeEventListener('touchend',    _onTouchEnd);
    _target.removeEventListener('touchcancel', _onTouchCancel);
    _active     = false;
    _isDragging = false;
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default TouchInput; 
