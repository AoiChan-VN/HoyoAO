/**
 * @file   js/controllers/mouse-input.js
 * @layer  controllers
 * @depends event-bus.js, config.js
 */

import EventBus, { EVENTS } from '../core/event-bus.js';
import Config                from '../core/config.js';

const MouseInput = (() => {

  // ── State ────────────────────────────────────────────────────────
  let _active     = false;
  let _isDragging = false;
  let _startX     = 0;
  let _startY     = 0;
  let _lastX      = 0;
  let _lastY      = 0;
  let _target     = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init(target = document) {
    _target = target;
    _bindEvents();
  }

  // ── Handlers ─────────────────────────────────────────────────────

  function _onMouseDown(e) {
    // Chỉ xử lý left click (button 0)
    if (e.button !== 0) return;

    _active     = true;
    _isDragging = false;
    _startX     = e.clientX;
    _startY     = e.clientY;
    _lastX      = e.clientX;
    _lastY      = e.clientY;

    // Ngăn text selection khi drag
    e.preventDefault();
  }

  function _onMouseMove(e) {
    if (!_active) return;

    const deltaX  = (e.clientX - _lastX) * Config.INPUT.MOUSE_MULTIPLIER;
    const deltaY  = (e.clientY - _lastY) * Config.INPUT.MOUSE_MULTIPLIER;
    const totalDX = Math.abs(e.clientX - _startX);
    const totalDY = Math.abs(e.clientY - _startY);

    if (!_isDragging) {
      const dist = Math.sqrt(totalDX * totalDX + totalDY * totalDY);
      if (dist < Config.INPUT.MIN_DRAG_DISTANCE) return;
      _isDragging = true;
      EventBus.emit(EVENTS.INPUT_DRAG_START, { source: 'mouse' });
    }

    EventBus.emit(EVENTS.INPUT_DRAG_DELTA, { deltaX, deltaY, source: 'mouse' });

    _lastX = e.clientX;
    _lastY = e.clientY;
  }

  function _onMouseUp(e) {
    if (!_active || e.button !== 0) return;
    _active = false;

    if (_isDragging) {
      EventBus.emit(EVENTS.INPUT_DRAG_END, { source: 'mouse' });
    }

    _isDragging = false;
  }

  function _onMouseLeave() {
    if (!_active) return;
    _active = false;

    if (_isDragging) {
      EventBus.emit(EVENTS.INPUT_DRAG_END, { source: 'mouse' });
    }

    _isDragging = false;
  }

  // ── Bind ─────────────────────────────────────────────────────────

  function _bindEvents() {
    _target.addEventListener('mousedown', _onMouseDown);

    // mousemove và mouseup trên window để capture ngay cả khi
    // con trỏ ra ngoài target element trong khi đang drag
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mouseup',   _onMouseUp);

    // Fallback nếu chuột rời khỏi window
    document.addEventListener('mouseleave', _onMouseLeave);
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    _target.removeEventListener('mousedown',      _onMouseDown);
    window.removeEventListener('mousemove',       _onMouseMove);
    window.removeEventListener('mouseup',         _onMouseUp);
    document.removeEventListener('mouseleave',    _onMouseLeave);
    _active     = false;
    _isDragging = false;
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default MouseInput;
