import {
  APP_EVENTS,
  ROUTE_CHANGE_REASON,
} from "./constants.js";

function parseHashString(hash) {
  let raw = String(hash ?? "").trim();

  if (!raw || raw === "#") {
    return {
      rawHash: "",
      path: "/",
      search: "",
      query: {},
    };
  }

  if (!raw.startsWith("#")) {
    raw = raw.startsWith("/") ? `#${raw}` : `#/${raw}`;
  }

  const withoutHash = raw.slice(1);
  const questionIndex = withoutHash.indexOf("?");

  const pathname =
    questionIndex === -1
      ? withoutHash
      : withoutHash.slice(0, questionIndex);

  const search =
    questionIndex === -1 ? "" : withoutHash.slice(questionIndex + 1);

  let path = String(pathname ?? "").trim() || "/";

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  const query = Object.fromEntries(new URLSearchParams(search).entries());

  return {
    rawHash: `#${path}${search ? `?${search}` : ""}`,
    path,
    search,
    query,
  };
}

function ensureHash(route) {
  const parsed = parseHashString(route);

  if (!parsed.path || parsed.path === "/") {
    return "#/";
  }

  return `#${parsed.path}${parsed.search ? `?${parsed.search}` : ""}`;
}

function serializeQuery(query) {
  if (!query || typeof query !== "object") {
    return "";
  }

  return new URLSearchParams(query).toString();
}

export function createRouter(context = {}) {
  const eventBus = context.eventBus ?? null;
  const store = context.store ?? null;
  const pagesData = context.data?.pages ?? null;

  if (!pagesData || !Array.isArray(pagesData.pages)) {
    throw new Error("[HoyoAO] Router requires pages data with a pages array.");
  }

  const allPages = pagesData.pages.filter(Boolean);
  const pageById = new Map();
  const pageByRoute = new Map();

  for (const page of allPages) {
    if (!page.id) {
      throw new Error("[HoyoAO] Every page must have an id.");
    }

    pageById.set(page.id, page);
  }

  for (const page of allPages) {
    if (page.enabled === false) {
      continue;
    }

    const parsed = parseHashString(page.route);

    if (pageByRoute.has(parsed.path)) {
      throw new Error(
        `[HoyoAO] Duplicate route "${parsed.path}" detected for page "${page.id}".`,
      );
    }

    pageByRoute.set(parsed.path, page);
  }

  let current = null;
  let started = false;
  let destroyed = false;
  let applying = false;
  let queuedReason = null;

  function emit(event, payload) {
    try {
      eventBus?.emit?.(event, payload);
    } catch (error) {
      console.error("[HoyoAO] Router event emission failed.", error);
    }
  }

  function getDefaultPage() {
    const defaultPage = pageById.get(pagesData.defaultPageId);

    if (defaultPage && defaultPage.enabled !== false) {
      return defaultPage;
    }

    return (
      allPages.find((page) => page.enabled !== false) ??
      allPages[0] ??
      null
    );
  }

  function getFallbackPage() {
    const fallbackPage = pageById.get(pagesData.fallbackPageId);

    if (fallbackPage && fallbackPage.enabled !== false) {
      return fallbackPage;
    }

    return getDefaultPage();
  }

  function getNotFoundPage() {
    const notFoundPage = pageById.get(pagesData.router?.notFoundPageId);

    if (notFoundPage && notFoundPage.enabled !== false) {
      return notFoundPage;
    }

    return null;
  }

  function getAllPages() {
    return [...allPages];
  }

  function getPageById(pageId) {
    return pageById.get(pageId) ?? null;
  }

  function getPageByRoute(route) {
    const parsed = parseHashString(route);

    return pageByRoute.get(parsed.path) ?? null;
  }

  function getSwitcherPages() {
    return allPages
      .filter((page) => page.enabled !== false && page.hidden !== true)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function resolvePage(input) {
    if (!input) {
      return null;
    }

    if (typeof input === "object") {
      if (input.id && pageById.has(input.id)) {
        const page = pageById.get(input.id);

        return page.enabled === false ? null : page;
      }

      if (input.route) {
        return getPageByRoute(input.route);
      }

      return null;
    }

    const value = String(input).trim();

    if (!value) {
      return null;
    }

    if (pageById.has(value)) {
      const page = pageById.get(value);

      return page.enabled === false ? null : page;
    }

    return getPageByRoute(value);
  }

  function parseLocationHash() {
    return parseHashString(window.location.hash);
  }

  function formatTitle(page) {
    if (!page) {
      return context.config?.name ?? "HoyoAO";
    }

    if (page.title) {
      return page.title;
    }

    if (context.config?.name) {
      return `${context.config.name} / ${page.label ?? page.id}`;
    }

    return page.label ?? page.id;
  }

  function createRouteRecord(page, locationInfo, reason, notFound) {
    return {
      pageId: page?.id ?? null,
      page,
      path: locationInfo.path,
      search: locationInfo.search,
      query: locationInfo.query,
      hash: locationInfo.rawHash || ensureHash(page?.route ?? "#/"),
      matchedRoute: page?.route ?? null,
      title: formatTitle(page),
      description: page?.description ?? null,
      layout: page?.layout ?? "blank",
      mode: page?.mode ?? "2d",
      scene: page?.scene ?? null,
      reason,
      notFound,
      params: {},
      timestamp: Date.now(),
    };
  }

  function isSameRoute(a, b) {
    if (!a || !b) {
      return false;
    }

    return a.path === b.path && a.search === b.search;
  }

  function setHash(hash, { replace = false } = {}) {
    const url = new URL(window.location.href);
    url.hash = ensureHash(hash);

    if (replace) {
      window.history.replaceState(null, "", url.href);
    } else {
      window.history.pushState(null, "", url.href);
    }
  }

  function updateDocument(route) {
    document.title = route.title;

    if (route.pageId) {
      document.documentElement.dataset.pageId = route.pageId;
      document.documentElement.dataset.pageLayout = route.layout;
      document.documentElement.dataset.pageMode = route.mode;
    }

    const descriptionMeta = document.querySelector('meta[name="description"]');

    if (descriptionMeta) {
      const description =
        route.description ?? context.config?.meta?.description ?? "";

      descriptionMeta.setAttribute("content", description);
    }

    emit(APP_EVENTS.PAGE_TITLE_CHANGED, {
      title: route.title,
      route,
    });
  }

  function updateStore(route) {
    store?.setState?.({
      route: {
        pageId: route.pageId,
        route: route.hash,
        matchedRoute: route.matchedRoute,
        title: route.title,
        layout: route.layout,
        mode: route.mode,
        notFound: route.notFound,
        query: route.query,
        params: route.params,
        reason: route.reason,
      },
    });
  }

  function prepareContent(route) {
    const content = context.shell?.content;

    if (!content) {
      return;
    }

    content.replaceChildren();

    content.dataset.pageId = route.pageId ?? "";
    content.dataset.layout = route.layout;
    content.dataset.mode = route.mode;
    content.dataset.notFound = route.notFound ? "true" : "false";

    content.setAttribute("aria-label", route.title);
  }

  async function renderRoute(route) {
    if (typeof context.services?.pageRenderer === "function") {
      await context.services.pageRenderer(route, context);
    }

    emit(APP_EVENTS.PAGE_RENDERED, {
      route,
      context,
    });
  }

  function announceRoute(route) {
    context.a11y?.announce?.(route.title);
  }

  function scrollToTop(route) {
    if (route.reason === ROUTE_CHANGE_REASON.INITIAL) {
      window.scrollTo(0, 0);
      return;
    }

    if (route.reason === ROUTE_CHANGE_REASON.PROGRAMMATIC) {
      window.scrollTo(0, 0);
    }
  }

  function findPageByPath(path) {
    if (path === "/") {
      return getDefaultPage();
    }

    return pageByRoute.get(path) ?? null;
  }

  async function applyRoute(reason) {
    if (destroyed) {
      return current;
    }

    if (applying) {
      queuedReason = reason;
      return current;
    }

    applying = true;

    try {
      const locationInfo = parseLocationHash();

      let page = findPageByPath(locationInfo.path);
      let notFound = false;

      if (locationInfo.path === "/") {
        const defaultPage = getDefaultPage();

        if (defaultPage) {
          const canonicalHash = ensureHash(defaultPage.route);

          if (locationInfo.rawHash !== canonicalHash) {
            setHash(canonicalHash, { replace: true });
          }

          page = defaultPage;
        }
      }

      if (!page || page.enabled === false) {
        notFound = true;
        page = getNotFoundPage() ?? getFallbackPage() ?? getDefaultPage();
      }

      if (!page) {
        throw new Error("[HoyoAO] No page available for routing.");
      }

      const next = createRouteRecord(page, locationInfo, reason, notFound);

      if (isSameRoute(current, next)) {
        return current;
      }

      const from = current;

      emit(APP_EVENTS.ROUTE_BEFORE_CHANGE, {
        from,
        to: next,
      });

      current = next;

      updateDocument(next);
      updateStore(next);
      prepareContent(next);

      try {
        await renderRoute(next);
      } catch (renderError) {
        emit(APP_EVENTS.APP_ERROR, {
          error: renderError,
          route: next,
          context,
        });

        throw renderError;
      }

      if (next.notFound) {
        emit(APP_EVENTS.ROUTE_NOT_FOUND, {
          route: next,
        });
      }

      emit(APP_EVENTS.ROUTE_CHANGED, {
        from,
        to: next,
      });

      announceRoute(next);
      scrollToTop(next);

      return next;
    } finally {
      applying = false;

      if (queuedReason !== null) {
        const nextReason = queuedReason;
        queuedReason = null;
        void applyRoute(nextReason);
      }
    }
  }

  function onHashChange() {
    void applyRoute(ROUTE_CHANGE_REASON.POP);
  }

  async function start() {
    if (destroyed) {
      throw new Error("[HoyoAO] Router is destroyed.");
    }

    if (started) {
      return current;
    }

    started = true;

    window.addEventListener("hashchange", onHashChange);

    context.registerDisposer?.(() => {
      destroy();
    });

    const initialLocation = parseLocationHash();

    if (!initialLocation.rawHash || initialLocation.path === "/") {
      const defaultPage = getDefaultPage();

      if (defaultPage) {
        setHash(defaultPage.route, { replace: true });
      }
    }

    await applyRoute(ROUTE_CHANGE_REASON.INITIAL);

    return current;
  }

  async function navigate(input, options = {}) {
    if (destroyed) {
      return null;
    }

    const page = resolvePage(input);

    if (!page) {
      const unknownHash =
        typeof input === "string"
          ? ensureHash(input)
          : ensureHash(getNotFoundPage()?.route ?? getFallbackPage()?.route ?? "#/");

      setHash(unknownHash, {
        replace: options.replace ?? true,
      });

      return applyRoute(options.reason ?? ROUTE_CHANGE_REASON.PROGRAMMATIC);
    }

    const targetHash = ensureHash(page.route);
    const targetLocation = parseHashString(targetHash);

    if (
      !options.force &&
      current &&
      current.path === targetLocation.path &&
      current.search === targetLocation.search
    ) {
      return current;
    }

    setHash(targetHash, {
      replace: options.replace ?? false,
    });

    return applyRoute(options.reason ?? ROUTE_CHANGE_REASON.PROGRAMMATIC);
  }

  async function replace(input, options = {}) {
    return navigate(input, {
      ...options,
      replace: true,
    });
  }

  async function refresh() {
    return applyRoute(ROUTE_CHANGE_REASON.PROGRAMMATIC);
  }

  function back() {
    if (!destroyed) {
      window.history.back();
    }
  }

  function forward() {
    if (!destroyed) {
      window.history.forward();
    }
  }

  function getCurrentRoute() {
    return current;
  }

  function isActive(input) {
    const page = resolvePage(input);

    if (!page || !current) {
      return false;
    }

    return current.pageId === page.id;
  }

  function isStarted() {
    return started;
  }

  function isDestroyed() {
    return destroyed;
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    started = false;
    current = null;
    queuedReason = null;

    window.removeEventListener("hashchange", onHashChange);
  }

  return Object.freeze({
    start,
    navigate,
    replace,
    refresh,
    back,
    forward,
    getCurrentRoute,
    getAllPages,
    getPageById,
    getPageByRoute,
    getSwitcherPages,
    resolvePage,
    isActive,
    isStarted,
    isDestroyed,
    destroy,
  });
} 
