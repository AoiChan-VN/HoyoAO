/**
 * Modal — UI Primitive (§50, §97, §38)
 *
 * Modal for confirmation / focused inspection / short interaction (§97).
 * Supports an optional footer (e.g. action buttons). FIX B5: guarantees
 * the contract createModal({ title, content, footer, closable, onClose })
 * returning { element, open, close, destroy }.
 *
 * Accessibility (§38): role=dialog, aria-modal, focus trap, Escape to
 * close, focus restored on close, reduced-motion friendly.
 */
export function createModal(options = {}) {
  const {
    title = '',
    content = null,
    footer = null,
    closable = true,
    onClose = null,
  } = options;

  let isOpen = false;
  let previouslyFocused = null;

  const backdrop = document.createElement('div');
  backdrop.className = 'ui-modal__backdrop';
  backdrop.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'ui-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  if (title) modal.setAttribute('aria-label', title);

  // Header.
  const header = document.createElement('div');
  header.className = 'ui-modal__header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'ui-modal__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (closable) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ui-modal__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', close);
    header.appendChild(closeBtn);
  }

  // Body.
  const body = document.createElement('div');
  body.className = 'ui-modal__body';
  if (content instanceof Node) body.appendChild(content);
  else if (content != null) body.textContent = String(content);

  modal.append(header, body);

  // Footer (FIX B5).
  if (footer != null) {
    const footerEl = document.createElement('div');
    footerEl.className = 'ui-modal__footer';
    if (footer instanceof Node) footerEl.appendChild(footer);
    else footerEl.textContent = String(footer);
    modal.appendChild(footerEl);
  }

  backdrop.appendChild(modal);

  function onKeydown(e) {
    if (e.key === 'Escape' && closable) {
      close();
      return;
    }
    // Focus trap (§38).
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    previouslyFocused = document.activeElement;
    backdrop.hidden = false;
    document.body.appendChild(backdrop);
    document.addEventListener('keydown', onKeydown);

    requestAnimationFrame(() => {
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
      else modal.focus();
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    backdrop.hidden = true;
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    document.removeEventListener('keydown', onKeydown);
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    if (onClose) onClose();
  }

  if (closable) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
  }

  function destroy() {
    close();
  }

  return { element: backdrop, open, close, destroy };
}
