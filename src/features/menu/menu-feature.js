import {
  APP_EVENTS,
  COMPONENT_IDS,
  KEYBOARD_KEYS,
  PANEL_TYPES,
} from "../../core/constants.js";

import {
  el,
  createSvg,
  focusFirstFocusable,
} from "../../utils/dom.js";

import {
  createNavigationServiceFromContext,
  NAVIGATION_LOCATIONS,
} from "../../services/navigation/navigation-service.js";

const BACK_ICON_PATH = `
  <path d="M19 12H5"></path>
  <path d="m12 19-7-7 7-7"></path>
`;

function resolveLogoUrl() {
  try {
    return new URL("../../../assets/logos/logo.png", import.meta.url).href;
  } catch {
    return "./assets/logos/logo.png";
  }
}

function createBackIcon() {
  return createSvg(BACK_ICON_PATH);
}

function createPanelLogo(context, onLogoClick) {
  const site = context.config ?? {};
  const logoConfig = site.brand?.logo ?? {};

  const button = el("button", {
    className: "nav-logo app-panel-logo",
    attrs: {
      type: "button",
      "aria-label": logoConfig.alt ?? site.name ?? "HoyoAO",
    },
  });

  const img = document.createElement("img");

  img.alt = logoConfig.alt ?? site.name ?? "HoyoAO";
  img.src = logoConfig.src ?? resolveLogoUrl();

  img.addEventListener(
    "error",
    () => {
      const fallback = el("span", {
        text: logoConfig.initials ?? "AO",
      });

      img.replaceWith(fallback);
    },
    { once: true },
  );

  button.append(img);

  button.addEventListener("click", onLogoClick);

  return button;
}

export function createMenuFeature(context) {
  let mounted = false;
  let isOpen = false;

  let panel = null;
  let backdrop = null;
  let body = null;
  let lastFocusedElement = null;

  const disposers = [];

  let navigationService = context.services?.navigation ?? null;

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function ensureNavigationService() {
    if (navigationService) {
      return navigationService;
    }

    navigationService = createNavigationServiceFromContext(context);

    if (context.services) {
      context.services.navigation = navigationService;
    }

    return navigationService;
  }

  function open() {
    context.store?.setState?.({
      ui: { activePanel: PANEL_TYPES.MENU },
    });
  }

  function close() {
    context.store?.setState?.({
      ui: { activePanel: null },
    });
  }

  function toggle() {
    const activePanel = context.store?.getState?.().ui?.activePanel;

    if (activePanel === PANEL_TYPES.MENU) {
      close();
    } else {
      open();
    }
  }

  function currentIsDashboard() {
    const route = context.router?.getCurrentRoute?.();

    return (
      route?.layout === "dashboard" || route?.pageId === "dashboard"
    );
  }

  function createHeading(text) {
    return el("div", {
      className: "app-panel-heading",
      text,
    });
  }

  function createDriveItems() {
    const drivesService = context.services?.drives;

    if (!drivesService || !currentIsDashboard()) {
      return null;
    }

    const drives = drivesService.getDrives?.() ?? [];

    if (drives.length === 0) {
      return null;
    }

    const activeDrive = drivesService.getActiveDrive?.();

    const container = el("div", { className: "app-panel-section" });

    container.append(createHeading("Ổ đĩa dữ liệu"));

    for (const drive of drives) {
      const isActive = drive.id === activeDrive?.id;

      const item = el(
        "button",
        {
          className: "app-panel-item app-panel-item--action",
          attrs: {
            type: "button",
            "aria-pressed": String(isActive),
            title: drive.description || undefined,
          },
        },
        [
          el("span", { className: "app-panel-item-label", text: drive.label }),
          el("span", {
            className: "app-panel-item-meta",
            text: isActive ? "đang chọn" : "",
          }),
        ],
      );

      if (isActive) {
        item.classList.add("is-active");
      }

      item.addEventListener("click", () => {
        drivesService.setActiveDrive?.(drive.id);
        close();
      });

      container.append(item);
    }

    return container;
  }

  function createNavigationItems() {
    const service = ensureNavigationService();

    const container = el("div", { className: "app-panel-section" });

    let groups = [];

    try {
      groups =
        service.getGroups?.(NAVIGATION_LOCATIONS.MENU, {
          includeHidden: false,
          includeDisabled: false,
        }) ?? [];
    } catch (error) {
      console.error("[HoyoAO Menu] Failed to read navigation.", error);
    }

    if (groups.length === 0) {
      container.append(
        el("div", {
          className: "app-panel-empty",
          text: context.i18n?.menuEmpty ?? "Chưa có mục menu.",
        }),
      );

      return container;
    }

    const currentPageId =
      context.router?.getCurrentRoute?.()?.pageId ?? null;

    for (const group of groups) {
      if (group.label && group.hiddenLabel !== true) {
        container.append(createHeading(group.label));
      }

      for (const item of group.items ?? []) {
        if (!item || item.type === "divider") {
          if (item?.type === "divider") {
            container.append(
              el("hr", { className: "app-panel-separator" }),
            );
          }

          continue;
        }

        const isActive =
          (item.pageId && item.pageId === currentPageId) ||
          (item.route &&
            context.router?.getCurrentRoute?.()?.route === item.route);

        const button = el(
          "button",
          {
            className: "app-panel-item app-panel-item--action",
            attrs: {
              type: "button",
              title: item.description || undefined,
            },
          },
          [
            el("span", {
              className: "app-panel-item-label",
              text: item.label,
            }),
          ],
        );

        if (isActive) {
          button.classList.add("is-active");
          button.setAttribute("aria-current", "page");
        }

        button.addEventListener("click", () => {
          if (item.pageId || item.route) {
            context.router?.navigate?.(item.pageId ?? item.route);
          }

          close();
        });

        container.append(button);
      }
    }

    return container;
  }

  function renderBody() {
    if (!body) {
      return;
    }

    body.replaceChildren();

    const drivesSection = createDriveItems();

    if (drivesSection) {
      body.append(drivesSection);
      body.append(el("hr", { className: "app-panel-separator" }));
    }

    body.append(createNavigationItems());
  }

  function createPanelDom() {
    backdrop = el("div", {
      className: "app-panel-backdrop",
      attrs: { "aria-hidden": "true" },
    });

    panel = el("aside", {
      id: COMPONENT_IDS.MENU_PANEL,
      className: "app-panel app-panel--menu",
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-label": context.i18n?.menu ?? "Menu",
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", {
      className: "app-panel-header app-panel-header--brand",
    });

    const logoButton = createPanelLogo(context, () => {
      context.router?.navigate?.(
        context.data?.pages?.defaultPageId ?? "home",
      );

      close();
    });

    const backButton = el(
      "button",
      {
        className: "nav-control nav-control--sm nav-control--quiet app-panel-close",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.menuClose ?? "Đóng menu",
        },
      },
      [createBackIcon()],
    );

    backButton.addEventListener("click", () => {
      close();
    });

    header.append(logoButton, backButton);

    body = el("div", { className: "app-panel-body" });

    panel.append(header, body);

    const target = context.shell?.panelLayer ?? document.body;

    target.append(backdrop, panel);

    backdrop.addEventListener("pointerdown", () => {
      close();
    });

    addDisposer(() => {
      backdrop.remove();
      panel.remove();
    });
  }

  function onDocumentKeydown(event) {
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      event.preventDefault();
      close();
    }
  }

  function syncOpenState(activePanel) {
    const nextOpen = activePanel === PANEL_TYPES.MENU;

    if (nextOpen === isOpen || !panel || !backdrop) {
      return;
    }

    isOpen = nextOpen;

    panel.classList.toggle("is-open", isOpen);
    backdrop.classList.toggle("is-visible", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      lastFocusedElement = document.activeElement;

      renderBody();

      requestAnimationFrame(() => {
        focusFirstFocusable(panel, panel);
      });

      document.addEventListener("keydown", onDocumentKeydown, true);

      context.eventBus?.emit?.(APP_EVENTS.MENU_OPEN, {
        panel: PANEL_TYPES.MENU,
      });

      return;
    }

    document.removeEventListener("keydown", onDocumentKeydown, true);

    const restoreTarget =
      lastFocusedElement && document.contains(lastFocusedElement)
        ? lastFocusedElement
        : document.getElementById(COMPONENT_IDS.MENU_BUTTON);

    restoreTarget?.focus?.({ preventScroll: true });

    context.eventBus?.emit?.(APP_EVENTS.MENU_CLOSE, {
      panel: PANEL_TYPES.MENU,
    });
  }

  function handleRouteChanged() {
    if (isOpen) {
      renderBody();
    }
  }

  function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    createPanelDom();

    addDisposer(
      context.store?.subscribeSelector?.(
        (state) => state.ui.activePanel,
        syncOpenState,
      ),
    );

    addDisposer(
      context.store?.subscribeSelector?.(
        (state) => state.dashboard?.activeDriveId,
        () => {
          if (isOpen) {
            renderBody();
          }
        },
      ),
    );

    if (context.eventBus?.on) {
      addDisposer(
        context.eventBus.on(APP_EVENTS.ROUTE_CHANGED, handleRouteChanged),
      );
    }

    syncOpenState(context.store?.getState?.().ui?.activePanel ?? null);

    context.registerDisposer?.(() => {
      unmount();
    });
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    if (
      context.store?.getState?.().ui?.activePanel === PANEL_TYPES.MENU
    ) {
      context.store.setState({ ui: { activePanel: null } });
    }

    if (isOpen) {
      isOpen = false;
      document.removeEventListener("keydown", onDocumentKeydown, true);
    }

    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch {
        /* Ignore disposer errors. */
      }
    }

    panel = null;
    backdrop = null;
    body = null;
    lastFocusedElement = null;
  }

  const feature = Object.freeze({
    id: "menu",
    type: "feature",
    order: 10,
    mount,
    unmount,
    open,
    close,
    toggle,
    isOpen() {
      return isOpen;
    },
  });

  if (context.services) {
    context.services.menuFeature = feature;
  }

  return feature;
}

export function mountMenuFeature(context) {
  const feature = createMenuFeature(context);

  feature.mount();

  return feature;
}

export default createMenuFeature;
