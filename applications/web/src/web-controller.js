/**
 * Web Application Controller (§4, §1)
 *
 * Web content management: pages, sites, SEO metadata, publishing workflow.
 * Consumes DataService for page records, provides CRUD UI.
 *
 * In development mode, renders a simulated page library.
 * In production, consumes a WebDataProvider via the Provider contract (§56).
 */

export class WebController {
  #container;
  #services;
  #localization;
  #data;
  #eventBus;
  #icons;

  #root = null;
  #listEl = null;
  #detailEl = null;
  #unsubscribers = [];
  #pages = [];
  #selectedPage = null;

  constructor(container, services) {
    this.#container = container;
    this.#services = services;
    this.#localization = services.localization;
    this.#data = services.data || null;
    this.#eventBus = services.events;
    this.#icons = services.icons;
  }

  start() {
    this.#root = document.createElement('div');
    this.#root.className = 'web-app';

    // Header.
    const header = document.createElement('div');
    header.className = 'web-app__header';

    const title = document.createElement('h2');
    title.className = 'web-app__title';
    title.textContent = this.#localization.t('web.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'web-app__subtitle';
    subtitle.textContent = this.#localization.t('web.subtitle');

    header.append(title, subtitle);

    // Source badge.
    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'web-app__source-badge';
    sourceBadge.textContent = this.#localization.t('web.source.simulated');
    header.appendChild(sourceBadge);

    // Layout.
    const layout = document.createElement('div');
    layout.className = 'web-app__layout';

    this.#listEl = document.createElement('div');
    this.#listEl.className = 'web-app__list';

    this.#detailEl = document.createElement('div');
    this.#detailEl.className = 'web-app__detail';

    layout.append(this.#listEl, this.#detailEl);
    this.#root.append(header, layout);
    this.#container.appendChild(this.#root);

    this.#loadPages();

    // Listen for data changes.
    const handler = () => this.#loadPages();
    this.#eventBus.on('data:indexed', handler);
    this.#unsubscribers.push(() => this.#eventBus.off('data:indexed', handler));
  }

  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];
    if (this.#root && this.#root.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
    }
    this.#root = null;
    this.#listEl = null;
    this.#detailEl = null;
    this.#pages = [];
    this.#selectedPage = null;
  }

  /* ---- private ---- */

  #loadPages() {
    // In development mode, use simulated page data (§45 clearly identified).
    if (this.#data && typeof this.#data.query === 'function') {
      const result = this.#data.query({ domain: 'web' });
      if (result && result.length > 0) {
        this.#pages = result;
        this.#render();
        return;
      }
    }

    // Simulated development data (§45).
    this.#pages = this.#generateSimulatedPages();
    this.#render();
  }

  #generateSimulatedPages() {
    const statuses = ['published', 'draft', 'scheduled'];
    const pages = [];
    const now = Date.now();

    const templates = [
      { title: 'Home', slug: '/', template: 'landing' },
      { title: 'About', slug: '/about', template: 'page' },
      { title: 'Blog', slug: '/blog', template: 'listing' },
      { title: 'Contact', slug: '/contact', template: 'page' },
      { title: 'Services', slug: '/services', template: 'listing' },
      { title: 'Privacy Policy', slug: '/privacy', template: 'legal' },
      { title: 'Terms of Service', slug: '/terms', template: 'legal' },
      { title: 'FAQ', slug: '/faq', template: 'page' },
    ];

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      pages.push({
        id: `page-${i + 1}`,
        title: t.title,
        slug: t.slug,
        template: t.template,
        status: statuses[i % statuses.length],
        author: 'admin',
        createdAt: new Date(now - (templates.length - i) * 86400000).toISOString(),
        updatedAt: new Date(now - i * 3600000).toISOString(),
        seo: {
          title: `${t.title} — HoyoAO`,
          description: `${t.title} page description.`,
          keywords: [t.template, 'web'],
        },
      });
    }

    return pages;
  }

  #render() {
    this.#renderList();
    this.#renderDetail();
  }

  #renderList() {
    if (!this.#listEl) return;
    this.#listEl.innerHTML = '';

    if (this.#pages.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'web-app__empty';
      empty.textContent = this.#localization.t('web.empty.title');
      this.#listEl.appendChild(empty);
      return;
    }

    for (const page of this.#pages) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'web-app__page-item';
      if (this.#selectedPage && this.#selectedPage.id === page.id) {
        item.classList.add('is-selected');
      }

      const titleEl = document.createElement('div');
      titleEl.className = 'web-app__page-title';
      titleEl.textContent = page.title;

      const meta = document.createElement('div');
      meta.className = 'web-app__page-meta';
      meta.textContent = `${page.slug} · ${this.#localization.t(`web.status.${page.status}`)}`;

      item.append(titleEl, meta);
      item.addEventListener('click', () => {
        this.#selectedPage = page;
        this.#render();
      });

      this.#listEl.appendChild(item);
    }
  }

  #renderDetail() {
    if (!this.#detailEl) return;
    this.#detailEl.innerHTML = '';

    if (!this.#selectedPage) {
      const placeholder = document.createElement('div');
      placeholder.className = 'web-app__detail-placeholder';
      placeholder.textContent = this.#localization.t('web.detail.select');
      this.#detailEl.appendChild(placeholder);
      return;
    }

    const page = this.#selectedPage;

    const heading = document.createElement('h3');
    heading.className = 'web-app__detail-title';
    heading.textContent = page.title;

    const fields = [
      ['web.detail.slug', page.slug],
      ['web.detail.template', page.template],
      ['web.detail.status', this.#localization.t(`web.status.${page.status}`)],
      ['web.detail.author', page.author],
      ['web.detail.createdAt', page.createdAt],
      ['web.detail.updatedAt', page.updatedAt],
    ];

    const dl = document.createElement('dl');
    dl.className = 'web-app__detail-fields';

    for (const [key, value] of fields) {
      const dt = document.createElement('dt');
      dt.textContent = this.#localization.t(key);
      const dd = document.createElement('dd');
      dd.textContent = value || '—';
      dl.append(dt, dd);
    }

    // SEO section.
    const seoHeading = document.createElement('h4');
    seoHeading.className = 'web-app__detail-section';
    seoHeading.textContent = this.#localization.t('web.seo.title');

    const seoDl = document.createElement('dl');
    seoDl.className = 'web-app__detail-fields';

    const seoFields = [
      ['web.seo.pageTitle', page.seo?.title],
      ['web.seo.description', page.seo?.description],
      ['web.seo.keywords', page.seo?.keywords?.join(', ')],
    ];

    for (const [key, value] of seoFields) {
      const dt = document.createElement('dt');
      dt.textContent = this.#localization.t(key);
      const dd = document.createElement('dd');
      dd.textContent = value || '—';
      seoDl.append(dt, dd);
    }

    this.#detailEl.append(heading, dl, seoHeading, seoDl);
  }
} 
