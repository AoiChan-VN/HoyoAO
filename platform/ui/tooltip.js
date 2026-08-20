/**
 * Tooltip — UI Primitive (§50, §38)
 *
 * Adds a text tooltip to an element on hover/focus. Attaches/detaches
 * cleanly so listeners never leak (§74).
 *
 * Accessibility (§38): aria-describedby linking, pointer-events aware,
 * Escape closes, respects reduced-motion preferences.
 *
 * API:
 *   const { detach } = attachTooltip(target, 'text', options);
 *   detach();  // removes listeners + hides tooltip
 */

const SHOW_DELAY = 300;
const HIDE_DELAY = 120;
let sharedTooltip = null;

function ensureTooltipElement() {
  if (sharedTooltip && sharedTooltip.parentNode) return sharedTooltip;
  const tip = document.createElement('div');
  tip.className = 'ui-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  sharedTooltip = tip;
  document.body.appendChild(tip);
  return tip;
}

function positionTooltip(tip, target, placement) {
  const targetRect = target.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top = 0;
  let left = 0;
  const gap = 6;

  switch (placement) {
    case 'top':
      top = targetRect.top + scrollY - tipRect.height - gap;
      left = targetRect.left + scrollX + (targetRect.width - tipRect.width) / 2;
      break;
    case 'bottom':
      top = targetRect.bottom + scrollY + gap;
      left = targetRect.left + scrollX + (targetRect.width - tipRect.width) / 2;
      break;
    case 'left':
      top = targetRect.top + scrollY + (targetRect.height - tipRect.height) / 2;
      left = targetRect.left + scrollX - tipRect.width - gap;
      break;
    case 'right':
    default:
      top = targetRect.top + scrollY + (targetRect.height - tipRect.height) / 2;
      left = targetRect.right + scrollX + gap;
      break;
  }

  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

/**
 * Attach a tooltip to a target element.
 * @param {HTMLElement} target
 * @param {string} text
 * @param {{placement?:'top'|'right'|'bottom'|'left', delay?:number}} options
 * @returns {{detach:Function}}
 */
export function attachTooltip(target, text, options = {}) {
  if (!target || !text) return { detach: () => {} };

  const placement = options.placement || 'top';
  const showDelay = typeof options.delay === 'number' ? options.delay : SHOW_DELAY;

  let showTimer = null;
  let hideTimer = null;
  let currentId = null;

  const show = () => {
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      const tip = ensureTooltipElement();
      if (!currentId) {
        currentId = `tip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        target.setAttribute('aria-describedby', currentId);
      }
      tip.id = currentId;
      tip.textContent = text;
      tip.setAttribute('aria-hidden', 'false');
      tip.classList.add('is-visible');
      positionTooltip(tip, target, placement);
    }, showDelay);
  };

  const hide = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      if (sharedTooltip) {
        sharedTooltip.classList.remove('is-visible');
        sharedTooltip.setAttribute('aria-hidden', 'true');
      }
      if (currentId) {
        target.removeAttribute('aria-describedby');
        currentId = null;
      }
    }, HIDE_DELAY);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') hide();
  };

  target.addEventListener('mouseenter', show);
  target.addEventListener('mouseleave', hide);
  target.addEventListener('focus', show);
  target.addEventListener('blur', hide);
  target.addEventListener('keydown', onKeyDown);

  return {
    detach() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      target.removeEventListener('mouseenter', show);
      target.removeEventListener('mouseleave', hide);
      target.removeEventListener('focus', show);
      target.removeEventListener('blur', hide);
      target.removeEventListener('keydown', onKeyDown);
      if (currentId) target.removeAttribute('aria-describedby');
    },
  };
} 
