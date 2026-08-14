import {
  APP_EVENTS,
  PANEL_TYPES,
  KEYBOARD_KEYS,
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

function svgIcon(paths, viewBox = "0 0 24 24") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("nav-icon");

  svg.innerHTML = paths;

  return svg;
}

function createCloseIcon() {
  return svgIcon(`<path d="M18 6 6 18M6 6l12 12"></path>`);
}

function createSearchIcon() {
  return svgIcon(`
    <circle cx="11" cy="11" r="7"></circle>
    <path d="m20 20-3.5-3.5"></path>
  `);
}

function createAvatarIcon() {
  return svgIcon(`
    <circle cx="12" cy="8" r="4"></circle>
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
  `);
}

export function mountPanelManager(context) {
  const layer = context.shell?.panelLayer;

  if (!layer) {
    throw new Error("[HoyoAO] Panel manager requires shell.panelLayer.");
  }

  layer.replaceChildren();

  const disposers = [];
  const panels = new Map();

  let activePanel = null;
  let lastFocusedElement = null;

  const backdrop = el("div", {
    className: "app-panel-backdrop",
    attrs: {
      "aria-hidden": "true",
    },
  });

  layer.append(backdrop);

  function setActivePanel(panel) {
    context.store?.setState?.({
      ui: {
        activePanel: panel,
      },
    });
  }

  function closePanel() {
    setActivePanel(null);
  }

  function togglePanel(panel) {
    setActivePanel(activePanel === panel ? null : panel);
  }

  function showPanel(type) {
    const panel = panels.get(type);

    if (!panel) {
      return;
    }

    lastFocusedElement = document.activeElement;

    panel.classList.add("is-open");
    panel.removeAttribute("aria-hidden");

    backdrop.classList.add("is-visible");
    backdrop.removeAttribute("aria-hidden");

    document.body.classList.add("app-modal-open");

    requestAnimationFrame(() => {
      const focusable = panel.querySelector(
        "input, button, select, textarea, [tabindex]:not([tabindex='-1'])",
      );

      const target = focusable ?? panel;

      target.focus({ preventScroll: true });
    });
  }

  function hidePanel(type) {
    const panel = panels.get(type);

    if (!panel) {
      return;
    }

    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");

    backdrop.classList.remove("is-visible");
    backdrop.setAttribute("aria-hidden", "true");

    document.body.classList.remove("app-modal-open");

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  function syncPanelState(panel) {
    if (panel === activePanel) {
      return;
    }

    if (activePanel) {
      hidePanel(activePanel);
    }

    if (panel) {
      showPanel(panel);
    }

    activePanel = panel;
  }

  function createPanelBase(type, title, renderContent) {
    const panel = el("aside", {
      id: `${type}-panel`,
      className: `app-panel app-panel--${type}`,
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-label": title,
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", {
      className: "app-panel-header",
    });

    const titleElement = el("h2", {
      className: "app-panel-title",
      text: title,
    });

    const closeButton = el(
      "button",
      {
        className:
          "nav-control nav-control--sm nav-control--quiet app-panel-close",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.close ?? "Đóng",
        },
      },
      [createCloseIcon()],
    );

    closeButton.addEventListener("click", () => {
      closePanel();
    });

    header.append(titleElement, closeButton);

    const body = el("div", {
      className: "app-panel-body",
    });

    renderContent(body);

    panel.append(header, body);

    return panel;
  }

  function renderMenuContent(body) {
    const navigationData = context.data.navigation ?? {};
    const groups = navigationData.menu?.groups ?? [];

    const nav = el("nav", {
      className: "app-panel-nav",
      attrs: {
        "aria-label": context.i18n?.mainNavigation ?? "Điều hướng chính",
      },
    });

    for (const group of groups) {
      if (group.hidden === true || group.enabled === false) {
        continue;
      }

      if (group.label && group.hiddenLabel !== true) {
        nav.append(
          el("div", {
            className: "app-panel-heading",
            text: group.label,
          }),
        );
      }

      for (const item of group.items ?? []) {
        if (item.hidden === true || item.enabled === false) {
          continue;
        }

        const itemButton = el("button", {
          className: "app-panel-item app-panel-item--action",
          attrs: {
            type: "button",
          },
        });

        itemButton.append(
          el("span", {
            className: "app-panel-item-label",
            text: item.label,
          }),
        );

        itemButton.addEventListener("click", () => {
          context.router?.navigate?.(item.pageId ?? item.route);
          closePanel();
        });

        nav.append(itemButton);
      }
    }

    body.append(nav);
  }

  function renderSearchContent(body) {
    const inputWrapper = el("div", {
      className: "app-panel-input",
    });

    const input = el("input", {
      attrs: {
        type: "search",
        placeholder: context.i18n?.searchPlaceholder ?? "Tìm kiếm...",
        "aria-label": context.i18n?.search ?? "Tìm kiếm",
        autocomplete: "off",
      },
    });

    inputWrapper.append(createSearchIcon(), input);

    const results = el("div", {
      className: "app-panel-results",
      attrs: {
        role: "listbox",
        "aria-label": context.i18n?.searchResults ?? "Kết quả tìm kiếm",
      },
    });

    function renderResults(query) {
      results.replaceChildren();

      const normalizedQuery = String(query ?? "").trim().toLowerCase();

      if (!normalizedQuery) {
        return;
      }

      const pages = context.router?.getAllPages?.() ?? [];

      const matches = pages.filter((page) => {
        if (page.hidden === true || page.enabled === false) {
          return false;
        }

        const label = String(page.label ?? "").toLowerCase();
        const description = String(page.description ?? "").toLowerCase();

        return (
          label.includes(normalizedQuery) ||
          description.includes(normalizedQuery)
        );
      });

      if (matches.length === 0) {
        results.append(
          el("div", {
            className: "app-panel-empty",
            text:
              context.config?.services?.search?.noResultsText ??
              "Không có kết quả phù hợp.",
          }),
        );

        return;
      }

      for (const page of matches) {
        const resultButton = el("button", {
          className: "app-panel-item app-panel-item--action",
          attrs: {
            type: "button",
            role: "option",
          },
        });

        resultButton.append(
          el("span", {
            className: "app-panel-item-label",
            text: page.label,
          }),
        );

        resultButton.addEventListener("click", () => {
          context.router?.navigate?.(page.id);
          closePanel();
        });

        results.append(resultButton);
      }
    }

    input.addEventListener("input", (event) => {
      renderResults(event.target.value);
    });

    body.append(inputWrapper, results);
  }

  function renderAccountContent(body) {
    const profile = el("div", {
      className: "app-panel-profile",
    });

    const avatar = el("div", {
      className: "app-panel-avatar",
    });

    avatar.append(createAvatarIcon());

    const profileText = el("div", {
      className: "app-panel-profile-text",
    });

    profileText.append(
      el("div", {
        className: "app-panel-profile-title",
        text: context.i18n?.guest ?? "Khách",
      }),
      el("div", {
        className: "app-panel-profile-subtitle",
        text: context.i18n?.noAuthentication ?? "Chưa có authentication.",
      }),
    );

    profile.append(avatar, profileText);

    const note = el("div", {
      className: "app-panel-note app-panel-note--info",
      text:
        context.i18n?.noAuthentication ??
        "Hiện tại chưa có hệ thống authentication.",
    });

    body.append(profile, note);
  }

  const menuPanel = createPanelBase(
    PANEL_TYPES.MENU,
    context.i18n?.menu ?? "Menu",
    renderMenuContent,
  );

  const searchPanel = createPanelBase(
    PANEL_TYPES.SEARCH,
    context.i18n?.search ?? "Tìm kiếm",
    renderSearchContent,
  );

  const accountPanel = createPanelBase(
    PANEL_TYPES.ACCOUNT,
    context.i18n?.account ?? "Tài khoản",
    renderAccountContent,
  );

  panels.set(PANEL_TYPES.MENU, menuPanel);
  panels.set(PANEL_TYPES.SEARCH, searchPanel);
  panels.set(PANEL_TYPES.ACCOUNT, accountPanel);

  layer.append(menuPanel, searchPanel, accountPanel);

  function onKeyDown(event) {
    if (event.key === KEYBOARD_KEYS.ESCAPE && activePanel) {
      event.preventDefault();
      closePanel();
    }
  }

  function onBackdropPointerDown() {
    closePanel();
  }

  function onRouteChanged() {
    closePanel();
  }

  document.addEventListener("keydown", onKeyDown);
  backdrop.addEventListener("pointerdown", onBackdropPointerDown);

  disposers.push(() => {
    document.removeEventListener("keydown", onKeyDown);
    backdrop.removeEventListener("pointerdown", onBackdropPointerDown);
  });

  if (context.eventBus?.on) {
    disposers.push(
      context.eventBus.on(APP_EVENTS.MENU_TOGGLE, () => {
        togglePanel(PANEL_TYPES.MENU);
      }),
    );

    disposers.push(
      context.eventBus.on(APP_EVENTS.SEARCH_TOGGLE, () => {
        togglePanel(PANEL_TYPES.SEARCH);
      }),
    );

    disposers.push(
      context.eventBus.on(APP_EVENTS.ACCOUNT_TOGGLE, () => {
        togglePanel(PANEL_TYPES.ACCOUNT);
      }),
    );

    disposers.push(
      context.eventBus.on(APP_EVENTS.ROUTE_CHANGED, onRouteChanged),
    );
  }

  if (context.store?.subscribeSelector) {
    disposers.push(
      context.store.subscribeSelector(
        (state) => state.ui.activePanel,
        syncPanelState,
      ),
    );

    syncPanelState(context.store.getState()?.ui?.activePanel ?? null);
  }

  context.registerDisposer?.(() => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error("[HoyoAO] Panel manager disposer failed.", error);
      }
    }

    layer.replaceChildren();
  });

  return Object.freeze({
    open: setActivePanel,
    close: closePanel,
    toggle: togglePanel,
  });
} 
