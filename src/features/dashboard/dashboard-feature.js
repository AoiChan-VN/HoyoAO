import { el } from "../../utils/dom.js";
import { createChart, CHART_TYPES } from "../../utils/charts.js";

const DASHBOARD_LAYOUT_ID = "dashboard";

function normalizeSeriesList(rawSeries) {
  if (!Array.isArray(rawSeries)) {
    return [];
  }

  return rawSeries
    .filter((series) => series && Array.isArray(series.data))
    .map((series) => ({
      id: series.id ?? series.name ?? "series",
      name: series.name ?? "Series",
      color: series.color ?? null,
      data: series.data.map((value) => Number(value) || 0),
    }));
}

function normalizeDrive(raw) {
  if (!raw || !raw.id) {
    return null;
  }

  return {
    id: raw.id,
    label: raw.label ?? raw.id,
    description: raw.description ?? "",
    icon: raw.icon ?? null,
    requiresAuth: raw.requiresAuth === true,
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    main:
      raw.main && Array.isArray(raw.main.labels)
        ? {
            labels: raw.main.labels.map(String),
            series: normalizeSeriesList(raw.main.series),
          }
        : null,
    details: Array.isArray(raw.details)
      ? raw.details.filter((detail) => detail && detail.chart)
      : [],
  };
}

function buildDefaultWebDrive(context) {
  const pages =
    context.router?.getSwitcherPages?.() ??
    context.data?.pages?.pages ??
    [];

  const featureEntries = Object.entries(context.features ?? {});
  const enabledFeatures = featureEntries.filter(
    ([, value]) => value === true,
  ).length;

  const envConfig = context.config?.["3d"] ?? {};

  return {
    id: "web",
    label: "Ổ Web",
    description: "Dữ liệu vận hành cục bộ của HoyoAO.",
    icon: "globe",
    requiresAuth: false,
    stats: [
      {
        label: "Trang",
        value: String(pages.length),
        caption: "Số trang hiển thị",
      },
      {
        label: "Tính năng",
        value: `${enabledFeatures}/${featureEntries.length}`,
        caption: "Đang bật / tổng",
      },
      {
        label: "Môi trường",
        value:
          envConfig.enabled === false ? "disabled" : envConfig.engine ?? "webgl",
        caption: `Chất lượng: ${envConfig.quality ?? "auto"}`,
      },
      {
        label: "Dữ liệu",
        value: context.config?.services?.data?.provider ?? "local",
        caption: "Nguồn dữ liệu",
      },
    ],
    main: null,
    details: [],
  };
}

export function createDashboardFeature(context) {
  let mounted = false;
  let drivesConfig = null;

  const activeCharts = [];
  const disposers = [];

  let pendingSpecs = [];

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function destroyCharts() {
    while (activeCharts.length > 0) {
      const chart = activeCharts.pop();

      try {
        chart.destroy();
      } catch {
        /* Ignore chart teardown errors. */
      }
    }
  }

  async function loadDrives(force = false) {
    if (drivesConfig && !force) {
      return drivesConfig;
    }

    try {
      const url = new URL("../../data/drives.json", import.meta.url);

      const response = await fetch(url.href, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`drives.json responded ${response.status}`);
      }

      const json = await response.json();

      const drives = (json?.drives ?? [])
        .filter((raw) => raw && raw.enabled !== false)
        .map(normalizeDrive)
        .filter(Boolean);

      drivesConfig = {
        defaultDriveId: json?.defaultDriveId ?? drives[0]?.id ?? "web",
        drives: drives.length > 0 ? drives : [buildDefaultWebDrive(context)],
      };
    } catch {
      drivesConfig = {
        defaultDriveId: "web",
        drives: [buildDefaultWebDrive(context)],
      };
    }

    const currentActiveId =
      context.store?.getState?.()?.dashboard?.activeDriveId;

    if (!currentActiveId) {
      context.store?.setState?.({
        dashboard: {
          activeDriveId: drivesConfig.defaultDriveId,
        },
      });
    }

    return drivesConfig;
  }

  function getDrives() {
    return drivesConfig?.drives ?? [];
  }

  function getActiveDrive() {
    const activeId =
      context.store?.getState?.()?.dashboard?.activeDriveId;

    return (
      getDrives().find((drive) => drive.id === activeId) ??
      getDrives()[0] ??
      null
    );
  }

  function setActiveDrive(driveId) {
    context.store?.setState?.({
      dashboard: {
        activeDriveId: driveId,
      },
    });
  }

  function currentIsDashboard() {
    return (
      context.router?.getCurrentRoute?.()?.layout === DASHBOARD_LAYOUT_ID
    );
  }

  function refreshIfOnDashboard() {
    if (currentIsDashboard()) {
      void context.router?.refresh?.();
    }
  }

  function registerChart(canvas, options) {
    const spec = {
      canvas,
      options,
      controller: null,
    };

    pendingSpecs.push(spec);

    return spec;
  }

  function initPendingCharts() {
    for (const spec of pendingSpecs) {
      try {
        spec.controller = createChart(spec.canvas, spec.options);
        activeCharts.push(spec.controller);
      } catch (error) {
        console.error("[HoyoAO Dashboard] Chart init failed.", error);
      }
    }

    pendingSpecs = [];
  }

  function createDriveTabs(activeDrive) {
    const drives = getDrives();

    if (drives.length < 2) {
      return null;
    }

    const tabs = el("div", {
      className: "dsd-tabs",
      attrs: {
        role: "tablist",
        "aria-label": "Chọn ổ đĩa dữ liệu",
      },
    });

    for (const drive of drives) {
      const isActive = drive.id === activeDrive?.id;

      const tab = el("button", {
        className: "dsd-tab",
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": String(isActive),
          title: drive.description || undefined,
        },
        text: drive.label,
      });

      tab.addEventListener("click", () => {
        setActiveDrive(drive.id);
      });

      tabs.append(tab);
    }

    return tabs;
  }

  function createStatCards(drive) {
    const grid = el("div", {
      className: "dsd-grid dsd-grid--stats",
    });

    for (const stat of drive.stats) {
      grid.append(
        el("section", { className: "dsd-widget dsd-widget--stat" }, [
          el("div", { className: "dsd-widget-body" }, [
            el("div", { className: "dsd-stat" }, [
              el("div", { className: "dsd-stat-content" }, [
                el("div", {
                  className: "dsd-stat-label",
                  text: stat.label,
                }),
                el("div", {
                  className: "dsd-stat-value",
                  text: stat.value,
                }),
                stat.caption
                  ? el("div", {
                      className: "dsd-stat-caption",
                      text: stat.caption,
                    })
                  : null,
              ]),
            ]),
          ]),
        ]),
      );
    }

    return grid;
  }

  function createChartTypeActions(spec) {
    const actions = el("div", {
      className: "dsd-actions",
    });

    const types = [
      { type: CHART_TYPES.AREA, label: "Sóng" },
      { type: CHART_TYPES.BAR, label: "Cột" },
      { type: CHART_TYPES.LINE, label: "Đường" },
    ];

    const buttons = [];

    for (const entry of types) {
      const button = el("button", {
        className: "nav-control nav-control--text",
        attrs: {
          type: "button",
          "aria-pressed": String(entry.type === spec.options.type),
        },
        text: entry.label,
      });

      button.addEventListener("click", () => {
        spec.controller?.setType(entry.type);

        for (const other of buttons) {
          other.element.setAttribute(
            "aria-pressed",
            String(other.type === entry.type),
          );
        }
      });

      buttons.push({ element: button, type: entry.type });
      actions.append(button);
    }

    return actions;
  }

  function createMainPanel(drive) {
    const panel = el("section", {
      className: "dsd-widget dsd-span-full",
    });

    const header = el("div", { className: "dsd-widget-header" }, [
      el("h2", {
        className: "dsd-widget-title",
        text: "Biểu đồ tổng thể",
      }),
      el("div", {
        className: "dsd-widget-meta",
        text: drive.label,
      }),
    ]);

    const body = el("div", { className: "dsd-widget-body" });

    const wrapper = el("div", { className: "dsd-chart" });
    const canvas = el("canvas", {
      attrs: {
        "aria-label": `Biểu đồ tổng thể của ${drive.label}`,
        role: "img",
      },
    });

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    wrapper.append(canvas);

    const spec = registerChart(canvas, {
      type: CHART_TYPES.AREA,
      labels: drive.main?.labels ?? [],
      series: drive.main?.series ?? [],
    });

    header.append(createChartTypeActions(spec));

    body.append(wrapper);

    if (!drive.main) {
      body.append(
        el("div", {
          className: "app-panel-note",
          text: "Ổ đĩa này chưa có dữ liệu chuỗi. Bổ sung data/drives.json để hiển thị biểu đồ luồng.",
        }),
      );
    }

    panel.append(header, body);

    return panel;
  }

  function createDetailCards(drive) {
    const grid = el("div", { className: "crd-grid" });

    for (const detail of drive.details) {
      const wrapper = el("div", {
        className: "dsd-chart dsd-chart--16x9",
      });

      const canvas = el("canvas", {
        attrs: {
          "aria-label": detail.title ?? "Biểu đồ chi tiết",
          role: "img",
        },
      });

      canvas.style.width = "100%";
      canvas.style.height = "100%";

      wrapper.append(canvas);

      registerChart(canvas, {
        type: detail.chart.type ?? CHART_TYPES.BAR,
        labels: detail.chart.labels ?? [],
        series: normalizeSeriesList(detail.chart.series),
      });

      const bodyChildren = [wrapper];

      if (detail.note) {
        bodyChildren.push(
          el("p", {
            className: "crd-subtitle",
            text: detail.note,
          }),
        );
      }

      grid.append(
        el("article", { className: "crd" }, [
          el("div", { className: "crd-header" }, [
            el("div", { className: "crd-header-text" }, [
              el("h3", {
                className: "crd-title",
                text: detail.title ?? "Chi tiết",
              }),
              el("p", {
                className: "crd-subtitle",
                text: detail.subtitle ?? "",
              }),
            ]),
          ]),
          el("div", { className: "crd-body" }, bodyChildren),
        ]),
      );
    }

    return grid;
  }

  function renderDashboard() {
    destroyCharts();
    pendingSpecs = [];

    const root = el("div", { className: "dsd" });

    const drive = getActiveDrive();

    if (!drive) {
      root.append(
        el("div", {
          className: "app-panel-note",
          text: "Đang tải dữ liệu ổ đĩa...",
        }),
      );

      return root;
    }

    const header = el("header", { className: "dsd-header" }, [
      el("div", { className: "dsd-header-text" }, [
        el("h1", {
          className: "dsd-title",
          text: `Dashboard — ${drive.label}`,
        }),
        el("p", {
          className: "dsd-subtitle",
          text:
            drive.description ||
            "Tổng quan dữ liệu theo ổ đĩa đã chọn.",
        }),
      ]),
    ]);

    const refreshButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: {
        type: "button",
      },
      text: "Làm mới dữ liệu",
    });

    refreshButton.addEventListener("click", () => {
      void loadDrives(true).then(refreshIfOnDashboard);
    });

    header.append(
      el("div", { className: "dsd-actions" }, [refreshButton]),
    );

    root.append(header);

    const tabs = createDriveTabs(drive);

    if (tabs) {
      root.append(tabs);
    }

    if (drive.stats.length > 0) {
      root.append(createStatCards(drive));
    }

    root.append(createMainPanel(drive));

    if (drive.details.length > 0) {
      root.append(createDetailCards(drive));
    }

    requestAnimationFrame(initPendingCharts);

    return root;
  }

  async function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    const pagesService = context.services?.pages;

    if (pagesService?.registerLayout) {
      try {
        await pagesService.unregisterLayout(DASHBOARD_LAYOUT_ID);
      } catch {
        /* Layout default may not exist yet. */
      }

      try {
        pagesService.registerLayout({
          id: DASHBOARD_LAYOUT_ID,
          label: "Dashboard layout",
          order: 40,
          render: renderDashboard,
        });
      } catch (error) {
        console.error("[HoyoAO Dashboard] Layout registration failed.", error);
      }
    }

    addDisposer(
      context.store?.subscribeSelector?.(
        (state) => state.dashboard?.activeDriveId,
        refreshIfOnDashboard,
      ),
    );

    if (context.services) {
      context.services.drives = Object.freeze({
        getDrives,
        getActiveDrive,
        setActiveDrive,
        refresh(force = true) {
          return loadDrives(force);
        },
      });
    }

    void loadDrives().then(refreshIfOnDashboard);

    context.registerDisposer?.(() => {
      unmount();
    });
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    destroyCharts();
    pendingSpecs = [];

    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch {
        /* Ignore disposer errors. */
      }
    }

    context.services?.pages?.unregisterLayout?.(DASHBOARD_LAYOUT_ID);

    if (context.services?.drives) {
      delete context.services.drives;
    }
  }

  const feature = Object.freeze({
    id: "dashboard",
    type: "feature",
    order: 9,
    mount,
    unmount,
    isMounted() {
      return mounted;
    },
  });

  if (context.services) {
    context.services.dashboardFeature = feature;
  }

  return feature;
}

export function mountDashboardFeature(context) {
  const feature = createDashboardFeature(context);

  void feature.mount();

  return feature;
}

export default createDashboardFeature; 
