/**
 * Card — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a self-contained content container
 * with optional title, subtitle, content, and footer.
 */

/**
 * @param {object} options
 * @param {string} [options.title='']
 * @param {string} [options.subtitle='']
 * @param {HTMLElement|string|null} [options.content=null]
 * @param {HTMLElement|null} [options.footer=null]
 * @param {'default'|'elevated'} [options.variant='default']
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createCard(options = {}) {
  const {
    title = '',
    subtitle = '',
    content = null,
    footer = null,
    variant = 'default',
  } = options;

  const card = document.createElement('div');
  card.className = `ui-card ui-card--${variant}`;

  if (title || subtitle) {
    const header = document.createElement('div');
    header.className = 'ui-card__header';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'ui-card__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'ui-card__subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    card.appendChild(header);
  }

  if (content) {
    const body = document.createElement('div');
    body.className = 'ui-card__body';
    if (typeof content === 'string') {
      body.textContent = content;
    } else {
      body.appendChild(content);
    }
    card.appendChild(body);
  }

  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'ui-card__footer';
    footerEl.appendChild(footer);
    card.appendChild(footerEl);
  }

  return {
    element: card,
    destroy() { /* stateless — no cleanup needed */ },
  };
} 
