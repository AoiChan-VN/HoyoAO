import {
  APP_EVENTS,
  COMPONENT_IDS,
  KEYBOARD_KEYS,
  PANEL_TYPES,
} from "../../core/constants.js";

import { el, createSvg } from "../../utils/dom.js";
import { debounce } from "../../utils/helpers.js";

import { createSearchServiceFromContext } from "../../services/search/search-service.js";

const SEARCH_ICON_PATH = `
  <circle cx="11" cy="11" r="7"></circle>
  <path d="m20 20-3.5-3.5"></path>
`;

const CLOSE_ICON_PATH = `<path d="M18 6 6 18M6 6l12 12"></path>`;

const SEARCH_TITLE_ID = "search-panel-title";
const SEARCH_RESULTS_ID = "search-results";

function createSearchIcon() {
  return createSvg(SEARCH_ICON_PATH);
}

function createCloseIcon() {
  return createSvg(CLOSE_ICON_PATH);
}

function isExternalRoute(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

export function createSearchFeature(context) {
  let mounted = false;
  let isOpen = false;

  let panel = null;
  let backdrop = null;
  let input = null;
  let results = null;
  let status = null;

  let lastFocusedElement = null;
  let lastResults = [];
  let currentController = null;

  const disposers = [];

  const searchConfig = context.config?.services?.search ?? {};

  const minQueryLength = Number.isFinite(searchConfig.minQueryLength)
    ? Math.max(0, Number(searchConfig.minQueryLength))
    : 2;

  const maxResults = Number.isFinite(searchConfig.maxResults)
    ? Math.max(1, Number(searchConfig.maxResults))
    : 12;

  const debounceMs = Number.isFinite(searchConfig.debounceMs)
    ? Math.max(0, Number(searchConfig.debounceMs))
    : 180;

  let searchService = context.services?.search ?? null;
  let createdSearchService = false;

  function addDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function ensureSearchService() {
    if (searchService && typeof searchService.search === "function") {
      return searchService;
    }

    searchService = createSearchServiceFromContext(context);
    createdSearchService = true;

    if (context.services) {
      context.services.search = searchService;
    }

    return searchService;
  }

  function open() {
    context.store?.setState?.({
      ui: {
        activePanel: PANEL_TYPES.SEARCH,
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

    if (activePanel === PANEL_TYPES.SEARCH) {
      close();
    } else {
      open();
    }
  }

  function showStatus(type, message) {
    if (!status) {
      return;
    }

    status.hidden = false;
    status.textContent = message;

    if (type === "danger") {
      status.className = "app-panel-note app-panel-note--danger";
    } else if (type === "info") {
      status.className = "app-panel-note app-panel-note--info";
    } else {
      status.className = "app-panel-note";
    }
  }

  function hideStatus() {
    if (!status) {
      return;
    }

    status.hidden = true;
    status.textContent = "";
  }

  function clearResults() {
    lastResults = [];

    results?.replaceChildren();
  }

  function renderIdle() {
    clearResults();

    const query = String(input?.value ?? "").trim();

    if (!query) {
      hideStatus();
      return;
    }

    if (query.length < minQueryLength) {
      showStatus(
        "info",
        context.i18n?.searchMinQuery?.replace?.("{min}", String(minQueryLength)) ??
          `Nhập ít nhất ${minQueryLength} ký tự để tìm kiếm.`,
      );

      return;
    }

    hideStatus();
  }

  function renderLoading() {
    showStatus("info", context.i18n?.searchLoading ?? "Đang tìm kiếm...");
    input?.setAttribute("aria-busy", "true");
  }

  function renderError() {
    showStatus("danger", context.i18n?.searchError ?? "Tìm kiếm gặp lỗi.");
  }

  function handleResultClick(result) {
    if (!result) {
      return;
    }

    if (isExternalRoute(result.route)) {
      window.open(result.route, "_blank", "noopener");
      close();

      return;
    }

    if (result.pageId || result.route) {
      context.router?.navigate?.(result.pageId ?? result.route);
      close();

      return;
    }

    context.eventBus?.emit?.("hoyoao:search:result-action", {
      result,
    });

    close();
  }

  function createResultButton(result, index) {
    const textChildren = [
      el("span", {
        className: "app-panel-item-title",
        text: result.title,
      }),
    ];

    const subtitle = result.subtitle || result.description;

    if (subtitle) {
      textChildren.push(
        el("span", {
          className: "app-panel-item-subtitle",
          text: subtitle,
        }),
      );
    }

    const children = [
      el("span", { className: "app-panel-item-text" }, textChildren),
    ];

    if (result.type) {
      children.push(
        el("span", {
          className: "app-panel-item-meta",
          text: result.type,
        }),
      );
    }

    const button = el(
      "button",
      {
        className: "app-panel-item app-panel-item--action",
        attrs: {
          type: "button",
          role: "option",
          title: result.description || undefined,
        },
        dataset: {
          resultIndex: String(index),
          resultId: result.id ?? "",
          pageId: result.pageId ?? "",
          route: result.route ?? "",
        },
      },
      children,
    );

    button.addEventListener("click", () => {
      handleResultClick(lastResults[index] ?? result);
    });

    return button;
  }

  function renderResults(list) {
    if (!results) {
      return;
    }

    clearResults();

    lastResults = Array.isArray(list) ? list : [];

    if (lastResults.length === 0) {
      showStatus(
        "info",
        searchConfig.noResultsText ??
          context.i18n?.searchNoResults ??
          "Không có kết quả phù hợp.",
      );

      return;
    }

    hideStatus();

    results.append(...lastResults.map(createResultButton));
  }

  async function performSearch(rawQuery) {
    if (!mounted || !isOpen) {
      return;
    }

    const query = String(rawQuery ?? "").trim();

    if (query.length < minQueryLength) {
      currentController?.abort?.();
      currentController = null;

      renderIdle();

      return;
    }

    currentController?.abort?.();

    const controller = new AbortController();

    currentController = controller;

    renderLoading();

    try {
      const service = ensureSearchService();

      const searchResults = await service.search(query, {
        signal: controller.signal,
        limit: maxResults,
      });

      if (controller.signal.aborted) {
        return;
      }

      renderResults(searchResults);
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        return;
      }

      console.error("[HoyoAO Search Feature] Search failed.", error);

      renderError();
    } finally {
      input?.removeAttribute("aria-busy");

      if (currentController === controller) {
        currentController = null;
      }
    }
  }

  const debouncedSearch = debounce((value) => {
    void performSearch(value);
  }, debounceMs);

  function getResultButtons() {
    if (!results) {
      return [];
    }

    return Array.from(results.querySelectorAll(".app-panel-item"));
  }

  function onInputKeydown(event) {
    if (event.isComposing) {
      return;
    }

    if (event.key === KEYBOARD_KEYS.ARROW_DOWN) {
      const buttons = getResultButtons();

      if (buttons.length > 0) {
        event.preventDefault();
        buttons[0].focus();
      }

      return;
    }

    if (event.key === KEYBOARD_KEYS.ENTER) {
      const buttons = getResultButtons();

      if (buttons.length > 0) {
        event.preventDefault();
        buttons[0].click();
      }
    }
  }

  function onResultsKeydown(event) {
    const buttons = getResultButtons();

    if (buttons.length === 0) {
      return;
    }

    const activeIndex = buttons.indexOf(document.activeElement);

    if (event.key === KEYBOARD_KEYS.ARROW_DOWN) {
      event.preventDefault();

      const nextIndex =
        activeIndex === -1
          ? 0
          : Math.min(activeIndex + 1, buttons.length - 1);

      buttons[nextIndex]?.focus();

      return;
    }

    if (event.key === KEYBOARD_KEYS.ARROW_UP) {
      event.preventDefault();

      if (activeIndex <= 0) {
        input?.focus();
      } else {
        buttons[activeIndex - 1]?.focus();
      }

      return;
    }

    if (event.key === KEYBOARD_KEYS.HOME) {
      event.preventDefault();
      buttons[0]?.focus();

      return;
    }

    if (event.key === KEYBOARD_KEYS.END) {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  }

  function onDocumentKeydown(event) {
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      event.preventDefault();
      close();
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
      id: COMPONENT_IDS.SEARCH_PANEL,
      className: "app-panel app-panel--search",
      attrs: {
        role: "dialog",
        "aria-modal": "false",
        "aria-labelledby": SEARCH_TITLE_ID,
        tabindex: "-1",
        "aria-hidden": "true",
      },
    });

    const header = el("div", {
      className: "app-panel-header",
    });

    const title = el("h2", {
      id: SEARCH_TITLE_ID,
      className: "app-panel-title",
      text: context.i18n?.search ?? "Tìm kiếm",
    });

    const closeButton = el(
      "button",
      {
        className: "nav-control nav-control--sm nav-control--quiet",
        attrs: {
          type: "button",
          "aria-label": context.i18n?.searchClose ?? "Đóng tìm kiếm",
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

    const inputWrapper = el("div", {
      className: "app-panel-input",
    });

    input = el("input", {
      attrs: {
        type: "search",
        placeholder:
          searchConfig.placeholder ??
          context.i18n?.searchPlaceholder ??
          "Tìm kiếm...",
        "aria-label": context.i18n?.search ?? "Tìm kiếm",
        "aria-controls": SEARCH_RESULTS_ID,
        autocomplete: "off",
        enterkeyhint: "search",
      },
    });

    inputWrapper.append(createSearchIcon(), input);

    status = el("div", {
      className: "app-panel-note",
      attrs: {
        role: "status",
        "aria-live": "polite",
        hidden: true,
      },
    });

    results = el("div", {
      id: SEARCH_RESULTS_ID,
      className: "app-panel-results",
      attrs: {
        role: "listbox",
        "aria-label": context.i18n?.searchResults ?? "Kết quả tìm kiếm",
      },
    });

    body.append(inputWrapper, status, results);
    panel.append(header, body);

    const target = context.shell?.panelLayer ?? document.body;

    target.append(backdrop, panel);

    backdrop.addEventListener("pointerdown", () => {
      close();
    });

    input.addEventListener("input", (event) => {
      const value = event.target?.value ?? "";

      if (!String(value).trim()) {
        debouncedSearch.cancel?.();
        currentController?.abort?.();
        currentController = null;

        renderIdle();

        return;
      }

      debouncedSearch(value);
    });

    input.addEventListener("keydown", onInputKeydown);
    results.addEventListener("keydown", onResultsKeydown);

    addDisposer(() => {
      backdrop.remove();
      panel.remove();
    });
  }

  function syncOpenState(activePanel) {
    const nextOpen = activePanel === PANEL_TYPES.SEARCH;

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
        input?.focus({ preventScroll: true });

        if (input && input.value) {
          input.select();
        }

        const query = String(input?.value ?? "").trim();

        if (
          query.length >= minQueryLength &&
          lastResults.length === 0 &&
          results &&
          results.children.length === 0
        ) {
          void performSearch(query);
        }
      });

      document.addEventListener("keydown", onDocumentKeydown, true);

      context.eventBus?.emit?.(APP_EVENTS.SEARCH_OPEN, {
        panel: PANEL_TYPES.SEARCH,
      });

      return;
    }

    document.removeEventListener("keydown", onDocumentKeydown, true);

    debouncedSearch.cancel?.();
    currentController?.abort?.();
    currentController = null;

    input?.removeAttribute("aria-busy");

    const restoreTarget =
      lastFocusedElement && document.contains(lastFocusedElement)
        ? lastFocusedElement
        : document.getElementById(COMPONENT_IDS.SEARCH_BUTTON);

    restoreTarget?.focus?.({
      preventScroll: true,
    });

    context.eventBus?.emit?.(APP_EVENTS.SEARCH_CLOSE, {
      panel: PANEL_TYPES.SEARCH,
    });
  }

  function clearSearchUI() {
    if (input) {
      input.value = "";
    }

    currentController?.abort?.();
    currentController = null;

    renderIdle();
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

    ensureSearchService();
    createPanelDom();
    renderIdle();

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

      addDisposer(
        context.eventBus.on(APP_EVENTS.SEARCH_CLEAR, clearSearchUI),
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

    if (context.store?.getState?.().ui?.activePanel === PANEL_TYPES.SEARCH) {
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

    debouncedSearch.cancel?.();
    currentController?.abort?.();
    currentController = null;

    for (const disposer of disposers.splice(0)) {
      try {
        disposer();
      } catch (error) {
        console.error("[HoyoAO Search Feature] Disposer failed.", error);
      }
    }

    if (createdSearchService) {
      searchService?.destroy?.();

      if (context.services && context.services.search === searchService) {
        delete context.services.search;
      }

      searchService = null;
      createdSearchService = false;
    }

    panel = null;
    backdrop = null;
    input = null;
    results = null;
    status = null;
    lastFocusedElement = null;
    lastResults = [];
  }

  const feature = Object.freeze({
    id: "search",
    type: "feature",
    order: 20,
    mount,
    unmount,
    open,
    close,
    toggle,
    clear() {
      clearSearchUI();
    },
    isOpen() {
      return isOpen;
    },
  });

  if (context.services) {
    context.services.searchFeature = feature;
  }

  return feature;
}

export function mountSearchFeature(context) {
  const feature = createSearchFeature(context);

  feature.mount();

  return feature;
}

export default createSearchFeature;
