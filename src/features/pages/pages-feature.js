import {
  PAGE_LAYOUTS,
  PAGE_MODES,
} from "../../core/constants.js";

import { createRegistry } from "../../core/registry.js";
import { el } from "../../utils/dom.js";

const PAGE_LAYOUT_TYPE = "page-layout";
const NOT_FOUND_LAYOUT_ID = "not-found";

function getPages(context) {
  try {
    if (typeof context.router?.getSwitcherPages === "function") {
      return context.router.getSwitcherPages();
    }
  } catch {
    /* Fall back to raw page data. */
  }

  const pages = context.data?.pages?.pages ?? [];

  return pages
    .filter((page) => page && page.enabled !== false && page.hidden !== true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function createActionButton(label, onClick) {
  const button = el(
    "button",
    {
      className: "nav-control nav-control--text",
      attrs: {
        type: "button",
      },
      text: label,
    },
  );

  button.addEventListener("click", onClick);

  return button;
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

function createSimpleWidget({ title, subtitle, body }) {
  const widget = el("section", { className: "dsd-widget" });

  const header = el("div", { className: "dsd-widget-header" }, [
    el("h2", { className: "dsd-widget-title", text: title }),
  ]);

  if (subtitle) {
    header.append(
      el("div", {
        className: "dsd-widget-meta",
        text: subtitle,
      }),
    );
  }

  widget.append(header);

  widget.append(
    el("div", { className: "dsd-widget-body" }, [body]),
  );

  return widget;
}

function createPageList(context) {
  const pages = getPages(context);
  const list = el("div", { className: "dsd-list" });

  if (pages.length === 0) {
    list.append(
      el("div", {
        className: "app-panel-note",
        text: "Chưa có trang nào.",
      }),
    );

    return list;
  }

  for (const page of pages) {
    const item = el(
      "button",
      {
        className: "dsd-list-item dsd-list-item--action",
        attrs: {
          type: "button",
        },
      },
      [
        el("span", { className: "dsd-list-item-text" }, [
          el("span", {
            className: "dsd-list-item-title",
            text: page.label ?? page.id,
          }),
          page.description
            ? el("span", {
                className: "dsd-list-item-subtitle",
                text: page.description,
              })
            : null,
        ]),
      ],
    );

    item.addEventListener("click", () => {
      context.router?.navigate?.(page.id);
    });

    list.append(item);
  }

  return list;
}

function renderArticlePage(route, context) {
  const page = route?.page ?? {};

  const root = el("div", { className: "dsd" });

  const widget = el("article", { className: "dsd-widget" });

  const header = el("div", { className: "dsd-widget-header" }, [
    el("h2", {
      className: "dsd-widget-title",
      text: page.label ?? "HoyoAO",
    }),
  ]);

  widget.append(header);

  const body = el("div", { className: "dsd-widget-body" });

  if (page.description) {
    body.append(
      el("p", {
        text: page.description,
      }),
    );
  }

  const content = page.content;

  if (content?.body) {
    body.append(
      el("p", {
        text: String(content.body),
      }),
    );
  }

  if (Array.isArray(content?.sections)) {
    for (const section of content.sections) {
      if (!section) {
        continue;
      }

      if (section.heading) {
        body.append(
          el("h3", {
            text: String(section.heading),
          }),
        );
      }

      if (section.body) {
        body.append(
          el("p", {
            text: String(section.body),
          }),
        );
      }
    }
  }

  body.append(
    createMetaList([
      {
        title: "Page ID",
        subtitle: page.id ?? route?.pageId ?? "",
      },
      {
        title: "Layout",
        subtitle: page.layout ?? route?.layout ?? "article",
      },
      {
        title: "Mode",
        subtitle: page.mode ?? route?.mode ?? "2d",
      },
      {
        title: "Route",
        subtitle: page.route ?? route?.route ?? "",
      },
    ]),
  );

  widget.append(body);
  root.append(widget);

  return root;
}

function getGalleryItems(route, context) {
  const page = route?.page ?? {};

  if (Array.isArray(page.gallery?.items)) {
    return page.gallery.items.filter(Boolean);
  }

  return getPages(context).filter(
    (candidatePage) => candidatePage.id !== route?.pageId,
  );
}

function createGalleryCard(item, context) {
  const title = item.title ?? item.label ?? item.id ?? "Item";
  const subtitle =
    item.subtitle ?? item.description ?? item.layout ?? "";

  const children = [];

  if (item.image) {
    children.push(
      el("div", { className: "crd-media" }, [
        el("img", {
          attrs: {
            src: item.image,
            alt: title,
            loading: "lazy",
          },
        }),
      ]),
    );
  }

  children.push(
    el("div", { className: "crd-header" }, [
      el("div", { className: "crd-header-text" }, [
        el("h3", {
          className: "crd-title",
          text: title,
        }),
        el("p", {
          className: "crd-subtitle",
          text: subtitle,
        }),
      ]),
    ]),
  );

  const metaParts = [];

  if (item.type) {
    metaParts.push(String(item.type));
  }

  if (item.layout) {
    metaParts.push(String(item.layout));
  }

  if (item.mode) {
    metaParts.push(String(item.mode));
  }

  if (metaParts.length > 0) {
    children.push(
      el("div", { className: "crd-body" }, [
        el("p", {
          text: metaParts.join(" · "),
        }),
      ]),
    );
  }

  const hasTarget = Boolean(
    item.pageId ?? item.route ?? item.href ?? item.id,
  );

  if (hasTarget) {
    const openButton = createActionButton("Mở", () => {
      if (item.href) {
        window.open(item.href, item.target ?? "_blank", "noopener");
        return;
      }

      context.router?.navigate?.(
        item.pageId ?? item.route ?? item.id,
      );
    });

    children.push(
      el("div", { className: "crd-footer" }, [
        el("div", { className: "dsd-actions" }, [openButton]),
      ]),
    );
  }

  return el("article", { className: "crd" }, children);
}

function renderGalleryPage(route, context) {
  const page = route?.page ?? {};

  const root = el("div", { className: "dsd" });

  root.append(createPageHeader(page));

  const items = getGalleryItems(route, context);

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
    grid.append(createGalleryCard(item, context));
  }

  root.append(grid);

  return root;
}

function renderImmersivePage(route, context) {
  const page = route?.page ?? {};
  const envConfig = context.config?.["3d"] ?? {};

  const scene = page.scene;

  const sceneId =
    typeof scene === "string" ? scene : scene?.id ?? null;

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

  body.append(
    el("div", { className: "dsd-actions" }, [
      createActionButton("Về trang chủ", () => {
        context.router?.navigate?.(
          context.data?.pages?.defaultPageId ?? "home",
        );
      }),
    ]),
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

function renderDashboardPage(route, context) {
  const page = route?.page ?? {};

  const root = el("div", { className: "dsd" });

  root.append(createPageHeader(page));

  const grid = el("div", {
    className: "dsd-grid dsd-grid--wide",
  });

  grid.append(
    createSimpleWidget({
      title: "Thông tin trang",
      subtitle: page.layout ?? PAGE_LAYOUTS.DASHBOARD,
      body: createMetaList([
        {
          title: "Page ID",
          subtitle: page.id ?? route?.pageId ?? "",
        },
        {
          title: "Layout",
          subtitle: page.layout ?? route?.layout ?? "",
        },
        {
          title: "Mode",
          subtitle: page.mode ?? route?.mode ?? "",
        },
        {
          title: "Route",
          subtitle: page.route ?? route?.route ?? "",
        },
      ]),
    }),
  );

  grid.append(
    createSimpleWidget({
      title: "Trang",
      subtitle: "Data-driven pages",
      body: createPageList(context),
    }),
  );

  root.append(grid);

  return root;
}

function renderNotFoundPage(route, context) {
  const root = el("div", { className: "dsd" });

  const emptyState = el("div", { className: "dsd-empty" });

  emptyState.append(
    el("div", {
      className: "dsd-empty-title",
      text: "404",
    }),
  );

  emptyState.append(
    el("p", {
      text:
        route?.page?.description ??
        "Trang không tồn tại.",
    }),
  );

  emptyState.append(
    el("div", { className: "dsd-empty-actions" }, [
      createActionButton("Về trang chủ", () => {
        context.router?.navigate?.(
          context.data?.pages?.defaultPageId ?? "home",
        );
      }),
    ]),
  );

  root.append(emptyState);

  return root;
}

export function createPagesFeature(context) {
  let mounted = false;
  let layoutRegistry = null;
  let previousRenderer = null;

  function isHomeRoute(route) {
    if (!route) {
      return false;
    }

    const defaultPageId =
      context.data?.pages?.defaultPageId ?? "home";

    return route.pageId === defaultPageId || route.pageId === "home";
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
      render: renderDashboardPage,
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

  function getRendererEntry(layoutId) {
    if (!layoutRegistry || !layoutId) {
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

    const explicitRenderer =
      page.renderer ?? route.renderer ?? null;

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
      const immersiveEntry = getRendererEntry(
        PAGE_LAYOUTS.IMMERSIVE,
      );

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
      if (typeof previousRenderer === "function") {
        previousRenderer(route);
      }

      return;
    }

    const view = entry.source.render(route, context);

    if (view === false) {
      return;
    }

    if (view === undefined || view === null) {
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

  function pagesPageRenderer(route) {
    if (!mounted) {
      if (typeof previousRenderer === "function") {
        return previousRenderer(route);
      }

      return undefined;
    }

    if (route?.notFound === true) {
      renderWithLayout(route);

      return undefined;
    }

    if (isHomeRoute(route)) {
      if (typeof previousRenderer === "function") {
        return previousRenderer(route);
      }

      return undefined;
    }

    renderWithLayout(route);

    return undefined;
  }

  function refreshCurrentRoute() {
    if (typeof context.router?.isStarted !== "function") {
      return;
    }

    if (!context.router.isStarted()) {
      return;
    }

    const currentRoute = context.router.getCurrentRoute?.();

    if (currentRoute) {
      void context.router.refresh?.();
    }
  }

  function mount() {
    if (mounted) {
      return;
    }

    if (context.features?.pages === false) {
      return;
    }

    mounted = true;

    layoutRegistry = createRegistry({
      name: "hoyoao-page-layouts",
    });

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
          return layoutRegistry.unregister(
            PAGE_LAYOUT_TYPE,
            layoutId,
          );
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
      });
    }

    previousRenderer = context.services?.pageRenderer ?? null;

    if (context.services) {
      context.services.pageRenderer = pagesPageRenderer;
    }

    context.registerDisposer?.(() => {
      unmount();
    });

    refreshCurrentRoute();
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    if (context.services?.pageRenderer === pagesPageRenderer) {
      context.services.pageRenderer = previousRenderer;
    }

    previousRenderer = null;

    layoutRegistry?.destroy?.();
    layoutRegistry = null;

    if (context.services?.pages) {
      delete context.services.pages;
    }

    refreshCurrentRoute();
  }

  const feature = Object.freeze({
    id: "pages",
    type: "feature",
    order: 8,
    mount,
    unmount,

    registerLayout(layoutDefinition) {
      if (!mounted || !layoutRegistry) {
        throw new Error("[HoyoAO Pages] Pages feature is not mounted.");
      }

      if (typeof layoutDefinition?.render !== "function") {
        throw new TypeError(
          "[HoyoAO Pages] Page layout must provide a render function.",
        );
      }

      return layoutRegistry.register(PAGE_LAYOUT_TYPE, layoutDefinition);
    },

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
