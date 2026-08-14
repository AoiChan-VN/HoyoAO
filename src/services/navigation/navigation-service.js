import { APP_EVENTS, LINK_TYPES } from "../../core/constants.js";

export const NAVIGATION_LOCATIONS = Object.freeze({
  MENU: "menu",
  FOOTER: "footer",
  HEADER: "header",
  ACCOUNT: "account",
});

export const NAVIGATION_EVENTS = Object.freeze({
  ACTIVE_CHANGED: "hoyoao:navigation:active-changed",
  DATA_CHANGED: "hoyoao:navigation:data-changed",
});

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function ensureArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toDisplayString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .join(" ");
  }

  return String(value).trim();
}

function normalizeOrder(value) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 100;
}

function normalizeLocation(location) {
  return String(location ?? "").trim().toLowerCase();
}

function compareEntries(a, b) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return String(a.label ?? "").localeCompare(String(b.label ?? ""));
}

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

function routePath(value) {
  let raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(raw)) {
    return raw;
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

function normalizeItem(raw, source) {
  if (!isPlainObject(raw)) {
    return null;
  }

  const explicitType = toDisplayString(raw.type).toLowerCase();

  let type = explicitType;

  if (!type) {
    if (raw.pageId) {
      type = LINK_TYPES.PAGE;
    } else if (raw.href) {
      type = LINK_TYPES.EXTERNAL;
    } else if (raw.route) {
      type = LINK_TYPES.ROUTE;
    } else {
      type = LINK_TYPES.ACTION;
    }
  }

  const idBase =
    toDisplayString(raw.id) ||
    `${source}:${toDisplayString(raw.label ?? raw.title ?? raw.name).toLowerCase()}`;

  if (type === LINK_TYPES.DIVIDER) {
    return deepFreeze({
      id: idBase,
      source,
      type,
      label: "",
      icon: null,
      description: "",
      route: null,
      pageId: null,
      href: null,
      target: null,
      rel: null,
      order: normalizeOrder(raw.order),
      enabled: raw.enabled !== false,
      hidden: raw.hidden === true,
      badge: null,
      children: Object.freeze([]),
    });
  }

  const label = toDisplayString(raw.label ?? raw.title ?? raw.name);

  if (!label) {
    return null;
  }

  const childrenRaw = Array.isArray(raw.children)
    ? raw.children
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const children = childrenRaw
    .map((child) => normalizeItem(child, source))
    .filter(Boolean);

  children.sort(compareEntries);

  return deepFreeze({
    id: toDisplayString(raw.id) || `${source}:${label.toLowerCase()}`,
    source,
    type,
    label,
    icon: raw.icon ?? null,
    description: toDisplayString(raw.description ?? raw.subtitle),
    route: raw.route ?? null,
    pageId: raw.pageId ?? null,
    href: raw.href ?? null,
    target: raw.target ?? null,
    rel: raw.rel ?? null,
    order: normalizeOrder(raw.order),
    enabled: raw.enabled !== false,
    hidden: raw.hidden === true,
    badge: raw.badge ?? null,
    children: Object.freeze(children),
  });
}

function normalizeGroup(raw, source) {
  if (!raw) {
    return null;
  }

  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => normalizeItem(item, source))
      .filter(Boolean);

    if (items.length === 0) {
      return null;
    }

    items.sort(compareEntries);

    return deepFreeze({
      id: `${source}:group`,
      label: "",
      hiddenLabel: true,
      order: 100,
      enabled: true,
      hidden: false,
      items: Object.freeze(items),
    });
  }

  if (!isPlainObject(raw)) {
    return null;
  }

  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

  const items = itemsRaw
    .map((item) => normalizeItem(item, source))
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  items.sort(compareEntries);

  const label = toDisplayString(raw.label);

  return deepFreeze({
    id:
      toDisplayString(raw.id) ||
      `${source}:group:${label.toLowerCase() || "unnamed"}`,
    label,
    hiddenLabel: raw.hiddenLabel === true,
    order: normalizeOrder(raw.order),
    enabled: raw.enabled !== false,
    hidden: raw.hidden === true,
    items: Object.freeze(items),
  });
}

export function createNavigationService(options = {}) {
  const eventBus = options.eventBus ?? null;

  let datasets = options.datasets ?? null;
  let destroyed = false;

  const sources = new Map();
  const cache = new Map();
  const activeListeners = new Set();
  const disposers = [];

  let activeItem = null;
  let activeRouteInfo = null;

  function emit(event, payload) {
    try {
      eventBus?.emit?.(event, payload);
    } catch (error) {
      console.error("[HoyoAO Navigation] Event emission failed.", error);
    }
  }

  function notifyActiveListeners(payload) {
    for (const listener of Array.from(activeListeners)) {
      try {
        listener(payload);
      } catch (error) {
        console.error("[HoyoAO Navigation] Active listener failed.", error);
      }
    }
  }

  function invalidate() {
    cache.clear();
  }

  function sourceMatchesLocation(source, location) {
    if (!source.location || source.location === "all") {
      return true;
    }

    return ensureArray(source.location).some(
      (sourceLocation) => normalizeLocation(sourceLocation) === location,
    );
  }

  function getDefaultRawGroups(location) {
    if (location === NAVIGATION_LOCATIONS.MENU) {
      const menu = datasets?.navigation?.menu;

      if (!menu) {
        return [];
      }

      if (Array.isArray(menu)) {
        return [menu];
      }

      return ensureArray(menu.groups);
    }

    if (location === NAVIGATION_LOCATIONS.FOOTER) {
      const links = datasets?.site?.footer?.links ?? [];

      if (links.length === 0) {
        return [];
      }

      return [
        {
          id: "footer-links",
          label: "",
          hiddenLabel: true,
          order: 100,
          items: links,
        },
      ];
    }

    return [];
  }

  function getCustomRawGroups(location) {
    const rawGroups = [];

    for (const source of sources.values()) {
      if (!sourceMatchesLocation(source, location)) {
        continue;
      }

      try {
        if (typeof source.getGroups === "function") {
          rawGroups.push(...ensureArray(source.getGroups(datasets, location)));
        } else if (typeof source.getItems === "function") {
          rawGroups.push({
            id: `source:${source.id}`,
            label: "",
            hiddenLabel: true,
            order: normalizeOrder(source.order),
            items: ensureArray(source.getItems(datasets, location)),
          });
        }
      } catch (error) {
        console.error(
          `[HoyoAO Navigation] Custom source "${source.id}" failed.`,
          error,
        );
      }
    }

    return rawGroups;
  }

  function getRawGroups(location) {
    return [
      ...getDefaultRawGroups(location),
      ...getCustomRawGroups(location),
    ];
  }

  function getNormalizedGroups(location) {
    const normalizedLocation = normalizeLocation(location);

    if (cache.has(normalizedLocation)) {
      return cache.get(normalizedLocation);
    }

    const rawGroups = getRawGroups(normalizedLocation);

    const groups = rawGroups
      .map((rawGroup) => normalizeGroup(rawGroup, normalizedLocation))
      .filter(Boolean);

    groups.sort(compareEntries);

    const frozenGroups = Object.freeze(groups);

    cache.set(normalizedLocation, frozenGroups);

    return frozenGroups;
  }

  function filterItem(item, includeHidden, includeDisabled) {
    if (!item) {
      return null;
    }

    if (!includeDisabled && !item.enabled) {
      return null;
    }

    if (!includeHidden && item.hidden) {
      return null;
    }

    const children = item.children
      .map((child) => filterItem(child, includeHidden, includeDisabled))
      .filter(Boolean);

    return {
      ...item,
      children,
    };
  }

  function getGroups(location, viewOptions = {}) {
    const groups = getNormalizedGroups(location);

    const includeHidden = viewOptions.includeHidden === true;
    const includeDisabled = viewOptions.includeDisabled === true;

    if (includeHidden && includeDisabled) {
      return groups;
    }

    const filteredGroups = groups
      .map((group) => {
        if (!includeDisabled && !group.enabled) {
          return null;
        }

        if (!includeHidden && group.hidden) {
          return null;
        }

        const items = group.items
          .map((item) => filterItem(item, includeHidden, includeDisabled))
          .filter(Boolean);

        if (items.length === 0) {
          return null;
        }

        return {
          ...group,
          items,
        };
      })
      .filter(Boolean);

    return Object.freeze(filteredGroups);
  }

  function getItems(location, viewOptions = {}) {
    const groups = getGroups(location, viewOptions);
    const items = [];

    function walk(list, depth) {
      for (const item of list) {
        const { children, ...rest } = item;

        items.push(
          Object.freeze({
            ...rest,
            depth,
            childrenCount: children?.length ?? 0,
          }),
        );

        if (children && children.length > 0) {
          walk(children, depth + 1);
        }
      }
    }

    for (const group of groups) {
      walk(group.items, 0);
    }

    return Object.freeze(items);
  }

  function getLocations() {
    const locations = new Set([
      NAVIGATION_LOCATIONS.MENU,
      NAVIGATION_LOCATIONS.FOOTER,
    ]);

    for (const source of sources.values()) {
      if (!source.location || source.location === "all") {
        continue;
      }

      for (const location of ensureArray(source.location)) {
        locations.add(normalizeLocation(location));
      }
    }

    return Array.from(locations);
  }

  function getItemById(id, location) {
    const targetId = toDisplayString(id);

    if (!targetId) {
      return null;
    }

    const locations = location
      ? [normalizeLocation(location)]
      : getLocations();

    for (const candidateLocation of locations) {
      const items = getItems(candidateLocation, {
        includeHidden: true,
        includeDisabled: true,
      });

      const found = items.find((item) => item.id === targetId);

      if (found) {
        return found;
      }
    }

    return null;
  }

  function extractRouteInfo(routeInfo) {
    if (!routeInfo) {
      return {
        route: null,
        pageId: null,
      };
    }

    if (typeof routeInfo === "string") {
      return {
        route: routePath(routeInfo),
        pageId: null,
      };
    }

    return {
      route: routePath(
        routeInfo.route ?? routeInfo.hash ?? routeInfo.path ?? null,
      ),
      pageId: routeInfo.pageId ?? null,
    };
  }

  function isItemActive(item, info) {
    if (!item || !info) {
      return false;
    }

    if (info.pageId && item.pageId && item.pageId === info.pageId) {
      return true;
    }

    if (!info.route) {
      return false;
    }

    if (item.route && routePath(item.route) === info.route) {
      return true;
    }

    if (item.href && routePath(item.href) === info.route) {
      return true;
    }

    return false;
  }

  function resolveActive(location, routeInfo) {
    const info = extractRouteInfo(routeInfo);

    const items = getItems(location, {
      includeHidden: false,
      includeDisabled: false,
    });

    for (const item of items) {
      if (isItemActive(item, info)) {
        return item;
      }
    }

    return null;
  }

  function setActiveRoute(routeInfo) {
    if (destroyed) {
      return null;
    }

    const info = extractRouteInfo(routeInfo);

    const resolved =
      resolveActive(NAVIGATION_LOCATIONS.MENU, info) ??
      resolveActive(NAVIGATION_LOCATIONS.FOOTER, info);

    const previous = activeItem;
    const changed = (previous?.id ?? null) !== (resolved?.id ?? null);

    activeItem = resolved;
    activeRouteInfo = info;

    if (changed) {
      const payload = Object.freeze({
        item: activeItem,
        previous,
        route: info,
      });

      notifyActiveListeners(payload);

      emit(NAVIGATION_EVENTS.ACTIVE_CHANGED, payload);
    }

    return activeItem;
  }

  function getActiveItem() {
    return activeItem;
  }

  function subscribeActive(listener, subscribeOptions = {}) {
    if (typeof listener !== "function") {
      throw new TypeError(
        "[HoyoAO Navigation] Active listener must be a function.",
      );
    }

    activeListeners.add(listener);

    if (subscribeOptions.immediate === true) {
      try {
        listener({
          item: activeItem,
          previous: null,
          route: activeRouteInfo,
        });
      } catch (error) {
        console.error("[HoyoAO Navigation] Active listener failed.", error);
      }
    }

    return () => {
      activeListeners.delete(listener);
    };
  }

  function setData(nextDatasets) {
    if (destroyed) {
      return;
    }

    datasets = nextDatasets ?? null;

    invalidate();

    if (activeRouteInfo) {
      setActiveRoute(activeRouteInfo);
    }

    emit(NAVIGATION_EVENTS.DATA_CHANGED, {
      datasets,
    });
  }

  function registerSource(source) {
    if (destroyed) {
      throw new Error("[HoyoAO Navigation] Navigation service is destroyed.");
    }

    if (!source?.id) {
      throw new TypeError(
        "[HoyoAO Navigation] Navigation source must have an id.",
      );
    }

    if (
      typeof source.getGroups !== "function" &&
      typeof source.getItems !== "function"
    ) {
      throw new TypeError(
        "[HoyoAO Navigation] Navigation source must implement getGroups() or getItems().",
      );
    }

    const id = toDisplayString(source.id);

    sources.set(id, {
      id,
      location: source.location ?? "all",
      order: normalizeOrder(source.order),
      getGroups: source.getGroups ?? null,
      getItems: source.getItems ?? null,
    });

    invalidate();

    if (activeRouteInfo) {
      setActiveRoute(activeRouteInfo);
    }

    return () => {
      sources.delete(id);
      invalidate();

      if (activeRouteInfo) {
        setActiveRoute(activeRouteInfo);
      }
    };
  }

  function registerDisposer(disposer) {
    if (typeof disposer === "function") {
      disposers.push(disposer);
    }
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    for (const disposer of disposers.splice(0)) {
      try {
        disposer();
      } catch (error) {
        console.error("[HoyoAO Navigation] Disposer failed.", error);
      }
    }

    sources.clear();
    cache.clear();
    activeListeners.clear();

    activeItem = null;
    activeRouteInfo = null;
  }

  return Object.freeze({
    getGroups,
    getItems,
    getLocations,
    getItemById,
    getMenu(viewOptions) {
      return getGroups(NAVIGATION_LOCATIONS.MENU, viewOptions);
    },
    getFooter(viewOptions) {
      return getGroups(NAVIGATION_LOCATIONS.FOOTER, viewOptions);
    },
    getFlatItems(location, viewOptions) {
      return getItems(location, viewOptions);
    },
    resolveActive,
    setActiveRoute,
    getActiveItem,
    subscribeActive,
    setData,
    registerSource,
    registerDisposer,
    destroy,
  });
}

export function createNavigationServiceFromContext(context) {
  const service = createNavigationService({
    datasets: context?.data ?? null,
    eventBus: context?.eventBus ?? null,
  });

  if (context?.eventBus?.on) {
    const disposeRouteListener = context.eventBus.on(
      APP_EVENTS.ROUTE_CHANGED,
      (payload) => {
        service.setActiveRoute(payload?.to ?? payload?.route ?? payload);
      },
    );

    service.registerDisposer(disposeRouteListener);
  }

  return service;
}

export default createNavigationService; 
