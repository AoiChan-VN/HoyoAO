import { KEYBOARD_KEYS } from "../../core/constants.js";

import {
  el,
  createSvg,
  focusFirstFocusable,
} from "../../utils/dom.js";

import {
  createSettingsServiceFromContext,
  SETTING_OPTIONS,
  SETTINGS_KEYS,
} from "../../services/settings/settings-service.js";

const SETTINGS_PANEL_ID = "settings-panel";
const SETTINGS_PANEL_TYPE = "settings";
const SETTINGS_OPEN_EVENT = "hoyoao:settings:open";

const BACK_ICON_PATH = `
  <path d="M19 12H5"></path>
  <path d="m12 19-7-7 7-7"></path>
`;

const CONTROL_STYLE = `
  background: var(--color-bg-input, rgba(10, 14, 22, 0.92));
  color: var(--color-text-primary, #f8fafc);
  border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.18));
  border-radius: var(--app-radius-sm, 8px);
  padding: 4px 8px;
  font-size: var(--app-font-size-xs, 0.75rem);
  max-width: 9rem;
`;

const CHECK_STYLE = `
  accent-color: var(--color-brand-primary, #38bdf8);
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
`;

function createBackIcon() {
  return createSvg(BACK_ICON_PATH);
}

function createSelect(options, currentValue, ariaLabel) {
  const select = el("select", {
    attrs: {
      "aria-label": ariaLabel,
    },
  });

  select.style.cssText = CONTROL_STYLE;

  for (const option of options) {
    select.append(
      el("option", {
        attrs: { value: option },
        text: option,
      }),
    );
  }

  select.value = currentValue;

  return select;
}

function createTextInput(currentValue, ariaLabel, placeholder) {
  const input = el("input", {
    attrs: {
      type: "text",
      "aria-label": ariaLabel,
      placeholder: placeholder ?? "",
      maxlength: "40",
    },
  });

  input.style.cssText = CONTROL_STYLE;
  input.value = currentValue ?? "";

  return input;
}

function createCheck(currentValue, ariaLabel) {
  const input = el("input", {
    attrs: {
      type: "checkbox",
      "aria-label": ariaLabel,
    },
  });

  input.style.cssText = CHECK_STYLE;
  input.checked = currentValue === true;

  return input;
}

function createRow(labelText, control) {
  return el("div", { className: "app-panel-item" }, [
    el("span", {
      className: "app-panel-item-label",
      text: labelText,
    }),
    control,
  ]);
}

export function createSettingsFeature(context) {
  let mounted = false;
  let isOpen = false;

  let panel = null;
  let backdrop = null;
  let body = null;
  let lastFocusedElement = null;

  const controls = {};
  const disposers = [];

  const settingsService = createSettingsServiceFromContext(context);

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function open() {
    context.store?.setState?.({
      ui: { activePanel: SETTINGS_PANEL_TYPE },
    });
  }

  function close() {
    const activePanel = context.store?.getState?.().ui?.activePanel;

    if (activePanel === SETTINGS_PANEL_TYPE) {
      context.store?.setState?.({ ui: { activePanel: null } });
    }
  }

  function toggle() {
    const activePanel = context.store?.getState?.().ui?.activePanel;

    if (activePanel === SETTINGS_PANEL_TYPE) {
      close();
    } else {
      open();
    }
  }

  function syncControlsFromSettings() {
    const settings = settingsService.getSettings();

    if (controls.locale) controls.locale.value = settings.locale;
    if (controls.theme) controls.theme.value = settings.theme;
    if (controls.accent) controls.accent.value = settings.accent;
    if (controls.displayName) {
      controls.displayName.value = settings.displayName;
    }
    if (controls.reduceMotion) {
      controls.reduceMotion.checked = settings.reduceMotion;
    }
    if (controls.compactMode) {
      controls.compactMode.checked = settings.compactMode;
    }
  }

  function renderBody() {
    if (!body) {
      return;
    }

    body.replaceChildren();

    const settings = settingsService.getSettings();

    const appearanceSection = el("div", {
      className: "app-panel-section",
    });

    appearanceSection.append(
      el("div", { className: "app-panel-heading", text: "Giao diện" }),
    );

    controls.theme = createSelect(
      SETTING_OPTIONS.theme,
      settings.theme,
      "Theme",
    );

    controls.theme.addEventListener("change", (event) => {
      settingsService.setSetting(SETTINGS_KEYS.THEME, event.target.value);
    });

    controls.accent = createSelect(
      SETTING_OPTIONS.accent,
      settings.accent,
      "Màu nhấn",
    );

    controls.accent.addEventListener("change", (event) => {
      settingsService.setSetting(SETTINGS_KEYS.ACCENT, event.target.value);
    });

    controls.compactMode = createCheck(
      settings.compactMode,
      "Chế độ thu gọn",
    );

    controls.compactMode.addEventListener("change", (event) => {
      settingsService.setSetting(
        SETTINGS_KEYS.COMPACT_MODE,
        event.target.checked,
      );
    });

    controls.reduceMotion = createCheck(
      settings.reduceMotion,
      "Giảm chuyển động",
    );

    controls.reduceMotion.addEventListener("change", (event) => {
      settingsService.setSetting(
        SETTINGS_KEYS.REDUCE_MOTION,
        event.target.checked,
      );
    });

    appearanceSection.append(
      createRow("Theme", controls.theme),
      createRow("Màu nhấn", controls.accent),
      createRow("Thu gọn", controls.compactMode),
      createRow("Giảm chuyển động", controls.reduceMotion),
    );

    const personalSection = el("div", {
      className: "app-panel-section",
    });

    personalSection.append(
      el("div", { className: "app-panel-heading", text: "Cá nhân" }),
    );

    controls.displayName = createTextInput(
      settings.displayName,
      "Tên hiển thị",
      "Tên hiển thị...",
    );

    controls.displayName.addEventListener("input", (event) => {
      settingsService.setSetting(
        SETTINGS_KEYS.DISPLAY_NAME,
        event.target.value,
      );
    });

    personalSection.append(
      createRow("Tên hiển thị", controls.displayName),
    );

    const languageSection = el("div", {
      className: "app-panel-section",
    });

    languageSection.append(
      el("div", { className: "app-panel-heading", text: "Ngôn ngữ" }),
    );

    controls.locale = createSelect(
      SETTING_OPTIONS.locale,
      settings.locale,
      "Ngôn ngữ",
    );

    controls.locale.addEventListener("change", (event) => {
      settingsService.setSetting(SETTINGS_KEYS.LOCALE, event.target.value);
    });

    languageSection.append(createRow("Ngôn ngữ", controls.locale));

    const resetButton = el("button", {
      className: "nav-control nav-control--text",
      attrs: { type: "button" },
      text: "Khôi phục mặc định",
    });

    resetButton.addEventListener("click", () => {
      settingsService.resetSettings();
      syncControlsFromSettings();
    });

    body.append(
      appearanceSection,
      personalSection,
      languageSection,
      el("div", { className: "app-panel-footer" }, [resetButton]),
    );
  }

  function createPanelDom() {
    backdrop = el("div", {
      className: "app-panel-backdrop",
      attrs: { "aria-hidden": "true" },
    });

    panel = el("aside", {
      id: SETTINGS_PANEL_ID,
      className: "app-panel app-panel--account app-panel--settings",
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-label": context.i18n?.settings ?? "Cài đặt",
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", { className: "app-panel-header" }, [
      el("h2", {
        className: "app-panel-title",
        text: context.i18n?.settings ?? "Cài đặt",
      }),
    ]);

    const backButton = el(
      "button",
      {
        className:
          "nav-control nav-control--sm nav-control--quiet app-panel-close",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.settingsClose ?? "Đóng cài đặt",
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
    const nextOpen = activePanel === SETTINGS_PANEL_TYPE;

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

      return;
    }

    document.removeEventListener("keydown", onDocumentKeydown, true);

    const restoreTarget =
      lastFocusedElement && document.contains(lastFocusedElement)
        ? lastFocusedElement
        : null;

    restoreTarget?.focus?.({ preventScroll: true });
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

    addDisposer(settingsService.subscribe(() => {
      if (isOpen) {
        syncControlsFromSettings();
      }
    }));

    if (context.eventBus?.on) {
      addDisposer(
        context.eventBus.on(SETTINGS_OPEN_EVENT, () => {
          open();
        }),
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
      context.store?.getState?.().ui?.activePanel === SETTINGS_PANEL_TYPE
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
    id: "settings",
    type: "feature",
    order: 31,
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
    context.services.settingsFeature = feature;
    context.services.settingsOpenEvent = SETTINGS_OPEN_EVENT;
  }

  return feature;
}

export function mountSettingsFeature(context) {
  const feature = createSettingsFeature(context);

  feature.mount();

  return feature;
}

export default createSettingsFeature; 
