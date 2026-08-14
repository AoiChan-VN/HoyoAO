import { createRegistry } from "../../core/registry.js";
import { el } from "../../utils/dom.js";

const HOME_WIDGET_TYPE = "dashboard-widget";

function getVisiblePages(context) {
  try {
    if (typeof context.router?.getSwitcherPages === "function") {
      return context.router.getSwitcherPages();
    }
  } catch {
    /* Ignore router helper errors and fall back to raw data. */
  }

  const pages = context.data?.pages?.pages ?? [];

  return pages
    .filter((page) => page && page.enabled !== false && page.hidden !== true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function findWorldPage(context) {
  const pages = getVisiblePages(context);

  return (
    pages.find((page) => page.mode === "3d") ??
    pages.find((page) => page.id === "world") ??
    null
  );
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

function createStatCard({ label, value, caption }) {
  return el("section", { className: "dsd-widget dsd-widget--stat" }, [
    el("div", { className: "dsd-widget-body" }, [
      el("div", { className: "dsd-stat" }, [
        el("div", { className: "dsd-stat-content" }, [
          el("div", { className: "dsd-stat-label", text: label }),
          el("div", { className: "dsd-stat-value", text: value }),
          caption
            ? el("div", { className: "dsd-stat-caption", text: caption })
            : null,
        ]),
      ]),
    ]),
  ]);
}

function createList(items) {
  const list = el("div", { className: "dsd-list" });

  for (const item of items) {
    if (!item) {
      continue;
    }

    const isInteractive = typeof item.onClick === "function";

    const itemElement = el(
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
      ],
    );

    if (item.meta) {
      itemElement.append(item.meta);
    }

    if (isInteractive) {
      itemElement.addEventListener("click", item.onClick);
    }

    list.append(itemElement);
  }

  return list;
}

function createWidgetShell({ title, subtitle, body, actions }) {
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

  const widgetBody = el("div", { className: "dsd-widget-body" });

  if (body) {
    widgetBody.append(body);
  }

  widget.append(widgetBody);

  if (actions && actions.length > 0) {
    widget.append(
      el("div", { className: "dsd-widget-footer" }, [
        el("div", { className: "dsd-actions" }, actions),
      ]),
    );
  }

  return widget;
}

function renderOverviewWidget(context) {
  const site = context.config ?? {};

  const items = [
    {
      title: "Tên",
      subtitle: site.name ?? "HoyoAO",
    },
    {
      title: "Tagline",
      subtitle: site.tagline ?? "",
    },
    {
      title: "Ngôn ngữ",
      subtitle: site.locale ?? "vi",
    },
    {
      title: "Hosting",
      subtitle: site.environment?.hosting ?? "github-pages",
    },
    {
      title: "Router",
      subtitle: site.router?.mode ?? "hash",
    },
  ];

  return createWidgetShell({
    title: "Tổng quan",
    subtitle: "Thông tin website",
    body: createList(items),
  });
}

function getEnvironmentStatus(context) {
  const envConfig = context.config?.["3d"] ?? {};
  const envEnabled =
    envConfig.enabled !== false &&
    context.features?.["3dEnvironment"] !== false;

  if (!envEnabled) {
    return "disabled";
  }

  const controller = context.env;

  if (typeof controller?.isRunning === "function" && controller.isRunning()) {
    return "running";
  }

  if (typeof controller?.isActive === "function" && controller.isActive()) {
    return "ready";
  }

  return "idle";
}

function renderEnvironmentWidget(context, route) {
  const envConfig = context.config?.["3d"] ?? {};
  const status = getEnvironmentStatus(context);

  const statusLabels = {
    running: "Đang chạy",
    ready: "Sẵn sàng",
    idle: "Chờ",
    disabled: "Đã tắt",
  };

  const items = [
    {
      title: "Engine",
      subtitle: envConfig.engine ?? "webgl",
    },
    {
      title: "Chất lượng",
      subtitle: envConfig.quality ?? "auto",
    },
    {
      title: "DPR cap",
      subtitle: String(envConfig.dprCap ?? 2),
    },
    {
      title: "Trạng thái",
      subtitle: statusLabels[status] ?? status,
    },
  ];

  const actions = [];

  const worldPage = findWorldPage(context);

  if (worldPage && route?.pageId !== worldPage.id) {
    actions.push(
      createActionButton("Mở thế giới 3D", () => {
        context.router?.navigate?.(worldPage.id);
      }),
    );
  }

  return createWidgetShell({
    title: "Môi trường 3D",
    subtitle: "WebGL runtime foundation",
    body: createList(items),
    actions,
  });
}

function renderPagesWidget(context) {
  const pages = getVisiblePages(context);

  if (pages.length === 0) {
    return createWidgetShell({
      title: "Trang",
      subtitle: "Data-driven pages",
      body: el("div", {
        className: "app-panel-note",
        text: "Chưa có trang nào.",
      }),
    });
  }

  const items = pages.map((page) => ({
    title: page.label ?? page.id,
    subtitle: page.description ?? "",
    onClick: () => {
      context.router?.navigate?.(page.id);
    },
  }));

  return createWidgetShell({
    title: "Trang",
    subtitle: `${pages.length} trang`,
    body: createList(items),
  });
}

function renderFeaturesWidget(context) {
  const features = context.features ?? {};
  const entries = Object.entries(features);

  if (entries.length === 0) {
    return createWidgetShell({
      title: "Tính năng",
      subtitle: "Feature flags",
      body: el("div", {
        className: "app-panel-note",
        text: "Chưa có feature flag nào.",
      }),
    });
  }

  const items = entries.map(([key, value]) => {
    const enabled = value === true;

    return {
      title: key,
      subtitle: typeof value,
      meta: el("span", {
        className: enabled
          ? "dsd-badge dsd-badge--success"
          : "dsd-badge dsd-badge--muted",
        text: enabled ? "enabled" : "disabled",
      }),
    };
  });

  return createWidgetShell({
    title: "Tính năng",
    subtitle: "Local runtime configuration",
    body: createList(items),
  });
}

function renderServicesWidget(context) {
  const servicesConfig = context.config?.services ?? {};

  const items = [
    {
      title: "Data provider",
      subtitle: servicesConfig.data?.baseUrl ?? "./data",
      meta: el("span", {
        className: "dsd-badge dsd-badge--info",
        text: servicesConfig.data?.provider ?? "local",
      }),
    },
    {
      title: "Search provider",
      subtitle: `min query: ${servicesConfig.search?.minQueryLength ?? 2}`,
      meta: el("span", {
        className: "dsd-badge dsd-badge--info",
        text: servicesConfig.search?.provider ?? "local",
      }),
    },
    {
      title: "Storage provider",
      subtitle: `namespace: ${servicesConfig.storage?.namespace ?? "hoyoao"}`,
      meta: el("span", {
        className: "dsd-badge dsd-badge--info",
        text: servicesConfig.storage?.provider ?? "memory",
      }),
    },
  ];

  return createWidgetShell({
    title: "Dịch vụ",
    subtitle: "Future backend abstraction",
    body: createList(items),
  });
}

function createHomeHeader(context, route) {
  const page =
    route?.page ??
    context.router?.getPageById?.(route?.pageId) ??
    {};

  const header = el("header", { className: "dsd-header" });

  header.append(
    el("div", { className: "dsd-header-text" }, [
      el("h1", {
        className: "dsd-title",
        text: page.label ?? context.config?.name ?? "HoyoAO",
      }),
      el("p", {
        className: "dsd-subtitle",
        text: page.description ?? context.config?.tagline ?? "",
      }),
    ]),
  );

  const worldPage = findWorldPage(context);

  if (worldPage && route?.pageId !== worldPage.id) {
    header.append(
      el("div", { className: "dsd-actions" }, [
        createActionButton("Vào thế giới 3D", () => {
          context.router?.navigate?.(worldPage.id);
        }),
      ]),
    );
  }

  return header;
}

function createStatsGrid(context) {
  const visiblePages = getVisiblePages(context);

  const featureEntries = Object.entries(context.features ?? {});
  const enabledFeatures = featureEntries.filter(
    ([, value]) => value === true,
  ).length;

  const envConfig = context.config?.["3d"] ?? {};
  const envStatus = getEnvironmentStatus(context);

  const envValue =
    envStatus === "disabled" ? "disabled" : envConfig.engine ?? "webgl";

  const envCaption =
    envStatus === "disabled"
      ? "3D đã tắt"
      : `Chất lượng: ${envConfig.quality ?? "auto"}`;

  const dataProvider = context.config?.services?.data?.provider ?? "local";

  return el("div", { className: "dsd-grid dsd-grid--stats" }, [
    createStatCard({
      label: "Trang",
      value: String(visiblePages.length),
      caption: "Số trang hiển thị",
    }),
    createStatCard({
      label: "Tính năng",
      value: `${enabledFeatures}/${featureEntries.length}`,
      caption: "Đang bật / tổng",
    }),
    createStatCard({
      label: "Môi trường",
      value: envValue,
      caption: envCaption,
    }),
    createStatCard({
      label: "Dữ liệu",
      value: dataProvider,
      caption: "Nguồn dữ liệu",
    }),
  ]);
}

export function createHomeFeature(context) {
  let mounted = false;
  let widgetRegistry = null;
  let previousRenderer = null;

  function isHomeRoute(route) {
    if (!route) {
      return false;
    }

    const defaultPageId = context.data?.pages?.defaultPageId ?? "home";

    return route.pageId === defaultPageId || route.pageId === "home";
  }

  function registerDefaultWidgets() {
    widgetRegistry.register(HOME_WIDGET_TYPE, {
      id: "home-overview",
      label: "Overview",
      order: 10,
      render: renderOverviewWidget,
    });

    widgetRegistry.register(HOME_WIDGET_TYPE, {
      id: "home-environment",
      label: "Environment",
      order: 20,
      render: renderEnvironmentWidget,
    });

    widgetRegistry.register(HOME_WIDGET_TYPE, {
      id: "home-pages",
      label: "Pages",
      order: 30,
      render: renderPagesWidget,
    });

    widgetRegistry.register(HOME_WIDGET_TYPE, {
      id: "home-features",
      label: "Features",
      order: 40,
      render: renderFeaturesWidget,
    });

    widgetRegistry.register(HOME_WIDGET_TYPE, {
      id: "home-services",
      label: "Services",
      order: 50,
      render: renderServicesWidget,
    });
  }

  function renderHomePage(route) {
    const content = context.shell?.content;

    if (!content) {
      return;
    }

    content.replaceChildren();

    const root = el("div", { className: "dsd" });

    root.append(createHomeHeader(context, route));
    root.append(createStatsGrid(context));

    const grid = el("div", {
      className: "dsd-grid dsd-grid--wide",
    });

    const widgets = widgetRegistry.getEnabled(HOME_WIDGET_TYPE, context);

    for (const widgetEntry of widgets) {
      const renderWidget = widgetEntry?.source?.render;

      if (typeof renderWidget !== "function") {
        continue;
      }

      try {
        const widgetElement = renderWidget(context, route);

        if (!widgetElement) {
          continue;
        }

        const nodes = Array.isArray(widgetElement)
          ? widgetElement
          : [widgetElement];

        for (const node of nodes) {
          if (node) {
            grid.append(node);
          }
        }
      } catch (error) {
        console.error(
          `[HoyoAO Home] Widget "${widgetEntry.id}" failed.`,
          error,
        );
      }
    }

    root.append(grid);

    content.append(root);
  }

  function homePageRenderer(route) {
    if (mounted && isHomeRoute(route)) {
      renderHomePage(route);

      return undefined;
    }

    if (typeof previousRenderer === "function") {
      return previousRenderer(route);
    }

    return undefined;
  }

  function refreshIfHome() {
    if (typeof context.router?.isStarted !== "function") {
      return;
    }

    if (!context.router.isStarted()) {
      return;
    }

    const currentRoute = context.router.getCurrentRoute?.();

    if (currentRoute && isHomeRoute(currentRoute)) {
      void context.router.refresh?.();
    }
  }

  function mount() {
    if (mounted) {
      return;
    }

    if (context.features?.home === false) {
      return;
    }

    mounted = true;

    widgetRegistry = createRegistry({
      name: "hoyoao-home-widgets",
    });

    registerDefaultWidgets();

    if (context.services) {
      context.services.homeWidgets = Object.freeze({
        register(widget) {
          return widgetRegistry.register(HOME_WIDGET_TYPE, widget);
        },
        unregister(widgetId) {
          return widgetRegistry.unregister(HOME_WIDGET_TYPE, widgetId);
        },
        getAll() {
          return widgetRegistry.getEnabled(HOME_WIDGET_TYPE, context);
        },
      });
    }

    previousRenderer = context.services?.pageRenderer ?? null;

    if (context.services) {
      context.services.pageRenderer = homePageRenderer;
    }

    context.registerDisposer?.(() => {
      unmount();
    });

    refreshIfHome();
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    if (context.services?.pageRenderer === homePageRenderer) {
      context.services.pageRenderer = previousRenderer;
    }

    previousRenderer = null;

    widgetRegistry?.destroy?.();
    widgetRegistry = null;

    if (context.services?.homeWidgets) {
      delete context.services.homeWidgets;
    }

    refreshIfHome();
  }

  const feature = Object.freeze({
    id: "home",
    type: "feature",
    order: 5,
    mount,
    unmount,
    registerWidget(widget) {
      if (!mounted || !widgetRegistry) {
        throw new Error("[HoyoAO Home] Home feature is not mounted.");
      }

      return widgetRegistry.register(HOME_WIDGET_TYPE, widget);
    },
    isMounted() {
      return mounted;
    },
  });

  if (context.services) {
    context.services.homeFeature = feature;
  }

  return feature;
}

export function mountHomeFeature(context) {
  const feature = createHomeFeature(context);

  feature.mount();

  return feature;
}

export default createHomeFeature; 
