import { PAGE_LAYOUTS } from "../core/constants.js";
import { mountPanelManager } from "../components/panels/panel-manager.js";

function el(tag, options = {}, children = []) {
  const element = document.createElement(tag);

  const {
    id,
    className,
    text,
    attrs = {},
    dataset = {},
  } = options;

  if (id) {
    element.id = id;
  }

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = text;
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    if (value === true) {
      element.setAttribute(key, "");
    } else {
      element.setAttribute(key, String(value));
    }
  }

  for (const [key, value] of Object.entries(dataset)) {
    if (value !== undefined && value !== null) {
      element.dataset[key] = String(value);
    }
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) {
      continue;
    }

    element.append(child);
  }

  return element;
}

function createListItem(title, subtitle, onClick) {
  const isInteractive = typeof onClick === "function";

  const item = el(
    isInteractive ? "button" : "div",
    {
      className: isInteractive
        ? "dsd-list-item dsd-list-item--action"
        : "dsd-list-item",
      attrs: isInteractive
        ? {
            type: "button",
          }
        : {},
    },
    [
      el("span", { className: "dsd-list-item-text" }, [
        el("span", { className: "dsd-list-item-title", text: title }),
        subtitle
          ? el("span", {
              className: "dsd-list-item-subtitle",
              text: subtitle,
            })
          : null,
      ]),
    ],
  );

  if (isInteractive) {
    item.addEventListener("click", onClick);
  }

  return item;
}

function createWidget({ title, subtitle, renderBody }) {
  const widget = el("section", {
    className: "dsd-widget",
  });

  const header = el("div", {
    className: "dsd-widget-header",
  });

  header.append(
    el("h2", {
      className: "dsd-widget-title",
      text: title,
    }),
  );

  if (subtitle) {
    header.append(
      el("div", {
        className: "dsd-widget-meta",
        text: subtitle,
      }),
    );
  }

  const body = el("div", {
    className: "dsd-widget-body",
  });

  if (typeof renderBody === "function") {
    renderBody(body);
  }

  widget.append(header, body);

  return widget;
}

function createPageHeader(route, context) {
  const page = route.page ?? {};
  const site = context.config ?? {};

  return el("header", { className: "dsd-header" }, [
    el("div", { className: "dsd-header-text" }, [
      el("h1", {
        className: "dsd-title",
        text: page.label ?? site.name ?? "HoyoAO",
      }),
      el("p", {
        className: "dsd-subtitle",
        text: page.description ?? site.tagline ?? "",
      }),
    ]),
  ]);
}

function renderDashboardPage(content, route, context) {
  const site = context.config ?? {};
  const features = context.features ?? {};
  const pages = context.router?.getSwitcherPages?.() ?? [];
  const environmentConfig = site["3d"] ?? {};

  const root = el("div", { className: "dsd" });

  root.append(createPageHeader(route, context));

  const grid = el("div", {
    className: "dsd-grid dsd-grid--wide",
  });

  grid.append(
    createWidget({
      title: "Site",
      subtitle: site.locale ?? null,
      renderBody(body) {
        const list = el("div", { className: "dsd-list" });

        list.append(createListItem("Name", site.name));
        list.append(createListItem("Tagline", site.tagline));
        list.append(createListItem("Locale", site.locale));
        list.append(
          createListItem(
            "Environment",
            environmentConfig.enabled === false
              ? "disabled"
              : environmentConfig.engine ?? "webgl",
          ),
        );

        body.append(list);
      },
    }),
  );

  grid.append(
    createWidget({
      title: "Features",
      subtitle: "Local runtime configuration",
      renderBody(body) {
        const list = el("div", { className: "dsd-list" });

        for (const [key, enabled] of Object.entries(features)) {
          const badge = el("span", {
            className: enabled
              ? "dsd-badge dsd-badge--success"
              : "dsd-badge dsd-badge--muted",
            text: enabled ? "enabled" : "disabled",
          });

          list.append(
            el("div", { className: "dsd-list-item" }, [
              el("span", { className: "dsd-list-item-text" }, [
                el("span", {
                  className: "dsd-list-item-title",
                  text: key,
                }),
              ]),
              badge,
            ]),
          );
        }

        body.append(list);
      },
    }),
  );

  grid.append(
    createWidget({
      title: "Pages",
      subtitle: `${pages.length} pages`,
      renderBody(body) {
        const list = el("div", { className: "dsd-list" });

        for (const page of pages) {
          list.append(
            createListItem(page.label, page.description, () => {
              context.router?.navigate?.(page.id);
            }),
          );
        }

        body.append(list);
      },
    }),
  );

  root.append(grid);
  content.append(root);
}

function renderGalleryPage(content, route, context) {
  const pages = context.router?.getSwitcherPages?.() ?? [];

  const root = el("div", { className: "dsd" });

  root.append(createPageHeader(route, context));

  const grid = el("div", {
    className: "crd-grid",
  });

  for (const page of pages) {
    const openButton = el(
      "button",
      {
        className: "nav-control nav-control--text",
        attrs: {
          type: "button",
        },
        text: "Open",
      },
    );

    openButton.addEventListener("click", () => {
      context.router?.navigate?.(page.id);
    });

    const card = el("article", { className: "crd" }, [
      el("div", { className: "crd-header" }, [
        el("div", { className: "crd-header-text" }, [
          el("h3", {
            className: "crd-title",
            text: page.label,
          }),
          el("p", {
            className: "crd-subtitle",
            text: page.description ?? "",
          }),
        ]),
      ]),
      el("div", { className: "crd-body" }, [
        el("p", {
          text: `Layout: ${page.layout ?? "blank"}`,
        }),
        el("p", {
          text: `Mode: ${page.mode ?? "2d"}`,
        }),
      ]),
      el("div", { className: "crd-footer" }, [openButton]),
    ]);

    grid.append(card);
  }

  root.append(grid);
  content.append(root);
}

function renderArticlePage(content, route, context) {
  const page = route.page ?? {};

  const root = el("div", { className: "dsd" });

  const article = el("article", { className: "dsd-widget" });

  article.append(
    el("div", { className: "dsd-widget-header" }, [
      el("h2", {
        className: "dsd-widget-title",
        text: page.label ?? "HoyoAO",
      }),
    ]),
  );

  const body = el("div", { className: "dsd-widget-body" });

  if (page.description) {
    body.append(el("p", { text: page.description }));
  }

  const meta = el("div", { className: "dsd-list" });

  meta.append(createListItem("Page ID", page.id));
  meta.append(createListItem("Layout", page.layout ?? "blank"));
  meta.append(createListItem("Mode", page.mode ?? "2d"));

  body.append(meta);

  article.append(body);
  root.append(article);
  content.append(root);
}

function renderImmersivePage(content, route, context) {
  const page = route.page ?? {};
  const environmentConfig = context.config?.["3d"] ?? {};

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
      text: `3D environment: ${
        environmentConfig.enabled === false
          ? "disabled"
          : environmentConfig.engine ?? "webgl"
      }`,
    }),
  );

  widget.append(body);
  root.append(widget);
  content.append(root);
}

function renderNotFoundPage(content, route, context) {
  const page = route.page ?? {};

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
      text: page.description ?? "Trang không tồn tại.",
    }),
  );

  const homeButton = el(
    "button",
    {
      className: "nav-control nav-control--text",
      attrs: {
        type: "button",
      },
      text: "Về trang chủ",
    },
  );

  homeButton.addEventListener("click", () => {
    context.router?.navigate?.(context.data.pages?.defaultPageId ?? "home");
  });

  emptyState.append(
    el("div", { className: "dsd-empty-actions" }, [homeButton]),
  );

  root.append(emptyState);
  content.append(root);
}

function createDefaultPageRenderer(context) {
  return async function renderPage(route) {
    const content = context.shell?.content;

    if (!content || !route) {
      return;
    }

    content.replaceChildren();

    if (route.notFound) {
      renderNotFoundPage(content, route, context);
      return;
    }

    switch (route.layout) {
      case PAGE_LAYOUTS.DASHBOARD:
        renderDashboardPage(content, route, context);
        break;

      case PAGE_LAYOUTS.GALLERY:
        renderGalleryPage(content, route, context);
        break;

      case PAGE_LAYOUTS.IMMERSIVE:
        renderImmersivePage(content, route, context);
        break;

      case PAGE_LAYOUTS.BLANK:
        break;

      case PAGE_LAYOUTS.ARTICLE:
      default:
        renderArticlePage(content, route, context);
        break;
    }
  };
}

export function mountApplication(context) {
  if (!context) {
    throw new Error("[HoyoAO] Application requires a valid context.");
  }

  if (context.services?.appMounted) {
    return context.services.app;
  }

  context.services = context.services ?? {};

  const panelManager = mountPanelManager(context);

  context.services.panelManager = panelManager;
  context.services.pageRenderer = createDefaultPageRenderer(context);
  context.services.appMounted = true;

  if (context.router?.isStarted?.()) {
    void context.router.refresh();
  }

  const app = Object.freeze({
    panelManager,
  });

  context.services.app = app;

  return app;
}

export default mountApplication; 
