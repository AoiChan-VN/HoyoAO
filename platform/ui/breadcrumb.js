/**
 * Breadcrumb — UI Primitive (§50, §38)
 *
 * Renders a hierarchical navigation path as an ordered list.
 *
 * Accessibility (§38): <nav aria-label>, <ol>, last item aria-current="page",
 * keyboard focusable links.
 *
 * API:
 *   const { element, setItems, destroy } = createBreadcrumb({
 *     items: [{ label, href?, onClick? }, ...],
 *     separator: '/',
 *     ariaLabel: 'Breadcrumb',
 *   });
 */

export function createBreadcrumb(options = {}) {
  const {
    items = [],
    separator = '/',
    ariaLabel = 'Breadcrumb',
  } = options;

  let currentItems = Array.isArray(items) ? [...items] : [];

  const nav = document.createElement('nav');
  nav.className = 'ui-breadcrumb';
  nav.setAttribute('aria-label', ariaLabel);

  const list = document.createElement('ol');
  list.className = 'ui-breadcrumb__list';
  nav.appendChild(list);

  function render() {
    list.innerHTML = '';

    currentItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'ui-breadcrumb__item';

      const isLast = index === currentItems.length - 1;

      if (isLast) {
        const current = document.createElement('span');
        current.className = 'ui-breadcrumb__current';
        current.setAttribute('aria-current', 'page');
        current.textContent = item.label || '';
        li.appendChild(current);
      } else {
        const link = document.createElement(item.href ? 'a' : 'button');
        link.className = 'ui-breadcrumb__link';
        link.textContent = item.label || '';

        if (item.href) {
          link.href = item.href;
        } else {
          link.type = 'button';
        }

        const activate = (e) => {
          if (!item.href) e.preventDefault();
          if (typeof item.onClick === 'function') {
            item.onClick(item, index);
          }
        };
        link.addEventListener('click', activate);

        li.appendChild(link);

        const sep = document.createElement('span');
        sep.className = 'ui-breadcrumb__sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = separator;
        li.appendChild(sep);
      }

      list.appendChild(li);
    });
  }

  function setItems(newItems) {
    currentItems = Array.isArray(newItems) ? [...newItems] : [];
    render();
  }

  function destroy() {
    list.innerHTML = '';
    if (nav.parentNode) nav.parentNode.removeChild(nav);
  }

  render();

  return { element: nav, setItems, destroy };
} 
