import {
  APP_EVENTS,
  COMPONENT_IDS,
  FEATURE_KEYS,
  KEYBOARD_KEYS,
  PANEL_TYPES,
} from "../core/constants.js";

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

function createSvgIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("nav-icon");

  if (name === "search") {
    svg.innerHTML = `
      <circle cx="11" cy="11" r="7"></circle>
      <path d="m20 20-3.5-3.5"></path>
    `;
  }

  if (name === "avatar") {
    svg.innerHTML = `
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
    `;
  }

  if (name === "caret") {
    svg.innerHTML = `
      <path d="m6 9 6 6 6-6"></path>
    `;
  }

  return svg;
}

function createMenuButton(context, onPress) {
  const label = context.i18n?.menuOpen ?? "Mở menu";

  const icon = el("span", {
    className: "nav-toggle-icon",
    attrs: {
      "aria-hidden": "true",
    },
  });

  icon.append(
    document.createElement("span"),
    document.createElement("span"),
    document.createElement("span"),
  );

  const button = el(
    "button",
    {
      id: COMPONENT_IDS.MENU_BUTTON,
      className: "nav-control nav-control--icon nav-control--menu",
      attrs: {
        type: "button",
        "aria-label": label,
        "aria-controls": "menu-panel",
        "aria-expanded": "false",
      },
    },
    [icon],
  );

  button.addEventListener("click", onPress);

  return button;
}

function createLogo(context) {
  const logoConfig = context.config?.brand?.logo ?? {};
  const label = context.i18n?.logoHome ?? "Về trang chủ HoyoAO";
  const defaultPageId = context.data.pages?.defaultPageId ?? "home";
  const targetPageId = logoConfig.action?.pageId ?? defaultPageId;

  const button = el("button", {
    id: COMPONENT_IDS.LOGO,
    className: "nav-logo",
    attrs: {
      type: "button",
      "aria-label": label,
    },
  });

  if (logoConfig.src) {
    const image = document.createElement("img");
    image.src = logoConfig.src;
    image.alt = logoConfig.alt ?? label;
    button.append(image);
  } else {
    const fallback = el("span", {
      text: logoConfig.initials ?? "AO",
    });

    button.append(fallback);
  }

  button.addEventListener("click", () => {
    context.router?.navigate?.(targetPageId);
  });

  return button;
}

function createPageSwitcher(context) {
  const pagesData = context.data.pages ?? {};
  const switcherConfig = pagesData.switcher ?? {};
  const brandLabel = switcherConfig.brandLabel ?? context.config?.name ?? "HoyoAO";
  const separator = switcherConfig.separator ?? "/";
  const showBrand = switcherConfig.showBrand !== false;
  const dropdownId = COMPONENT_IDS.PAGE_SWITCHER;
  const menuId = "page-switcher-menu";

  const itemRefs = new Map();
  let outsideListenersActive = false;

  const dropdown = el("div", {
    id: dropdownId,
    className: "nav-dropdown",
  });

  const button = el(
    "button",
    {
      className: "nav-control nav-control--text nav-control--page",
      attrs: {
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": "false",
        "aria-controls": menuId,
      },
    },
  );

  const text = el("span", {
    className: "nav-text nav-text--truncate",
  });

  const brand = el("span", {
    className: "nav-brand-text",
    text: brandLabel,
  });

  const separatorElement = el("span", {
    className: "nav-brand-separator",
    text: separator,
  });

  const currentPage = el("span", {
    className: "nav-page-current",
  });

  if (showBrand) {
    text.append(brand, separatorElement, currentPage);
  } else {
    text.append(currentPage);
  }

  const caret = el(
    "span",
    {
      className: "nav-caret",
      attrs: {
        "aria-hidden": "true",
      },
    },
    [createSvgIcon("caret")],
  );

  button.append(text, caret);

  const menu = el("div", {
    id: menuId,
    className: "nav-dropdown-menu",
    attrs: {
      role: "menu",
      hidden: true,
    },
  });

  dropdown.append(button, menu);

  function emitEvent(event, payload) {
    try {
      context.eventBus?.emit?.(event, payload);
    } catch (error) {
      console.error("[HoyoAO] Header dropdown event emission failed.", error);
    }
  }

  function setOpen(open) {
    context.store?.setState?.({
      ui: {
        activeDropdown: open ? dropdownId : null,
      },
    });

    emitEvent(open ? APP_EVENTS.DROPDOWN_OPEN : APP_EVENTS.DROPDOWN_CLOSE, {
      dropdown: dropdownId,
      open,
    });
  }

  function onPointerDown(event) {
    if (!dropdown.contains(event.target)) {
      setOpen(false);
    }
  }

  function onKeyDown(event) {
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      setOpen(false);
      button.focus();
    }
  }

  function enableOutsideClose() {
    if (outsideListenersActive) {
      return;
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    outsideListenersActive = true;
  }

  function disableOutsideClose() {
    if (!outsideListenersActive) {
      return;
    }

    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
    outsideListenersActive = false;
  }

  function updateOpenState(activeDropdown) {
    const isOpen = activeDropdown === dropdownId;

    dropdown.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    menu.hidden = !isOpen;

    if (isOpen) {
      enableOutsideClose();
    } else {
      disableOutsideClose();
    }
  }

  function getCurrentPageId() {
    const routeState = context.store?.getState?.().route ?? {};

    return routeState.pageId ?? pagesData.defaultPageId ?? null;
  }

  function updateCurrentPageLabel() {
    const pageId = getCurrentPageId();
    const page = pageId ? context.router?.getPageById?.(pageId) : null;

    currentPage.textContent = page?.label ?? "";
  }

  function updateActiveItems() {
    const pageId = getCurrentPageId();

    for (const [itemId, item] of itemRefs.entries()) {
      const isActive = itemId === pageId;

      item.classList.toggle("is-active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    }
  }

  function renderItems() {
    menu.replaceChildren();
    itemRefs.clear();

    const pages = context.router?.getSwitcherPages?.() ?? [];

    for (const page of pages) {
      const item = el(
        "button",
        {
          className: "nav-dropdown-item",
          attrs: {
            type: "button",
            role: "menuitem",
            title: page.description ?? page.label,
          },
          dataset: {
            pageId: page.id,
          },
        },
        [
          el("span", {
            className: "nav-item-label",
            text: page.label,
          }),
        ],
      );

      item.addEventListener("click", async () => {
        setOpen(false);
        await context.router?.navigate?.(page.id);
      });

      menu.append(item);
      itemRefs.set(page.id, item);
    }

    updateActiveItems();
  }

  button.addEventListener("click", () => {
    const activeDropdown = context.store?.getState?.().ui?.activeDropdown;

    setOpen(activeDropdown !== dropdownId);
  });

  const disposeDropdownState = context.store.subscribeSelector(
    (state) => state.ui.activeDropdown,
    updateOpenState,
  );

  const disposeRouteState = context.store.subscribeSelector(
    (state) => state.route.pageId,
    () => {
      updateCurrentPageLabel();
      updateActiveItems();

      if (context.store.getState().ui.activeDropdown === dropdownId) {
        setOpen(false);
      }
    },
  );

  renderItems();
  updateCurrentPageLabel();
  updateOpenState(context.store?.getState?.().ui?.activeDropdown);

  return {
    element: dropdown,
    dispose() {
      disableOutsideClose();
      disposeDropdownState();
      disposeRouteState();
    },
  };
}

function createSearchButton(context, onPress) {
  const label = context.i18n?.searchOpen ?? "Mở tìm kiếm";

  const button = el(
    "button",
    {
      id: COMPONENT_IDS.SEARCH_BUTTON,
      className: "nav-control nav-control--icon nav-control--search",
      attrs: {
        type: "button",
        "aria-label": label,
        "aria-controls": "search-panel",
        "aria-expanded": "false",
      },
    },
    [createSvgIcon("search")],
  );

  button.addEventListener("click", onPress);

  return button;
}

function createAvatarButton(context, onPress) {
  const label = context.i18n?.accountOpen ?? "Mở bảng tài khoản";

  const button = el(
    "button",
    {
      id: COMPONENT_IDS.AVATAR_BUTTON,
      className: "nav-control nav-avatar",
      attrs: {
        type: "button",
        "aria-label": label,
        "aria-controls": "account-panel",
        "aria-expanded": "false",
      },
    },
    [createSvgIcon("avatar")],
  );

  button.addEventListener("click", onPress);

  return button;
}

export function mountHeader(context) {
  const headerLeft = context.shell?.headerLeft;
  const headerRight = context.shell?.headerRight;

  if (!headerLeft || !headerRight) {
    throw new Error("[HoyoAO] Header requires headerLeft and headerRight shell regions.");
  }

  headerLeft.replaceChildren();
  headerRight.replaceChildren();

  const disposers = [];
  const features = context.features ?? {};

  const isFeatureEnabled = (key) => features[key] !== false;

  function togglePanel(panel) {
    const currentPanel = context.store?.getState?.().ui?.activePanel ?? null;
    const nextPanel = currentPanel === panel ? null : panel;

    context.store?.setState?.({
      ui: {
        activePanel: nextPanel,
      },
    });

    const event =
      panel === PANEL_TYPES.MENU
        ? APP_EVENTS.MENU_TOGGLE
        : panel === PANEL_TYPES.SEARCH
          ? APP_EVENTS.SEARCH_TOGGLE
          : APP_EVENTS.ACCOUNT_TOGGLE;

    context.eventBus?.emit?.(event, {
      panel,
      open: nextPanel === panel,
      activePanel: nextPanel,
    });
  }

  let menuButton = null;
  let logo = null;
  let pageSwitcher = null;
  let searchButton = null;
  let avatarButton = null;

  if (isFeatureEnabled(FEATURE_KEYS.MENU)) {
    menuButton = createMenuButton(context, () => {
      togglePanel(PANEL_TYPES.MENU);
    });
  }

  logo = createLogo(context);

  if (isFeatureEnabled(FEATURE_KEYS.PAGE_SWITCHER)) {
    pageSwitcher = createPageSwitcher(context);
    disposers.push(pageSwitcher.dispose);
  }

  if (menuButton) {
    headerLeft.append(menuButton);
  }

  headerLeft.append(logo);

  if (pageSwitcher) {
    headerLeft.append(pageSwitcher.element);
  }

  if (isFeatureEnabled(FEATURE_KEYS.SEARCH)) {
    searchButton = createSearchButton(context, () => {
      togglePanel(PANEL_TYPES.SEARCH);
    });

    headerRight.append(searchButton);
  }

  if (isFeatureEnabled(FEATURE_KEYS.ACCOUNT_PANEL)) {
    avatarButton = createAvatarButton(context, () => {
      togglePanel(PANEL_TYPES.ACCOUNT);
    });

    headerRight.append(avatarButton);
  }

  function updatePanelControls(activePanel) {
    if (menuButton) {
      menuButton.setAttribute(
        "aria-expanded",
        String(activePanel === PANEL_TYPES.MENU),
      );
    }

    if (searchButton) {
      searchButton.setAttribute(
        "aria-expanded",
        String(activePanel === PANEL_TYPES.SEARCH),
      );
    }

    if (avatarButton) {
      avatarButton.setAttribute(
        "aria-expanded",
        String(activePanel === PANEL_TYPES.ACCOUNT),
      );
    }
  }

  const disposePanelState = context.store.subscribeSelector(
    (state) => state.ui.activePanel,
    updatePanelControls,
  );

  disposers.push(disposePanelState);

  updatePanelControls(context.store?.getState?.().ui?.activePanel ?? null);

  context.registerDisposer?.(() => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error("[HoyoAO] Header disposer failed.", error);
      }
    }

    headerLeft.replaceChildren();
    headerRight.replaceChildren();
  });

  return Object.freeze({
    menuButton,
    logo,
    pageSwitcher: pageSwitcher?.element ?? null,
    searchButton,
    avatarButton,
  });
} 
