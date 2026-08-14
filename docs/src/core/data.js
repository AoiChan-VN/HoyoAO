import {
  APP_EVENTS,
  DATA_ENDPOINTS,
  DATA_KEYS,
  DATA_PROVIDERS,
  DEFAULTS,
} from "./constants.js";

const PROJECT_ROOT_URL = new URL("../../", import.meta.url);
const jsonCache = new Map();

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function isAbsoluteUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(String(value));
}

function ensureTrailingSlash(value) {
  const url = String(value);

  return url.endsWith("/") ? url : `${url}/`;
}

function normalizeEndpoint(endpoint) {
  const normalized = String(endpoint ?? "").trim();

  if (!normalized) {
    throw new Error("[HoyoAO] Data endpoint must be a non-empty string.");
  }

  return normalized;
}

function resolveLocalUrl(endpoint) {
  const normalized = normalizeEndpoint(endpoint);

  if (isAbsoluteUrl(normalized)) {
    return normalized;
  }

  const clean = normalized.replace(/^\.\//, "").replace(/^\/+/, "");

  return new URL(clean, PROJECT_ROOT_URL).href;
}

function resolveApiUrl(endpoint, baseUrl) {
  const normalized = normalizeEndpoint(endpoint);

  if (isAbsoluteUrl(normalized)) {
    return normalized;
  }

  if (!baseUrl) {
    throw new Error(
      "[HoyoAO] API data provider requires baseUrl for relative endpoints.",
    );
  }

  const clean = normalized.replace(/^\.?\//, "");

  return new URL(clean, ensureTrailingSlash(baseUrl)).href;
}

function assertObject(value, label) {
  if (!isPlainObject(value)) {
    throw new Error(`[HoyoAO] ${label} must be a valid object.`);
  }
}

async function requestJson(url, options = {}) {
  const fetchFn = options.fetchFn ?? globalThis.fetch?.bind(globalThis);

  if (typeof fetchFn !== "function") {
    throw new Error("[HoyoAO] Fetch API is not available.");
  }

  const timeoutMs = options.timeoutMs ?? DEFAULTS.FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener(
        "abort",
        () => {
          controller.abort();
        },
        { once: true },
      );
    }
  }

  try {
    const response = await fetchFn(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      credentials: "same-origin",
      cache: "default",
    });

    if (!response.ok) {
      throw new Error(
        `[HoyoAO] Request failed with status ${response.status} for ${url}.`,
      );
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error(`[HoyoAO] Invalid JSON response from ${url}.`);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      if (options.signal?.aborted) {
        throw new Error(`[HoyoAO] Request aborted for ${url}.`);
      }

      throw new Error(
        `[HoyoAO] Request timed out after ${timeoutMs}ms for ${url}.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function fetchJson(url, options = {}) {
  const cacheEnabled = (options.cache ?? true) && !options.signal;

  if (!cacheEnabled) {
    return requestJson(url, options);
  }

  if (!jsonCache.has(url)) {
    const promise = requestJson(url, options).catch((error) => {
      jsonCache.delete(url);
      throw error;
    });

    jsonCache.set(url, promise);
  }

  return jsonCache.get(url);
}

export function clearDataCache() {
  jsonCache.clear();
}

export function createDataProvider(config = {}) {
  const provider = config.provider ?? DATA_PROVIDERS.LOCAL;
  const endpoints = {
    ...DATA_ENDPOINTS,
    ...config.endpoints,
  };
  const cache = config.cache ?? true;
  const baseUrl = config.baseUrl ?? null;
  const timeoutMs = config.timeoutMs ?? DEFAULTS.FETCH_TIMEOUT_MS;
  const fetchFn = config.fetchFn;
  const memoryData = config.memoryData ?? {};

  async function load(key, options = {}) {
    const endpoint = endpoints[key];

    if (provider === DATA_PROVIDERS.MEMORY) {
      const value = memoryData[key];

      if (value === undefined) {
        throw new Error(
          `[HoyoAO] Memory data provider has no value for "${key}".`,
        );
      }

      const resolved = typeof value?.then === "function" ? await value : value;

      if (typeof structuredClone === "function") {
        return structuredClone(resolved);
      }

      return resolved;
    }

    if (!endpoint) {
      throw new Error(`[HoyoAO] No endpoint defined for data key "${key}".`);
    }

    if (provider === DATA_PROVIDERS.LOCAL) {
      const url = resolveLocalUrl(endpoint);

      return fetchJson(url, {
        cache: options.cache ?? cache,
        timeoutMs: options.timeoutMs ?? timeoutMs,
        signal: options.signal,
        fetchFn,
      });
    }

    if (provider === DATA_PROVIDERS.API) {
      const url = resolveApiUrl(endpoint, baseUrl);

      return fetchJson(url, {
        cache: options.cache ?? cache,
        timeoutMs: options.timeoutMs ?? timeoutMs,
        signal: options.signal,
        fetchFn,
      });
    }

    throw new Error(`[HoyoAO] Unsupported data provider "${provider}".`);
  }

  async function loadAll(options = {}) {
    const [site, pages, navigation] = await Promise.all([
      load(DATA_KEYS.SITE, options),
      load(DATA_KEYS.PAGES, options),
      load(DATA_KEYS.NAVIGATION, options),
    ]);

    return {
      site,
      pages,
      navigation,
    };
  }

  return Object.freeze({
    provider,
    endpoints,
    load,
    loadAll,
  });
}

export function createLocalDataProvider(options = {}) {
  return createDataProvider({
    ...options,
    provider: DATA_PROVIDERS.LOCAL,
  });
}

export function createApiDataProvider(options = {}) {
  return createDataProvider({
    ...options,
    provider: DATA_PROVIDERS.API,
  });
}

function extractDataConfig(site) {
  const service = site?.services?.data ?? {};

  const baseUrl =
    service.baseUrl ??
    (typeof service.basePath === "string" && isAbsoluteUrl(service.basePath)
      ? service.basePath
      : null);

  return {
    provider: service.provider ?? DATA_PROVIDERS.LOCAL,
    endpoints: {
      ...DATA_ENDPOINTS,
      ...service.endpoints,
    },
    baseUrl,
    cache: service.cache ?? true,
    timeoutMs: service.timeoutMs ?? DEFAULTS.FETCH_TIMEOUT_MS,
  };
}

function validateSite(site) {
  assertObject(site, "site.json");

  if (!site.siteId && !site.name) {
    throw new Error("[HoyoAO] site.json must define siteId or name.");
  }

  if (site.services !== undefined) {
    assertObject(site.services, "site.json services");
  }

  if (site.services?.data !== undefined) {
    assertObject(site.services.data, "site.json services.data");
  }

  if (site.features !== undefined) {
    assertObject(site.features, "site.json features");
  }

  if (site.i18n !== undefined) {
    assertObject(site.i18n, "site.json i18n");
  }
}

function validatePages(pages) {
  assertObject(pages, "pages.json");

  if (!Array.isArray(pages.pages)) {
    throw new Error("[HoyoAO] pages.json must contain a pages array.");
  }

  const ids = new Set();

  pages.pages.forEach((page, index) => {
    assertObject(page, `pages.json pages[${index}]`);

    if (typeof page.id !== "string" || !page.id) {
      throw new Error(`[HoyoAO] pages.json pages[${index}] must have an id.`);
    }

    if (ids.has(page.id)) {
      throw new Error(
        `[HoyoAO] pages.json contains duplicate page id "${page.id}".`,
      );
    }

    ids.add(page.id);

    if (typeof page.route !== "string" || !page.route) {
      throw new Error(
        `[HoyoAO] pages.json page "${page.id}" must have a route.`,
      );
    }

    if (typeof page.label !== "string" || !page.label) {
      throw new Error(
        `[HoyoAO] pages.json page "${page.id}" must have a label.`,
      );
    }
  });

  if (typeof pages.defaultPageId !== "string" || !pages.defaultPageId) {
    throw new Error("[HoyoAO] pages.json must define defaultPageId.");
  }

  if (!ids.has(pages.defaultPageId)) {
    throw new Error(
      `[HoyoAO] pages.json defaultPageId "${pages.defaultPageId}" does not exist.`,
    );
  }

  if (pages.fallbackPageId && !ids.has(pages.fallbackPageId)) {
    throw new Error(
      `[HoyoAO] pages.json fallbackPageId "${pages.fallbackPageId}" does not exist.`,
    );
  }

  if (pages.router?.notFoundPageId && !ids.has(pages.router.notFoundPageId)) {
    throw new Error(
      `[HoyoAO] pages.json router.notFoundPageId "${pages.router.notFoundPageId}" does not exist.`,
    );
  }
}

function validateNavigation(data) {
  assertObject(data.navigation, "navigation.json");
  assertObject(data.navigation.menu, "navigation.json menu");

  const menu = data.navigation.menu;

  if (menu.groups !== undefined && !Array.isArray(menu.groups)) {
    throw new Error("[HoyoAO] navigation.json menu.groups must be an array.");
  }

  const pageIds = new Set(data.pages.pages.map((page) => page.id));
  const groups = Array.isArray(menu.groups) ? menu.groups : [];

  groups.forEach((group, groupIndex) => {
    assertObject(group, `navigation.json groups[${groupIndex}]`);

    if (group.items !== undefined && !Array.isArray(group.items)) {
      throw new Error(
        `[HoyoAO] navigation.json groups[${groupIndex}].items must be an array.`,
      );
    }

    const items = Array.isArray(group.items) ? group.items : [];

    items.forEach((item, itemIndex) => {
      assertObject(
        item,
        `navigation.json groups[${groupIndex}].items[${itemIndex}]`,
      );

      if (typeof item.id !== "string" || !item.id) {
        throw new Error(
          `[HoyoAO] navigation.json groups[${groupIndex}].items[${itemIndex}] must have an id.`,
        );
      }

      if (item.enabled === false) {
        return;
      }

      if (item.type === "page" && item.pageId && !pageIds.has(item.pageId)) {
        throw new Error(
          `[HoyoAO] navigation item "${item.id}" references unknown pageId "${item.pageId}".`,
        );
      }
    });
  });
}

function validateAppData(data) {
  validateSite(data.site);
  validatePages(data.pages);
  validateNavigation(data);
}

function emit(context, event, payload) {
  try {
    context?.eventBus?.emit?.(event, payload);
  } catch (error) {
    console.error("[HoyoAO] Data layer event emission failed.", error);
  }
}

export async function loadAppData(context = {}) {
  emit(context, APP_EVENTS.DATA_BEFORE_LOAD, {
    source: "data-layer",
  });

  try {
    const initialProvider =
      context.services?.dataProvider ??
      createDataProvider({
        cache: true,
      });

    const site = await initialProvider.load(DATA_KEYS.SITE, {
      signal: context.signal,
    });

    validateSite(site);

    const dataConfig = extractDataConfig(site);

    const provider =
      context.services?.dataProvider ??
      createDataProvider({
        ...dataConfig,
        fetchFn: context.services?.fetch,
      });

    const [pages, navigation] = await Promise.all([
      provider.load(DATA_KEYS.PAGES, {
        signal: context.signal,
      }),
      provider.load(DATA_KEYS.NAVIGATION, {
        signal: context.signal,
      }),
    ]);

    const data = {
      site,
      pages,
      navigation,
    };

    validateAppData(data);

    emit(context, APP_EVENTS.DATA_LOADED, {
      data,
    });

    return data;
  } catch (error) {
    emit(context, APP_EVENTS.DATA_LOAD_ERROR, {
      error,
    });

    throw error;
  }
} 
