function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    const nested = value[key];

    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  });

  return Object.freeze(value);
}

export const APP_NAMESPACE = "hoyoao";
export const APP_ROOT_ID = "app";

export const APP_IDS = deepFreeze({
  ROOT: "app",
  HEADER: "hoyo-header",
  MAIN: "hoyo-main",
  CONTENT: "hoyo-content",
  FOOTER: "hoyo-footer",
  ENV_CANVAS: "hoyoao-3d-canvas",
  PANEL_LAYER: "hoyo-panel-layer",
  MODAL_LAYER: "hoyo-modal-layer",
  TOAST_LAYER: "hoyo-toast-layer",
  ANNOUNCER: "hoyoao-announcer",
});

export const APP_SELECTORS = deepFreeze({
  ROOT: `#${APP_IDS.ROOT}`,
  HEADER: `#${APP_IDS.HEADER}`,
  MAIN: `#${APP_IDS.MAIN}`,
  CONTENT: `#${APP_IDS.CONTENT}`,
  FOOTER: `#${APP_IDS.FOOTER}`,
  ENV_CANVAS: `#${APP_IDS.ENV_CANVAS}`,
  PANEL_LAYER: `#${APP_IDS.PANEL_LAYER}`,
  MODAL_LAYER: `#${APP_IDS.MODAL_LAYER}`,
  TOAST_LAYER: `#${APP_IDS.TOAST_LAYER}`,
  ANNOUNCER: `#${APP_IDS.ANNOUNCER}`,
});

export const APP_STATE = deepFreeze({
  IDLE: "idle",
  BOOTING: "booting",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  DESTROYED: "destroyed",
});

export const UI_STATE = deepFreeze({
  CLOSED: "closed",
  OPENING: "opening",
  OPEN: "open",
  CLOSING: "closing",
  LOADING: "loading",
  ERROR: "error",
});

export const STATE_CLASSES = deepFreeze({
  BOOTING: "app-state-booting",
  READY: "app-state-ready",
  ERROR: "app-state-error",
});

export const APP_EVENTS = deepFreeze({
  APP_BEFORE_BOOTSTRAP: "hoyoao:app:before-bootstrap",
  APP_SHELL_READY: "hoyoao:app:shell-ready",
  APP_DATA_LOADED: "hoyoao:app:data-loaded",
  APP_READY: "hoyoao:app:ready",
  APP_ERROR: "hoyoao:app:error",
  APP_BOOTSTRAP_ERROR: "hoyoao:app:bootstrap-error",
  APP_STATE_CHANGED: "hoyoao:app:state-changed",
  APP_BEFORE_DESTROY: "hoyoao:app:before-destroy",
  APP_DESTROYED: "hoyoao:app:destroyed",

  BOOTSTRAP_ERROR: "hoyoao:bootstrap-error",

  STORE_CHANGED: "hoyoao:store:changed",

  DATA_BEFORE_LOAD: "hoyoao:data:before-load",
  DATA_LOADED: "hoyoao:data:loaded",
  DATA_LOAD_ERROR: "hoyoao:data:load-error",

  ROUTE_BEFORE_CHANGE: "hoyoao:route:before-change",
  ROUTE_CHANGED: "hoyoao:route:changed",
  ROUTE_NOT_FOUND: "hoyoao:route:not-found",

  PAGE_RENDERED: "hoyoao:page:rendered",
  PAGE_TITLE_CHANGED: "hoyoao:page:title-changed",

  MENU_OPEN: "hoyoao:menu:open",
  MENU_CLOSE: "hoyoao:menu:close",
  MENU_TOGGLE: "hoyoao:menu:toggle",

  SEARCH_OPEN: "hoyoao:search:open",
  SEARCH_CLOSE: "hoyoao:search:close",
  SEARCH_TOGGLE: "hoyoao:search:toggle",
  SEARCH_QUERY: "hoyoao:search:query",
  SEARCH_CLEAR: "hoyoao:search:clear",
  SEARCH_RESULTS_READY: "hoyoao:search:results-ready",

  ACCOUNT_OPEN: "hoyoao:account:open",
  ACCOUNT_CLOSE: "hoyoao:account:close",
  ACCOUNT_TOGGLE: "hoyoao:account:toggle",

  PANEL_OPEN: "hoyoao:panel:open",
  PANEL_CLOSE: "hoyoao:panel:close",
  PANEL_TOGGLE: "hoyoao:panel:toggle",
  PANEL_RENDERED: "hoyoao:panel:rendered",
  PANEL_DESTROYED: "hoyoao:panel:destroyed",

  MODAL_OPEN: "hoyoao:modal:open",
  MODAL_CLOSE: "hoyoao:modal:close",
  MODAL_RENDERED: "hoyoao:modal:rendered",
  MODAL_DESTROYED: "hoyoao:modal:destroyed",

  DROPDOWN_OPEN: "hoyoao:dropdown:open",
  DROPDOWN_CLOSE: "hoyoao:dropdown:close",

  OVERLAY_CLICK: "hoyoao:overlay:click",

  ENV_BEFORE_INIT: "hoyoao:env:before-init",
  ENV_READY: "hoyoao:env:ready",
  ENV_ERROR: "hoyoao:env:error",
  ENV_RESIZE: "hoyoao:env:resize",
  ENV_VISIBILITY_CHANGE: "hoyoao:env:visibility-change",
  ENV_BEFORE_DESTROY: "hoyoao:env:before-destroy",
  ENV_DESTROYED: "hoyoao:env:destroyed",

  THEME_CHANGED: "hoyoao:theme:changed",

  A11Y_ANNOUNCE: "hoyoao:a11y:announce",
});

export const KEYBOARD_KEYS = deepFreeze({
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: " ",
  TAB: "Tab",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  HOME: "Home",
  END: "End",
});

export const DOM_EVENTS = deepFreeze({
  CLICK: "click",
  POINTER_DOWN: "pointerdown",
  KEY_DOWN: "keydown",
  FOCUS_IN: "focusin",
  RESIZE: "resize",
  SCROLL: "scroll",
  HASH_CHANGE: "hashchange",
  POP_STATE: "popstate",
  VISIBILITY_CHANGE: "visibilitychange",
  DOM_CONTENT_LOADED: "DOMContentLoaded",
  LOAD: "load",
});

export const ROUTE_CHANGE_REASON = deepFreeze({
  INITIAL: "initial",
  PUSH: "push",
  POP: "pop",
  REPLACE: "replace",
  PROGRAMMATIC: "programmatic",
});

export const LINK_TYPES = deepFreeze({
  PAGE: "page",
  ROUTE: "route",
  EXTERNAL: "external",
  ACTION: "action",
  DIVIDER: "divider",
});

export const NAVIGATION_TYPES = deepFreeze({
  PAGE: "page",
  ROUTE: "route",
  EXTERNAL: "external",
  ACTION: "action",
  GROUP: "group",
  DIVIDER: "divider",
});

export const PANEL_TYPES = deepFreeze({
  MENU: "menu",
  ACCOUNT: "account",
  SEARCH: "search",
  CUSTOM: "custom",
});

export const PANEL_POSITIONS = deepFreeze({
  LEFT: "left",
  RIGHT: "right",
  TOP: "top",
  BOTTOM: "bottom",
  CENTER: "center",
});

export const MODAL_SIZES = deepFreeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
  FULL: "full",
});

export const COMPONENT_TYPES = deepFreeze({
  HEADER: "header",
  FOOTER: "footer",
  NAVIGATION: "navigation",
  PANEL: "panel",
  MODAL: "modal",
  CARD: "card",
  DASHBOARD: "dashboard",
  SEARCH: "search",
  PAGE: "page",
  ENVIRONMENT: "environment",
});

export const COMPONENT_IDS = deepFreeze({
  HEADER: "app-header",
  FOOTER: "app-footer",
  MENU_BUTTON: "menu-button",
  LOGO: "logo",
  PAGE_SWITCHER: "page-switcher",
  SEARCH_BUTTON: "search-button",
  AVATAR_BUTTON: "avatar-button",
  MENU_PANEL: "menu-panel",
  ACCOUNT_PANEL: "account-panel",
  SEARCH_PANEL: "search-panel",
});

export const FEATURE_KEYS = deepFreeze({
  MENU: "menu",
  PAGE_SWITCHER: "pageSwitcher",
  SEARCH: "search",
  ACCOUNT_PANEL: "accountPanel",
  AUTHENTICATION: "authentication",
  ENV_3D: "3dEnvironment",
});

export const PAGE_LAYOUTS = deepFreeze({
  DASHBOARD: "dashboard",
  IMMERSIVE: "immersive",
  GALLERY: "gallery",
  ARTICLE: "article",
  BLANK: "blank",
});

export const PAGE_MODES = deepFreeze({
  TWO_D: "2d",
  THREE_D: "3d",
});

export const SCENE_ENGINES = deepFreeze({
  WEBGL: "webgl",
  THREE: "three",
});

export const DATA_KEYS = deepFreeze({
  SITE: "site",
  PAGES: "pages",
  NAVIGATION: "navigation",
});

export const DATA_PROVIDERS = deepFreeze({
  LOCAL: "local",
  API: "api",
  MEMORY: "memory",
});

export const DATA_ENDPOINTS = deepFreeze({
  SITE: "./data/site.json",
  PAGES: "./data/pages.json",
  NAVIGATION: "./data/navigation.json",
});

export const STORAGE_PROVIDERS = deepFreeze({
  MEMORY: "memory",
  LOCAL: "local",
  SESSION: "session",
  INDEXED_DB: "indexeddb",
});

export const STORAGE_KEYS = deepFreeze({
  UI: "hoyoao:ui",
  STATE: "hoyoao:state",
  PREFERENCES: "hoyoao:preferences",
  THEME: "hoyoao:theme",
  SEARCH_HISTORY: "hoyoao:search-history",
});

export const SEARCH_PROVIDERS = deepFreeze({
  LOCAL: "local",
  API: "api",
});

export const SEARCH_SOURCES = deepFreeze({
  PAGES: "pages",
  NAVIGATION: "navigation",
  SITE: "site",
});

export const BREAKPOINTS = deepFreeze({
  XS: 360,
  SM: 480,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1600,
  ULTRA: 2560,
});

export const MEDIA_QUERIES = deepFreeze({
  MOBILE: `(max-width: ${BREAKPOINTS.MD - 0.02}px)`,
  TABLET: `(min-width: ${BREAKPOINTS.MD}px) and (max-width: ${
    BREAKPOINTS.LG - 0.02
  }px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.LG}px)`,
  WIDE: `(min-width: ${BREAKPOINTS.XXL}px)`,
  ULTRA: `(min-width: ${BREAKPOINTS.ULTRA}px)`,
});

export const A11Y = deepFreeze({
  FOCUSABLE_SELECTOR:
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',

  ARIA_ATTRIBUTES: {
    CONTROLS: "aria-controls",
    CURRENT: "aria-current",
    DISABLED: "aria-disabled",
    EXPANDED: "aria-expanded",
    HIDDEN: "aria-hidden",
    LABEL: "aria-label",
    LABELLED_BY: "aria-labelledby",
    MODAL: "aria-modal",
    SELECTED: "aria-selected",
  },

  ROLES: {
    ALERT: "alert",
    BUTTON: "button",
    DIALOG: "dialog",
    MENU: "menu",
    MENU_ITEM: "menuitem",
    NAVIGATION: "navigation",
    STATUS: "status",
    TAB: "tab",
    TAB_LIST: "tablist",
    TAB_PANEL: "tabpanel",
  },
});

export const DEFAULTS = deepFreeze({
  LOCALE: "vi",
  THEME: "dark",
  PAGE_ID: "home",
  ROUTE: "#/home",
  NOT_FOUND_PAGE_ID: "not-found",
  FETCH_TIMEOUT_MS: 8000,
  SEARCH_DEBOUNCE_MS: 180,
  SEARCH_MIN_QUERY_LENGTH: 2,
  SEARCH_MAX_RESULTS: 12,
  MAX_EVENT_LISTENERS: 64,
  TRANSITION_MS: 240,
}); 
