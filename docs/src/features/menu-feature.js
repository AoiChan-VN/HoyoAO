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
  NAVIGATION_EVENTS,
} from "../../services/navigation/navigation-service.js";

const CLOSE_ICON_PATH = `<path d="M18 6 6 18M6 6l12 12"></path>`;

function normalizeRoute(value) {
  let raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  if (raw.startsWith("#")) {
    raw = raw.slice(1);
  }

  raw = raw.split("?")[0];

  if (!raw.startsWith("/")) {
    raw = `/${raw}`;
  }

  if (raw.length > 1 && raw.endsWith("/")) {
    raw = raw.slice(0, -1);
  }

  return raw;
}

function createCloseIcon() {
  return createSvg(CLOSE_ICON_PATH);
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
  let createdNavigationService = false;

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
    createdNavigationService = true;

    if (context.services) {
      context.services.navigation = navigationService;
    }

    return navigationService;
  }

  function open() {
    context.store?.setState?.({
      ui: {
        activePanel: PANEL_TYPES.MENU,
      },
    });
  }

  function close() {
    context.store?.setState?.({
      ui: {
        activePanel: null,
      },
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

  function createLogoButton() {
    const logoConfig = context.config?.brand?.logo ?? {};
    const label = context.i18n?.logoHome ?? "Về trang chủ HoyoAO";
    const defaultPageId = context.data?.pages?.defaultPageId ?? "home";
    const targetPageId = logoConfig.action?.pageId ?? defaultPageId;

    const logoButton = el(
      "button",
      {
        className: "nav-logo app-panel-logo",
        attrs: {
          type: "button",
          "aria-label": label,
        },
      },
    );

    if (logoConfig.src) {
      const image = document.createElement("img");

      image.src = logoConfig.src;
      image.alt = logoConfig.alt ?? label;

      logoButton.append(image);
    } else {
      logoButton.append(document.createTextNode(logoConfig.initials ?? "AO"));
    }

    logoButton.addEventListener("click", () => {
      context.router?.navigate?.(targetPageId);
      close();
    });

    return logoButton;
  }

  function createPanelDom() {
    backdrop = el("div", {
      className: "app-panel-backdrop",
      attrs: {
        "aria-hidden": "true",
      },
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
      className: "app-panel-header",
    });

    const logoButton = createLogoButton();

    const title = el("h2", {
      className: "app-panel-title",
      text: context.config?.name ?? "HoyoAO",
    });

    const closeButton = el(
      "button",
      {
        className: "nav-control nav-control--sm nav-control--quiet",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.menuClose ?? "Đóng menu",
        },
      },
      [createCloseIcon()],
    );

    closeButton.addEventListener("click", () => {
      close();
    });

    header.append(logoButton, title, closeButton);

    body = el("div", {
      className: "app-panel-body",
    });

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

  function handleItemClick(item) {
    if (!item) {
      return;
    }

    if (item.type === "external" && item.href) {
      window.open(item.href, item.target ?? "_blank", "noopener");
      close();

      return;
    }

    if (item.pageId || item.route) {
      context.router?.navigate?.(item.pageId ?? item.route);
      close();

      return;
    }

    context.eventBus?.emit?.("hoyoao:menu:item-action", {
      item,
    });

    close();
  }

  function createNavItem(item, depth = 0) {
    const children = [
      el("span", {
        className: "app-panel-item-label",
        text: item.label,
      }),
    ];

    if (item.badge !== undefined && item.badge !== null) {
      children.push(
        el("span", {
          className: "app-panel-item-meta",
          text: String(item.badge),
        }),
      );
    }

    const button = el(
      "button",
      {
        className: "app-panel-item app-panel-item--action",
        attrs: {
          type: "button",
          title: item.description || undefined,
        },
        dataset: {
          itemId: item.id,
          pageId: item.pageId ?? "",
          route: item.route ?? "",
        },
        styles:
          depth > 0
            ? {
                paddingInlineStart: `calc(var(--app-space-md) + ${depth} * var(--app-space-sm))`,
              }
            : undefined,
      },
      children,
    );

    button.addEventListener("click", () => {
      handleItemClick(item);
    });

    return button;
  }

  function renderItems(container, items, depth = 0) {
    for (const item of items) {
      if (!item) {
        continue;
      }

      if (item.type === "divider") {
        container.append(
          el("hr", {
            className: "app-panel-separator",
          }),
        );

        continue;
      }

      container.append(createNavItem(item, depth));

      if (item.children && item.children.length > 0) {
        renderItems(container, item.children, depth + 1);
      }
    }
  }

  function renderNav() {
    if (!body) {
      return;
    }

    body.replaceChildren();

    let groups = [];

    try {
      const service = ensureNavigationService();

      if (typeof service?.getGroups === "function") {
        groups = service.getGroups(NAVIGATION_LOCATIONS.MENU, {
          includeHidden: false,
          includeDisabled: false,
        });
      }
    } catch (error) {
      console.error("[HoyoAO Menu] Failed to read navigation data.", error);
    }

    if (!groups || groups.length === 0) {
      body.append(
        el("div", {
          className: "app-panel-empty",
          text: context.i18n?.menuEmpty ?? "Chưa có mục menu.",
        }),
      );

      return;
    }

    for (const group of groups) {
      if (group.label && group.hiddenLabel !== true) {
        body.append(
          el("div", {
            className: "app-panel-heading",
            text: group.label,
          }),
        );
      }

      renderItems(body, group.items ?? []);
    }

    updateActive();
  }

  function updateActive() {
    if (!body) {
      return;
    }

    const routeState = context.store?.getState?.().route ?? {};
    const currentPageId = routeState.pageId ?? null;
    const currentRoute = normalizeRoute(routeState.route ?? "");

    const itemButtons = body.querySelectorAll("[data-item-id]");

    for (const button of itemButtons) {
      const itemPageId = button.dataset.pageId || null;
      const itemRoute = normalizeRoute(button.dataset.route ?? "");

      const isActive =
        (currentPageId && itemPageId && itemPageId === currentPageId) ||
        (currentRoute && itemRoute && itemRoute === currentRoute);

      button.classList.toggle("is-active", isActive);

      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  }

  function onKeyDown(event) {
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

      requestAnimationFrame(() => {
        focusFirstFocusable(panel, panel);

        const activeItem = panel.querySelector(".is-active");

        activeItem?.scrollIntoView({
          block: "nearest",
        });
      });

      document.addEventListener("keydown", onKeyDown, true);

      context.eventBus?.emit?.(APP_EVENTS.MENU_OPEN, {
        panel: PANEL_TYPES.MENU,
      });

      return;
    }

    document.removeEventListener("keydown", onKeyDown, true);

    const restoreTarget =
      lastFocusedElement && document.contains(lastFocusedElement)
        ? lastFocusedElement
        : document.getElementById(COMPONENT_IDS.MENU_BUTTON);

    restoreTarget?.focus?.({
      preventScroll: true,
    });

    context.eventBus?.emit?.(APP_EVENTS.MENU_CLOSE, {
      panel: PANEL_TYPES.MENU,
    });
  }

  function handleRouteChanged() {
    if (isOpen) {
      close();
    }

    updateActive();
  }

  function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    ensureNavigationService();
    createPanelDom();
    renderNav();

    if (context.store?.subscribeSelector) {
      addDisposer(
        context.store.subscribeSelector(
          (state) => state.ui.activePanel,
          syncOpenState,
        ),
      );

      addDisposer(
        context.store.subscribeSelector(
          (state) => state.route,
          updateActive,
        ),
      );

      syncOpenState(context.store.getState()?.ui?.activePanel ?? null);
      updateActive();
    }

    if (context.eventBus?.on) {
      addDisposer(
        context.eventBus.on(NAVIGATION_EVENTS.DATA_CHANGED, renderNav),
      );

      addDisposer(
        context.eventBus.on(NAVIGATION_EVENTS.ACTIVE_CHANGED, updateActive),
      );

      addDisposer(
        context.eventBus.on(APP_EVENTS.ROUTE_CHANGED, handleRouteChanged),
      );
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

    if (context.store?.getState?.().ui?.activePanel === PANEL_TYPES.MENU) {
      context.store.setState({
        ui: {
          activePanel: null,
        },
      });
    }

    if (isOpen) {
      isOpen = false;

      document.removeEventListener("keydown", onKeyDown, true);
    }

    for (const disposer of disposers.splice(0)) {
      try {
        disposer();
      } catch (error) {
        console.error("[HoyoAO Menu] Disposer failed.", error);
      }
    }

    if (createdNavigationService) {
      navigationService?.destroy?.();
      navigationService = null;
      createdNavigationService = false;
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
    context.services.menu = feature;
  }

  return feature;
}

export function mountMenuFeature(context) {
  const feature = createMenuFeature(context);

  feature.mount();

  return feature;
}

export default createMenuFeature; 
