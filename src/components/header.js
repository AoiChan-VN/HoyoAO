import {
  APP_EVENTS,
  COMPONENT_IDS,
  FEATURE_KEYS,
  KEYBOARD_KEYS,
  PANEL_TYPES,
} from "../core/constants.js";

import { el, createSvg } from "../utils/dom.js";

import { createMediaServiceFromContext } from "../services/media/media-service.js";

const SEARCH_ICON_PATH = `
  <circle cx="11" cy="11" r="7"></circle>
  <path d="m20 20-3.5-3.5"></path>
`;

const AVATAR_ICON_PATH = `
  <circle cx="12" cy="8" r="4"></circle>
  <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
`;

const CARET_ICON_PATH = `<path d="m6 9 6 6 6-6"></path>`;

const PAGE_SWITCHER_ID = COMPONENT_IDS.PAGE_SWITCHER;
const SWITCHER_MENU_ID = "page-switcher-menu";

function createSearchIcon() {
  return createSvg(SEARCH_ICON_PATH);
}

function createAvatarIcon() {
  return createSvg(AVATAR_ICON_PATH);
}

function createCaretIcon() {
  return createSvg(CARET_ICON_PATH);
}

function getSwitcherPages(context) {
  const pages = context.data?.pages?.pages ?? [];

  return pages
    .filter((page) => page && page.enabled !== false && page.hidden !== true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function mountHeader(context) {
  const headerLeft = context.shell?.headerLeft;
  const headerRight = context.shell?.headerRight;

  if (!headerLeft || !headerRight) {
    throw new Error(
      "[HoyoAO] Header requires headerLeft and headerRight shell regions.",
    );
  }

  headerLeft.replaceChildren();
  headerRight.replaceChildren();

  const media = createMediaServiceFromContext(context);
  const disposers = [];
  const features = context.features ?? {};

  const isFeatureEnabled = (key) => features[key] !== false;

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function togglePanel(panel) {
    const currentPanel = context.store?.getState?.().ui?.activePanel;
    const nextPanel = currentPanel === panel ? null : panel;

    context.store?.setState?.({
      ui: { activePanel: nextPanel },
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

  if (isFeatureEnabled(FEATURE_KEYS.MENU)) {
    const icon = el(
      "span",
      {
        className: "nav-toggle-icon",
        attrs: { "aria-hidden": "true" },
      },
      [el("span"), el("span"), el("span")],
    );

    menuButton = el(
      "button",
      {
        id: COMPONENT_IDS.MENU_BUTTON,
        className: "nav-control nav-control--icon nav-control--menu",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.menuOpen ?? "Mở menu",
          "aria-controls": "menu-panel",
          "aria-expanded": "false",
        },
      },
      [icon],
    );

    menuButton.addEventListener("click", () => {
      togglePanel(PANEL_TYPES.MENU);
    });
  }

  const logoButton = el("button", {
    id: COMPONENT_IDS.LOGO,
    className: "nav-logo",
    attrs: {
      type: "button",
      "aria-label": media.getLogoAlt(),
    },
  });

  const logoImg = document.createElement("img");

  logoImg.src = media.getLogoUrl();
  logoImg.alt = media.getLogoAlt();

  logoImg.addEventListener(
    "error",
    () => {
      logoImg.replaceWith(
        el("span", { text: media.getLogoInitials() }),
      );
    },
    { once: true },
  );

  logoButton.append(logoImg);

  logoButton.addEventListener("click", () => {
    context.router?.navigate?.(
      context.config?.brand?.logo?.action?.pageId ??
        context.data?.pages?.defaultPageId ??
        "home",
    );
  });

  let pageSwitcher = null;

  if (isFeatureEnabled(FEATURE_KEYS.PAGE_SWITCHER)) {
    pageSwitcher = createPageSwitcher();
  }

  function createPageSwitcher() {
    const switcherConfig = context.data?.pages?.switcher ?? {};

    const dropdown = el("div", {
      id: PAGE_SWITCHER_ID,
      className: "nav-dropdown",
    });

    const button = el("button", {
      className: "nav-control nav-control--text nav-control--page",
      attrs: {
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": "false",
        "aria-controls": SWITCHER_MENU_ID,
      },
    });

    const text = el("span", {
      className: "nav-text nav-text--truncate",
    });

    const brand = el("span", {
      className: "nav-brand-text",
      text: switcherConfig.brandLabel ?? context.config?.name ?? "HoyoAO",
    });

    const separator = el("span", {
      className: "nav-brand-separator",
      text: switcherConfig.separator ?? "/",
    });

    const currentPage = el("span", {
      className: "nav-page-current",
      text: "",
    });

    if (switcherConfig.showBrand !== false) {
      text.append(brand, separator, currentPage);
    } else {
      text.append(currentPage);
    }

    const caret = el(
      "span",
      {
        className: "nav-caret",
        attrs: { "aria-hidden": "true" },
      },
      [createCaretIcon()],
    );

    button.append(text, caret);

    const menu = el("div", {
      id: SWITCHER_MENU_ID,
      className: "nav-dropdown-menu",
      attrs: {
        role: "menu",
        hidden: true,
      },
    });

    dropdown.append(button, menu);

    const itemRefs = new Map();
    let outsideActive = false;

    function setOpen(open) {
      context.store?.setState?.({
        ui: { activeDropdown: open ? PAGE_SWITCHER_ID : null },
      });

      context.eventBus?.emit?.(
        open ? APP_EVENTS.DROPDOWN_OPEN : APP_EVENTS.DROPDOWN_CLOSE,
        {
          dropdown: PAGE_SWITCHER_ID,
          open,
        },
      );
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

    function enableOutside() {
      if (outsideActive) {
        return;
      }

      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      outsideActive = true;
    }

    function disableOutside() {
      if (!outsideActive) {
        return;
      }

      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      outsideActive = false;
    }

    function getCurrentPageId() {
      return (
        context.store?.getState?.().route?.pageId ??
        context.data?.pages?.defaultPageId ??
        null
      );
    }

    function renderItems() {
      menu.replaceChildren();
      itemRefs.clear();

      for (const page of getSwitcherPages(context)) {
        const item = el(
          "button",
          {
            className: "nav-dropdown-item",
            attrs: {
              type: "button",
              role: "menuitem",
              title: page.description ?? undefined,
            },
            dataset: { pageId: page.id },
          },
          [
            el("span", {
              className: "nav-item-label",
              text: page.label ?? page.id,
            }),
          ],
        );

        item.addEventListener("click", () => {
          setOpen(false);
          context.router?.navigate?.(page.id);
        });

        menu.append(item);
        itemRefs.set(page.id, item);
      }

      updateActiveItems();
    }

    function updateCurrentPageLabel() {
      const pageId = getCurrentPageId();
      const page = (context.data?.pages?.pages ?? []).find(
        (candidate) => candidate.id === pageId,
      );

      currentPage.textContent = page?.label ?? "";
    }

    function updateActiveItems() {
      const pageId = getCurrentPageId();

      for (const [id, item] of itemRefs.entries()) {
        const isActive = id === pageId;

        item.classList.toggle("is-active", isActive);

        if (isActive) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      }
    }

    function updateOpenState(activeDropdown) {
      const isOpen = activeDropdown === PAGE_SWITCHER_ID;

      dropdown.classList.toggle("is-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
      menu.hidden = !isOpen;

      if (isOpen) {
        enableOutside();
      } else {
        disableOutside();
      }
    }

    button.addEventListener("click", () => {
      const activeDropdown =
        context.store?.getState?.().ui?.activeDropdown;

      setOpen(activeDropdown !== PAGE_SWITCHER_ID);
    });

    addDisposer(
      context.store?.subscribeSelector?.(
        (state) => state.ui.activeDropdown,
        updateOpenState,
      ),
    );

    addDisposer(
      context.store?.subscribeSelector?.(
        (state) => state.route?.pageId,
        () => {
          updateCurrentPageLabel();
          updateActiveItems();

          if (
            context.store?.getState?.().ui?.activeDropdown ===
            PAGE_SWITCHER_ID
          ) {
            setOpen(false);
          }
        },
      ),
    );

    renderItems();
    updateCurrentPageLabel();
    updateOpenState(
      context.store?.getState?.().ui?.activeDropdown ?? null,
    );

    return {
      element: dropdown,
      dispose: disableOutside,
    };
  }

  if (menuButton) {
    headerLeft.append(menuButton);
  }

  headerLeft.append(logoButton);

  if (pageSwitcher) {
    headerLeft.append(pageSwitcher.element);
    addDisposer(pageSwitcher.dispose);
  }

  let searchButton = null;

  if (isFeatureEnabled(FEATURE_KEYS.SEARCH)) {
    searchButton = el(
      "button",
      {
        id: COMPONENT_IDS.SEARCH_BUTTON,
        className: "nav-control nav-control--icon nav-control--search",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.searchOpen ?? "Mở tìm kiếm",
          "aria-controls": "search-panel",
          "aria-expanded": "false",
        },
      },
      [createSearchIcon()],
    );

    searchButton.addEventListener("click", () => {
      togglePanel(PANEL_TYPES.SEARCH);
    });

    headerRight.append(searchButton);
  }

  let avatarButton = null;

  if (isFeatureEnabled(FEATURE_KEYS.ACCOUNT_PANEL)) {
    avatarButton = el("button", {
      id: COMPONENT_IDS.AVATAR_BUTTON,
      className: "nav-control nav-avatar",
      attrs: {
        type: "button",
        "aria-label": context.i18n?.accountOpen ?? "Mở bảng tài khoản",
        "aria-controls": "account-panel",
        "aria-expanded": "false",
      },
    });

    const avatarImg = document.createElement("img");

    avatarImg.src = media.getAvatarUrl();
    avatarImg.alt = context.i18n?.account ?? "Tài khoản";

    avatarImg.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    `;

    avatarImg.addEventListener(
      "error",
      () => {
        avatarImg.replaceWith(createAvatarIcon());
      },
      { once: true },
    );

    avatarButton.append(avatarImg);

    avatarButton.addEventListener("click", () => {
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

  addDisposer(
    context.store?.subscribeSelector?.(
      (state) => state.ui.activePanel,
      updatePanelControls,
    ),
  );

  updatePanelControls(
    context.store?.getState?.().ui?.activePanel ?? null,
  );

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
    logo: logoButton,
    pageSwitcher: pageSwitcher?.element ?? null,
    searchButton,
    avatarButton,
  });
} 
