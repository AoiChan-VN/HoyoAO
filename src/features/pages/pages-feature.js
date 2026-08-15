import {
  PAGE_LAYOUTS,
  PAGE_MODES,
  KEYBOARD_KEYS,
} from "../../core/constants.js";

import { createRegistry } from "../../core/registry.js";
import { el } from "../../utils/dom.js";

const PAGE_LAYOUT_TYPE = "page-layout";
const NOT_FOUND_LAYOUT_ID = "not-found";
const PAGE_MODAL_TITLE_ID = "pages-modal-title";

const BACK_ICON_PATH = `
  <path d="M19 12H5"></path>
  <path d="m12 19-7-7 7-7"></path>
`;

function createBackIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = BACK_ICON_PATH;

  return svg;
}

function parseInline(text, parent) {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parent.append(
        document.createTextNode(text.slice(lastIndex, match.index)),
      );
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parent.append(el("strong", { text: token.slice(2, -2) }));
    } else if (token.startsWith("`")) {
      parent.append(el("code", { text: token.slice(1, -1) }));
    } else if (token.startsWith("*")) {
      parent.append(el("em", { text: token.slice(1, -1) }));
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);

      if (linkMatch) {
        parent.append(
          el("a", {
            text: linkMatch[1],
            attrs: {
              href: linkMatch[2],
              target: "_blank",
              rel: "noopener",
            },
          }),
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function renderMarkdown(markdown, container) {
  const lines = String(markdown ?? "").split(/\r?\n/);

  let paragraphBuffer = [];
  let listElement = null;
  let listOrdered = false;

  function flushParagraph() {
    if (paragraphBuffer.length === 0) {
      return;
    }

    const paragraph = el("p");

    parseInline(paragraphBuffer.join(" "), paragraph);
    container.append(paragraph);

    paragraphBuffer = [];
  }

  function flushList() {
    if (listElement) {
      container.append(listElement);
      listElement = null;
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();

      const buffer = [];

      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        buffer.push(lines[index]);
        index += 1;
      }

      const pre = el("pre");
      const code = el("code");

      code.textContent = buffer.join("\n");

      pre.append(code);
      container.append(pre);

      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);

    if (headingMatch) {
      flushParagraph();
      flushList();

      const level = Math.min(headingMatch[1].length + 2, 6);
      const heading = el(`h${level}`);

      parseInline(headingMatch[2], heading);
      container.append(heading);

      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph();
      flushList();
      container.append(el("hr"));
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);

    if (quoteMatch) {
      flushParagraph();
      flushList();

      const quote = el("blockquote");

      parseInline(quoteMatch[1], quote);
      container.append(quote);

      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.*)$/);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();

      const ordered = Boolean(orderedMatch);

      if (!listElement || listOrdered !== ordered) {
        flushList();

        listElement = el(ordered ? "ol" : "ul");
        listOrdered = ordered;
      }

      const item = el("li");

      parseInline((unorderedMatch ?? orderedMatch)[1], item);
      listElement.append(item);

      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();
}

function extractDocMeta(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);

  let title = "";
  let excerpt = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (!title && trimmed.startsWith("#")) {
      title = trimmed.replace(/^#+\s*/, "");
      continue;
    }

    if (
      !excerpt &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("```") &&
      !trimmed.startsWith(">")
    ) {
      excerpt = trimmed;
    }

    if (title && excerpt) {
      break;
    }
  }

  return { title, excerpt };
}

function createPageHeader(page) {
  return el("header", { className: "dsd-header" }, [
    el("div", { className: "dsd-header-text" }, [
      el("h1", {
        className: "dsd-title",
        text: page.label ?? page.id ?? "HoyoAO",
      }),
      el("p", {
        className: "dsd-subtitle",
        text: page.description ?? "",
      }),
    ]),
  ]);
}

function createMetaList(items) {
  const list = el("div", { className: "dsd-list" });

  for (const item of items) {
    if (!item) {
      continue;
    }

    list.append(
      el("div", { className: "dsd-list-item" }, [
        el("span", { className: "dsd-list-item-text" }, [
          el("span", {
            className: "dsd-list-item-title",
            text: item.title,
          }),
          item.subtitle
            ? el("span", {
                className: "dsd-list-item-subtitle",
                text: item.subtitle,
              })
            : null,
        ]),
      ]),
    );
  }

  return list;
}

export function createPagesFeature(context) {
  let mounted = false;

  let modalBackdrop = null;
  let modalRoot = null;
  let modalTitle = null;
  let modalBody = null;
  let modalCloseButton = null;
  let modalOpen = false;
  let modalLastFocused = null;

  const layoutRegistry = createRegistry({
    name: "hoyoao-page-layouts",
  });

  function onModalKeydown(event) {
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      event.stopImmediatePropagation();
      event.preventDefault();

      closeDetailModal();
    }
  }

  function ensureModalDom() {
    if (modalRoot) {
      return;
    }

    modalBackdrop = el("div", {
      className: "app-modal-backdrop",
      attrs: { "aria-hidden": "true" },
    });

    modalRoot = el("div", {
      className: "app-modal",
      attrs: {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": PAGE_MODAL_TITLE_ID,
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", { className: "app-modal-header" });

    modalTitle = el("h2", {
      id: PAGE_MODAL_TITLE_ID,
      className: "app-modal-title",
      text: "Chi tiết",
    });

    modalCloseButton = el(
      "button",
      {
        className:
          "nav-control nav-control--sm nav-control--quiet app-modal-close",
        attrs: {
          type: "button",
          "aria-label": "Đóng chi tiết",
        },
      },
      [createBackIcon()],
    );

    modalCloseButton.addEventListener("click", () => {
      closeDetailModal();
    });

    header.append(modalTitle, modalCloseButton);

    modalBody = el("div", { className: "app-modal-body" });

    const footer = el("div", { className: "app-modal-footer" });

    const closeButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: "Đóng",
    });

    closeButton.addEventListener("click", () => {
      closeDetailModal();
    });

    footer.append(closeButton);

    modalRoot.append(header, modalBody, footer);

    const layer = context.shell?.modalLayer ?? document.body;

    layer.append(modalBackdrop, modalRoot);

    modalBackdrop.addEventListener("pointerdown", () => {
      closeDetailModal();
    });
  }

  function openDetailModal({ title, renderBody }) {
    ensureModalDom();

    modalTitle.textContent = title ?? "Chi tiết";
    modalBody.replaceChildren();

    if (typeof renderBody === "function") {
      renderBody(modalBody);
    }

    modalOpen = true;
    modalLastFocused = document.activeElement;

    modalBackdrop.classList.add("is-visible");
    modalRoot.classList.add("is-open");
    modalRoot.removeAttribute("aria-hidden");

    document.body.classList.add("app-modal-open");

    document.addEventListener("keydown", onModalKeydown, true);

    requestAnimationFrame(() => {
      modalCloseButton?.focus({ preventScroll: true });
    });
  }

  function closeDetailModal() {
    if (!modalOpen) {
      return;
    }

    modalOpen = false;

    document.removeEventListener("keydown", onModalKeydown, true);

    modalBackdrop.classList.remove("is-visible");
    modalRoot.classList.remove("is-open");
    modalRoot.setAttribute("aria-hidden", "true");

    document.body.classList.remove("app-modal-open");

    if (
      modalLastFocused &&
      document.contains(modalLastFocused)
    ) {
      modalLastFocused.focus({ preventScroll: true });
    }
  }

  function loadDoc(docId) {
    const url = new URL(
      `../../data/docs/${encodeURIComponent(docId)}.md`,
      import.meta.url,
    );

    return fetch(url.href, {
      headers: {
        Accept: "text/markdown, text/plain",
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Doc "${docId}" responded ${response.status}`);
      }

      return response.text();
    });
  }

  function createDocCard(docId) {
    let docState = null;

    const titleElement = el("h3", {
      className: "crd-title",
      text: docId,
    });

    const subtitleElement = el("p", {
      className: "crd-subtitle",
      text: "Đang tải tài liệu...",
    });

    const detailButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: "Xem chi tiết",
    });

    detailButton.disabled = true;

    detailButton.addEventListener("click", () => {
      if (!docState) {
        return;
      }

      openDetailModal({
        title: docState.title,
        renderBody: (target) => {
          renderMarkdown(docState.markdown, target);
        },
      });
    });

    const card = el("article", { className: "crd" }, [
      el("div", { className: "crd-header" }, [
        el("div", { className: "crd-header-text" }, [
          titleElement,
          subtitleElement,
        ]),
      ]),
      el("div", { className: "crd-body" }, [
        el("div", { className: "dsd-actions" }, [detailButton]),
      ]),
    ]);

    loadDoc(docId)
      .then((markdown) => {
        if (!card.isConnected) {
          return;
        }

        const meta = extractDocMeta(markdown);

        docState = {
          markdown,
          title: meta.title || docId,
        };

        titleElement.textContent = meta.title || docId;
        subtitleElement.textContent =
          meta.excerpt || "Tài liệu giới thiệu.";
        detailButton.disabled = false;
      })
      .catch(() => {
        if (!card.isConnected) {
          return;
        }

        subtitleElement.textContent = "Không tải được tài liệu.";
      });

    return card;
  }

  function renderArticlePage(route) {
    const page = route?.page ?? {};

    const root = el("div", { className: "dsd" });

    root.append(createPageHeader(page));

    const docs = Array.isArray(page.docs) ? page.docs : [];

    if (docs.length === 0) {
      const widget = el("article", { className: "dsd-widget" });

      const body = el("div", { className: "dsd-widget-body" });

      if (page.description) {
        body.append(el("p", { text: page.description }));
      }

      body.append(
        createMetaList([
          { title: "Page ID", subtitle: page.id ?? route?.pageId ?? "" },
          { title: "Layout", subtitle: page.layout ?? "article" },
          { title: "Mode", subtitle: page.mode ?? "2d" },
          { title: "Route", subtitle: page.route ?? route?.route ?? "" },
        ]),
      );

      widget.append(body);
      root.append(widget);

      return root;
    }

    const grid = el("div", { className: "crd-grid" });

    for (const docId of docs) {
      grid.append(createDocCard(docId));
    }

    root.append(grid);

    return root;
  }

  function getGalleryItems(route) {
    const page = route?.page ?? {};

    if (Array.isArray(page.gallery?.items)) {
      return page.gallery.items.filter(Boolean);
    }

    const pages =
      context.router?.getSwitcherPages?.() ?? [];

    return pages.filter(
      (candidate) => candidate.id !== route?.pageId,
    );
  }

  function createGalleryCard(item, route) {
    const title = item.title ?? item.label ?? item.id ?? "Item";
    const subtitle =
      item.subtitle ?? item.description ?? item.layout ?? "";

    const children = [
      el("div", { className: "crd-header" }, [
        el("div", { className: "crd-header-text" }, [
          el("h3", { className: "crd-title", text: title }),
          el("p", { className: "crd-subtitle", text: subtitle }),
        ]),
      ]),
    ];

    const metaParts = [];

    if (item.type) metaParts.push(String(item.type));
    if (item.layout) metaParts.push(String(item.layout));
    if (item.mode) metaParts.push(String(item.mode));

    if (metaParts.length > 0) {
      children.push(
        el("div", { className: "crd-body" }, [
          el("p", { text: metaParts.join(" · ") }),
        ]),
      );
    }

    const actions = [];

    const hasTarget = Boolean(
      item.pageId ?? item.route ?? item.href ?? item.id,
    );

    if (hasTarget) {
      const openButton = el("button", {
        className: "nav-control nav-control--text",
        attrs: { type: "button" },
        text: "Mở",
      });

      openButton.addEventListener("click", () => {
        if (item.href) {
          window.open(item.href, item.target ?? "_blank", "noopener");
          return;
        }

        context.router?.navigate?.(item.pageId ?? item.route ?? item.id);
      });

      actions.push(openButton);
    }

    if (item.description) {
      const detailButton = el("button", {
        className: "nav-control nav-control--text",
        attrs: { type: "button" },
        text: "Xem chi tiết",
      });

      detailButton.addEventListener("click", () => {
        openDetailModal({
          title,
          renderBody: (target) => {
            target.append(
              el("p", { text: item.description }),
            );

            if (item.subtitle) {
              target.append(
                el("p", {
                  className: "crd-subtitle",
                  text: item.subtitle,
                }),
              );
            }
          },
        });
      });

      actions.push(detailButton);
    }

    if (actions.length > 0) {
      children.push(
        el("div", { className: "crd-footer" }, [
          el("div", { className: "dsd-actions" }, actions),
        ]),
      );
    }

    return el("article", { className: "crd" }, children);
  }

  function renderGalleryPage(route) {
    const page = route?.page ?? {};

    const root = el("div", { className: "dsd" });

    root.append(createPageHeader(page));

    const items = getGalleryItems(route);

    if (items.length === 0) {
      root.append(
        el("div", {
          className: "app-panel-note",
          text: "Chưa có mục nào.",
        }),
      );

      return root;
    }

    const grid = el("div", { className: "crd-grid" });

    for (const item of items) {
      grid.append(createGalleryCard(item, route));
    }

    root.append(grid);

    return root;
  }

  function renderImmersivePage(route) {
    const page = route?.page ?? {};
    const envConfig = context.config?.["3d"] ?? {};

    const scene = page.scene;
    const sceneId = typeof scene === "string" ? scene : scene?.id ?? null;
    const engine =
      typeof scene === "object" && scene !== null
        ? scene.engine
        : envConfig.engine ?? "webgl";

    const root = el("div", { className: "dsd" });

    const widget = el("section", {
      className: "dsd-widget dsd-widget--center",
    });

    const body = el("div", { className: "dsd-widget-body" });

    body.append(
      el("h1", {
        className: "dsd-title",
        text: page.label ?? "HoyoAO",
      }),
    );

    if (page.description) {
      body.append(
        el("p", {
          className: "dsd-subtitle",
          text: page.description,
        }),
      );
    }

    body.append(
      el("div", {
        className: "app-panel-note app-panel-note--info",
        text: `3D environment: ${engine}${sceneId ? ` — ${sceneId}` : ""}`,
      }),
    );

    const homeButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: "Về trang chủ",
    });

    homeButton.addEventListener("click", () => {
      context.router?.navigate?.(
        context.data?.pages?.defaultPageId ?? "home",
      );
    });

    body.append(
      el("div", { className: "dsd-actions" }, [homeButton]),
    );

    widget.append(body);
    root.append(widget);

    return root;
  }

  function renderBlankPage(route) {
    return el("div", {
      className: "app-page-blank",
      dataset: {
        pageId: route?.pageId ?? "",
      },
    });
  }

  function renderDashboardFallbackPage(route) {
    const page = route?.page ?? {};

    const root = el("div", { className: "dsd" });

    root.append(createPageHeader(page));

    const widget = el("section", { className: "dsd-widget" });

    widget.append(
      el("div", { className: "dsd-widget-body" }, [
        createMetaList([
          { title: "Page ID", subtitle: page.id ?? route?.pageId ?? "" },
          { title: "Layout", subtitle: page.layout ?? "dashboard" },
          { title: "Mode", subtitle: page.mode ?? "2d" },
        ]),
      ]),
    );

    root.append(widget);

    return root;
  }

  function renderNotFoundPage(route) {
    const root = el("div", { className: "dsd" });

    const emptyState = el("div", { className: "dsd-empty" });

    emptyState.append(
      el("div", { className: "dsd-empty-title", text: "404" }),
      el("p", {
        text: route?.page?.description ?? "Trang không tồn tại.",
      }),
    );

    const homeButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: "Về trang chủ",
    });

    homeButton.addEventListener("click", () => {
      context.router?.navigate?.(
        context.data?.pages?.defaultPageId ?? "home",
      );
    });

    emptyState.append(
      el("div", { className: "dsd-empty-actions" }, [homeButton]),
    );

    root.append(emptyState);

    return root;
  }

  function getRendererEntry(layoutId) {
    if (!layoutId) {
      return null;
    }

    const entry = layoutRegistry.get(PAGE_LAYOUT_TYPE, layoutId);

    if (!entry || entry.enabled === false) {
      return null;
    }

    if (
      typeof entry.predicate === "function" &&
      !entry.predicate(context, entry)
    ) {
      return null;
    }

    if (typeof entry.source?.render !== "function") {
      return null;
    }

    return entry;
  }

  function resolveRendererEntry(route) {
    if (!route) {
      return getRendererEntry(PAGE_LAYOUTS.ARTICLE);
    }

    if (route.notFound === true) {
      return getRendererEntry(NOT_FOUND_LAYOUT_ID);
    }

    const page = route.page ?? {};

    const explicitRenderer = page.renderer ?? route.renderer ?? null;

    if (explicitRenderer) {
      const explicitEntry = getRendererEntry(explicitRenderer);

      if (explicitEntry) {
        return explicitEntry;
      }
    }

    const layout = route.layout ?? page.layout ?? null;

    if (layout) {
      const layoutEntry = getRendererEntry(layout);

      if (layoutEntry) {
        return layoutEntry;
      }
    }

    const mode = route.mode ?? page.mode ?? null;

    if (mode === PAGE_MODES.THREE_D) {
      const immersiveEntry = getRendererEntry(PAGE_LAYOUTS.IMMERSIVE);

      if (immersiveEntry) {
        return immersiveEntry;
      }
    }

    return getRendererEntry(PAGE_LAYOUTS.ARTICLE);
  }

  function renderWithLayout(route) {
    const content = context.shell?.content;

    if (!content) {
      return;
    }

    const entry = resolveRendererEntry(route);

    if (!entry) {
      return;
    }

    const view = entry.source.render(route, context);

    if (view === false || view === undefined || view === null) {
      return;
    }

    content.replaceChildren();

    const nodes = Array.isArray(view) ? view : [view];

    for (const node of nodes) {
      if (node) {
        content.append(node);
      }
    }
  }

  function registerDefaultLayoutRenderers() {
    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: PAGE_LAYOUTS.ARTICLE,
      label: "Article layout",
      order: 10,
      render: renderArticlePage,
    });

    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: PAGE_LAYOUTS.GALLERY,
      label: "Gallery layout",
      order: 20,
      render: renderGalleryPage,
    });

    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: PAGE_LAYOUTS.IMMERSIVE,
      label: "Immersive layout",
      order: 30,
      render: renderImmersivePage,
    });

    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: PAGE_LAYOUTS.DASHBOARD,
      label: "Dashboard layout",
      order: 40,
      render: renderDashboardFallbackPage,
    });

    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: PAGE_LAYOUTS.BLANK,
      label: "Blank layout",
      order: 50,
      render: renderBlankPage,
    });

    layoutRegistry.register(PAGE_LAYOUT_TYPE, {
      id: NOT_FOUND_LAYOUT_ID,
      label: "Not found layout",
      order: 100,
      render: renderNotFoundPage,
    });
  }

  function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    registerDefaultLayoutRenderers();

    if (context.services) {
      context.services.pages = Object.freeze({
        registerLayout(layoutDefinition) {
          if (typeof layoutDefinition?.render !== "function") {
            throw new TypeError(
              "[HoyoAO Pages] Page layout must provide a render function.",
            );
          }

          return layoutRegistry.register(
            PAGE_LAYOUT_TYPE,
            layoutDefinition,
          );
        },

        unregisterLayout(layoutId) {
          return layoutRegistry.unregister(PAGE_LAYOUT_TYPE, layoutId);
        },

        getLayout(layoutId) {
          const entry = getRendererEntry(layoutId);

          return entry?.source ?? null;
        },

        getLayouts() {
          return layoutRegistry
            .getEnabled(PAGE_LAYOUT_TYPE, context)
            .map((entry) => entry.source);
        },

        openDetailModal,
      });
    }

    context.registerDisposer?.(() => {
      unmount();
    });
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    closeDetailModal();

    modalBackdrop?.remove();
    modalRoot?.remove();

    modalBackdrop = null;
    modalRoot = null;
    modalTitle = null;
    modalBody = null;
    modalCloseButton = null;

    layoutRegistry.destroy();

    if (context.services?.pages) {
      delete context.services.pages;
    }
  }

  const feature = Object.freeze({
    id: "pages",
    type: "feature",
    order: 8,
    mount,
    unmount,
    isMounted() {
      return mounted;
    },
  });

  if (context.services) {
    context.services.pagesFeature = feature;
  }

  return feature;
}

export function mountPagesFeature(context) {
  const feature = createPagesFeature(context);

  feature.mount();

  return feature;
}

export default createPagesFeature; 
