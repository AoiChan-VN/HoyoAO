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

const CLOSE_ICON_PATH = `<path d="M18 6 6 18M6 6l12 12"></path>`;

const AVATAR_ICON_PATH = `
  <circle cx="12" cy="8" r="4"></circle>
  <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
`;

const ACCOUNT_TITLE_ID = "account-panel-title";

function createCloseIcon() {
  return createSvg(CLOSE_ICON_PATH);
}

function createAvatarIcon() {
  return createSvg(AVATAR_ICON_PATH);
}

export function createAccountFeature(context) {
  let mounted = false;
  let isOpen = false;

  let panel = null;
  let backdrop = null;
  let lastFocusedElement = null;

  const disposers = [];

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function open() {
    context.store?.setState?.({
      ui: {
        activePanel: PANEL_TYPES.ACCOUNT,
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

    if (activePanel === PANEL_TYPES.ACCOUNT) {
      close();
    } else {
      open();
    }
  }

  function getProfileState() {
    const accountConfig = context.config?.account ?? {};

    const guestLabel =
      accountConfig.guestLabel ??
      context.i18n?.guest ??
      "Khách";

    const noAuthenticationLabel =
      accountConfig.statusText ??
      context.i18n?.noAuthentication ??
      "Hiện tại chưa có hệ thống authentication.";

    const authReady =
      context.features?.authentication === true &&
      typeof context.services?.auth?.getProfile === "function";

    if (!authReady) {
      return {
        title: guestLabel,
        subtitle: noAuthenticationLabel,
        authenticated: false,
      };
    }

    try {
      const profile = context.services.auth.getProfile();

      return {
        title: profile?.name ?? guestLabel,
        subtitle:
          profile?.status ??
          profile?.email ??
          noAuthenticationLabel,
        authenticated: Boolean(profile?.authenticated),
      };
    } catch (error) {
      console.error("[HoyoAO Account] Failed to read auth profile.", error);

      return {
        title: guestLabel,
        subtitle: noAuthenticationLabel,
        authenticated: false,
      };
    }
  }

  function createPanelDom() {
    backdrop = el("div", {
      className: "app-panel-backdrop",
      attrs: {
        "aria-hidden": "true",
      },
    });

    panel = el("aside", {
      id: COMPONENT_IDS.ACCOUNT_PANEL,
      className: "app-panel app-panel--account",
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-labelledby": ACCOUNT_TITLE_ID,
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", {
      className: "app-panel-header",
    });

    const title = el("h2", {
      id: ACCOUNT_TITLE_ID,
      className: "app-panel-title",
      text: context.i18n?.account ?? "Tài khoản",
    });

    const closeButton = el(
      "button",
      {
        className: "nav-control nav-control--sm nav-control--quiet",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.accountClose ?? "Đóng bảng tài khoản",
        },
      },
      [createCloseIcon()],
    );

    closeButton.addEventListener("click", () => {
      close();
    });

    header.append(title, closeButton);

    const body = el("div", {
      className: "app-panel-body",
    });

    const profileState = getProfileState();

    const profile = el("div", { className: "app-panel-profile" });

    const avatar = el("div", { className: "app-panel-avatar" }, [
      createAvatarIcon(),
    ]);

    const profileText = el("div", { className: "app-panel-profile-text" }, [
      el("div", {
        className: "app-panel-profile-title",
        text: profileState.title,
      }),
      el("div", {
        className: "app-panel-profile-subtitle",
        text: profileState.subtitle,
      }),
    ]);

    profile.append(avatar, profileText);

    body.append(profile);

    if (!profileState.authenticated) {
      body.append(
        el("div", {
          className: "app-panel-note app-panel-note--info",
          text:
            context.config?.account?.statusText ??
            context.i18n?.noAuthentication ??
            "Hiện tại chưa có hệ thống authentication.",
        }),
      );
    }

    body.append(
      el("div", {
        className: "app-panel-note",
        text:
          context.i18n?.accountUiShell ??
          "Account panel là UI shell để kiểm tra interaction, responsive và kiến trúc authentication trong tương lai.",
      }),
    );

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

    restoreTarget?.focus?.({
      preventScroll: true,
    });

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

    if (context.store?.subscribeSelector) {
      addDisposer(
        context.store.subscribeSelector(
          (state) => state.ui.activePanel,
          syncOpenState,
        ),
      );

      syncOpenState(context.store.getState()?.ui?.activePanel ?? null);
    }

    if (context.eventBus?.on) {
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

    if (context.store?.getState?.().ui?.activePanel === PANEL_TYPES.ACCOUNT) {
      context.store.setState({
        ui: {
          activePanel: null,
        },
      });
    }

    if (isOpen) {
      isOpen = false;

      document.removeEventListener("keydown", onDocumentKeydown, true);
    }

    for (const disposer of disposers.splice(0)) {
      try {
        disposer();
      } catch (error) {
        console.error("[HoyoAO Account] Disposer failed.", error);
      }
    }

    panel = null;
    backdrop = null;
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
