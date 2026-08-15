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

import { createSettingsServiceFromContext } from "../../services/settings/settings-service.js";

const AVATAR_ICON_PATH = `
  <circle cx="12" cy="8" r="4"></circle>
  <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
`;

const BACK_ICON_PATH = `
  <path d="M19 12H5"></path>
  <path d="m12 19-7-7 7-7"></path>
`;

function resolveAvatarUrl() {
  try {
    return new URL("../../../assets/avatars/default.png", import.meta.url)
      .href;
  } catch {
    return "./assets/avatars/default.png";
  }
}

function createAvatarIcon() {
  return createSvg(AVATAR_ICON_PATH);
}

function createBackIcon() {
  return createSvg(BACK_ICON_PATH);
}

export function createAccountFeature(context) {
  let mounted = false;
  let isOpen = false;

  let panel = null;
  let backdrop = null;
  let body = null;
  let lastFocusedElement = null;

  const disposers = [];

  const settingsService = createSettingsServiceFromContext(context);

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function open() {
    context.store?.setState?.({
      ui: { activePanel: PANEL_TYPES.ACCOUNT },
    });
  }

  function close() {
    const activePanel = context.store?.getState?.().ui?.activePanel;

    if (activePanel === PANEL_TYPES.ACCOUNT) {
      context.store?.setState?.({ ui: { activePanel: null } });
    }
  }

  function toggle() {
    const activePanel = context.store?.getState?.().ui?.activePanel;

    if (activePanel === PANEL_TYPES.ACCOUNT) {
      close();
    } else {
      open();
    }
  }

  function getDisplayName() {
    const displayName = settingsService.getSetting("displayName", "");

    return (
      displayName ||
      context.config?.account?.guestLabel ||
      context.i18n?.guest ||
      "Khách"
    );
  }

  function createAvatarImage() {
    const accountConfig = context.config?.account ?? {};

    const wrapper = el("div", { className: "app-panel-avatar" });

    const img = document.createElement("img");

    img.alt = getDisplayName();
    img.src = accountConfig.avatarSrc ?? resolveAvatarUrl();

    img.addEventListener(
      "error",
      () => {
        img.replaceWith(createAvatarIcon());
      },
      { once: true },
    );

    wrapper.append(img);

    return wrapper;
  }

  function renderBody() {
    if (!body) {
      return;
    }

    body.replaceChildren();

    const profile = el("div", { className: "app-panel-profile" }, [
      createAvatarImage(),
      el("div", { className: "app-panel-profile-text" }, [
        el("div", {
          className: "app-panel-profile-title",
          text: getDisplayName(),
        }),
        el("div", {
          className: "app-panel-profile-subtitle",
          text:
            context.config?.account?.statusText ??
            context.i18n?.noAuthentication ??
            "Chưa có hệ thống authentication.",
        }),
      ]),
    ]);

    const settingsButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: context.i18n?.settings ?? "Cài đặt",
    });

    settingsButton.style.width = "100%";

    settingsButton.addEventListener("click", () => {
      context.eventBus?.emit?.(
        context.services?.settingsOpenEvent ?? "hoyoao:settings:open",
        {},
      );
    });

    const note = el("div", {
      className: "app-panel-note app-panel-note--info",
      text:
        "Account hiện tại là UI shell để kiểm tra interaction, responsive và kiến trúc. Hệ thống chưa có authentication — không có login giả.",
    });

    body.append(profile, settingsButton, note);
  }

  function createPanelDom() {
    backdrop = el("div", {
      className: "app-panel-backdrop",
      attrs: { "aria-hidden": "true" },
    });

    panel = el("aside", {
      id: COMPONENT_IDS.ACCOUNT_PANEL,
      className: "app-panel app-panel--account",
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-label": context.i18n?.account ?? "Tài khoản",
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", { className: "app-panel-header" }, [
      el("h2", {
        className: "app-panel-title",
        text: context.i18n?.account ?? "Tài khoản",
      }),
    ]);

    const backButton = el(
      "button",
      {
        className:
          "nav-control nav-control--sm nav-control--quiet app-panel-close",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.accountClose ?? "Đóng bảng tài khoản",
        },
      },
      [createBackIcon()],
    );

    backButton.addEventListener("click", () => {
      close();
    });

    header.append(backButton);

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
    const nextOpen = activePanel === PANEL_TYPES.ACCOUNT;

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

      context.eventBus?.emit?.(APP_EVENTS.ACCOUNT_OPEN, {
        panel: PANEL_TYPES.ACCOUNT,
      });

      return;
    }

    document.removeEventListener("keydown", onDocumentKeydown, true);

    const restoreTarget =
      lastFocusedElement && document.contains(lastFocusedElement)
        ? lastFocusedElement
        : document.getElementById(COMPONENT_IDS.AVATAR_BUTTON);

    restoreTarget?.focus?.({ preventScroll: true });

    context.eventBus?.emit?.(APP_EVENTS.ACCOUNT_CLOSE, {
      panel: PANEL_TYPES.ACCOUNT,
    });
  }

  function handleRouteChanged() {
    if (isOpen) {
      close();
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
      settingsService.subscribe(() => {
        if (isOpen) {
          renderBody();
        }
      }),
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
      context.store?.getState?.().ui?.activePanel === PANEL_TYPES.ACCOUNT
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
    id: "account",
    type: "feature",
    order: 30,
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
    context.services.accountFeature = feature;
  }

  return feature;
}

export function mountAccountFeature(context) {
  const feature = createAccountFeature(context);

  feature.mount();

  return feature;
}

export default createAccountFeature;
