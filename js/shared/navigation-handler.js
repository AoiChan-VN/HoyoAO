/**
 * @file   js/shared/navigation-handler.js
 * @layer  shared
 * @depends event-bus.js, state-manager.js, config.js
 */

import EventBus, { EVENTS } from '../core/event-bus.js';
import StateManager          from '../core/state-manager.js';
import Config                from '../core/config.js';

const NavigationHandler = (() => {

  // ── DOM refs ─────────────────────────────────────────────────────
  let _header       = null;
  let _mobileMenu   = null;
  let _toggle       = null;
  let _backTop      = null;
  let _navLinks     = [];

  // ── Internal state ───────────────────────────────────────────────
  let _lastScrollY      = 0;
  let _ticking          = false;
  let _scrollUnlisten   = null;

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    _header     = document.querySelector('[data-nav-header]');
    _mobileMenu = document.querySelector('[data-nav-mobile-menu]');
    _toggle     = document.querySelector('[data-nav-toggle]');
    _backTop    = document.querySelector('[data-back-top]');
    _navLinks   = [...document.querySelectorAll('[data-nav-link]')];

    if (!_header) {
      console.warn('[NavigationHandler] Không tìm thấy [data-nav-header].');
      return;
    }

    _setActiveLink();
    _bindEvents();
    _handleScroll();   // Chạy lần đầu để set trạng thái đúng
  }

  // ── Active link ──────────────────────────────────────────────────

  function _setActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || Config.PAGES.HOME;

    _navLinks.forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop() || '';
      const isActive = href === currentPath || (currentPath === '' && href === Config.PAGES.HOME);

      link.classList.toggle('nav-link--active', isActive);
      link.classList.toggle('nav-mobile-link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  // ── Scroll handler ───────────────────────────────────────────────

  function _handleScroll() {
    const scrollY     = window.scrollY;
    const delta       = scrollY - _lastScrollY;
    const direction   = delta > 0 ? 'down' : 'up';
    const { NAV }     = Config;

    // Glassmorphism threshold
    if (scrollY > NAV.SCROLL_THRESHOLD) {
      _header.setAttribute('data-nav-scrolled', '');
    } else {
      _header.removeAttribute('data-nav-scrolled');
    }

    // Hide / show nav
    if (scrollY > NAV.HIDE_THRESHOLD) {
      if (delta > NAV.SCROLL_DELTA_HIDE) {
        _header.setAttribute('data-nav-hidden', '');
        _header.setAttribute('data-nav-direction', 'down');
      } else if (delta < -NAV.SCROLL_DELTA_SHOW) {
        _header.removeAttribute('data-nav-hidden');
        _header.setAttribute('data-nav-direction', 'up');
      }
    } else {
      _header.removeAttribute('data-nav-hidden');
    }

    // Back-to-top button
    if (_backTop) {
      if (scrollY > NAV.BACK_TOP_THRESHOLD) {
        _backTop.setAttribute('data-visible', '');
      } else {
        _backTop.removeAttribute('data-visible');
      }
    }

    // State + EventBus
    StateManager.setBatch({
      'nav.scrollY':         scrollY,
      'nav.scrollDirection': direction,
      'nav.hidden':          _header.hasAttribute('data-nav-hidden'),
    });

    EventBus.emit(EVENTS.NAV_SCROLL_UPDATE, { scrollY, direction });

    _lastScrollY = scrollY;
    _ticking = false;
  }

  function _onScroll() {
    if (_ticking) return;
    _ticking = true;
    requestAnimationFrame(_handleScroll);
  }

  // ── Mobile menu ──────────────────────────────────────────────────

  function _openMenu() {
    if (!_mobileMenu || !_toggle) return;

    _header.setAttribute('data-nav-open', '');
    _mobileMenu.setAttribute('data-nav-open', '');
    _toggle.setAttribute('aria-expanded', 'true');
    _toggle.setAttribute('aria-label', 'Đóng menu');
    document.body.style.overflow = 'hidden';

    StateManager.set('nav.menuOpen', true);
    EventBus.emit(EVENTS.NAV_MENU_OPEN);
  }

  function _closeMenu() {
    if (!_mobileMenu || !_toggle) return;

    _header.removeAttribute('data-nav-open');
    _mobileMenu.removeAttribute('data-nav-open');
    _toggle.setAttribute('aria-expanded', 'false');
    _toggle.setAttribute('aria-label', 'Mở menu');
    document.body.style.overflow = '';

    StateManager.set('nav.menuOpen', false);
    EventBus.emit(EVENTS.NAV_MENU_CLOSE);
  }

  function _toggleMenu() {
    StateManager.get('nav.menuOpen') ? _closeMenu() : _openMenu();
  }

  // ── Bind events ──────────────────────────────────────────────────

  function _bindEvents() {
    // Scroll — passive cho performance
    window.addEventListener('scroll', _onScroll, { passive: true });

    // Toggle button
    if (_toggle) {
      _toggle.addEventListener('click', _toggleMenu);
    }

    // Đóng menu khi click link trong mobile menu
    if (_mobileMenu) {
      _mobileMenu.addEventListener('click', (e) => {
        if (e.target.closest('[data-nav-link]')) _closeMenu();
      });
    }

    // Đóng menu khi click ngoài
    document.addEventListener('click', (e) => {
      if (!StateManager.get('nav.menuOpen')) return;
      if (_header.contains(e.target) || _mobileMenu?.contains(e.target)) return;
      _closeMenu();
    });

    // Đóng menu khi nhấn Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && StateManager.get('nav.menuOpen')) {
        _closeMenu();
        _toggle?.focus();
      }
    });

    // Đóng menu khi resize về desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= Config.BREAKPOINTS.MD && StateManager.get('nav.menuOpen')) {
        _closeMenu();
      }
    }, { passive: true });

    // Back-to-top
    if (_backTop) {
      _backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // EventBus: cho phép module khác đóng/mở menu
    EventBus.on(EVENTS.NAV_MENU_OPEN,  _openMenu);
    EventBus.on(EVENTS.NAV_MENU_CLOSE, _closeMenu);
  }

  // ── Teardown ─────────────────────────────────────────────────────

  function destroy() {
    window.removeEventListener('scroll', _onScroll);
    EventBus.off(EVENTS.NAV_MENU_OPEN,  _openMenu);
    EventBus.off(EVENTS.NAV_MENU_CLOSE, _closeMenu);
    _closeMenu();
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ init, destroy });

})();

export default NavigationHandler; 
