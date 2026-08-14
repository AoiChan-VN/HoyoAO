import {
  DATA_ENDPOINTS,
  DATA_KEYS,
  DATA_PROVIDERS,
  DEFAULTS,
} from "../../core/constants.js";

import {
  createDataProvider as createCoreDataProvider,
  loadAppData,
  clearDataCache,
} from "../../core/data.js";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function normalizeDataKey(key) {
  const normalized = String(key ?? "").trim();

  if (!Object.values(DATA_KEYS).includes(normalized)) {
    throw new Error(`[HoyoAO Data Service] Unknown data key "${key}".`);
  }

  return normalized;
}

export function createDataService(options = {}) {
  const eventBus = options.eventBus ?? null;
  const fetchFn = options.fetchFn ?? null;

  const serviceOptions = {
    provider: options.provider ?? null,
    endpoints: options.endpoints ?? null,
    baseUrl: options.baseUrl ?? null,
    cache: options.cache,
    timeoutMs: options.timeoutMs,
    config: isPlainObject(options.config) ? options.config : {},
  };

  let datasets = isPlainObject(options.initialData)
    ? options.initialData
    : null;

  let provider = null;
  let loadingPromise = null;
  let destroyed = false;

  const listeners = new Set();

  function getConfig() {
    const configLayer = serviceOptions.config ?? {};

    return {
      provider:
        configLayer.provider ??
        serviceOptions.provider ??
        DATA_PROVIDERS.LOCAL,
      endpoints: {
        ...DATA_ENDPOINTS,
        ...configLayer.endpoints,
        ...serviceOptions.endpoints,
      },
      baseUrl:
        configLayer.baseUrl ?? serviceOptions.baseUrl ?? null,
      cache: configLayer.cache ?? serviceOptions.cache ?? true,
      timeoutMs:
        configLayer.timeoutMs ??
        serviceOptions.timeoutMs ??
        DEFAULTS.FETCH_TIMEOUT_MS,
      fetchFn,
      memoryData: datasets ?? options.memoryData ?? undefined,
    };
  }

  function ensureActive() {
    if (destroyed) {
      throw new Error("[HoyoAO Data Service] Data service is destroyed.");
    }
  }

  function ensureProvider() {
    ensureActive();

    if (!provider) {
      provider = createCoreDataProvider(getConfig());
    }

    return provider;
  }

  function syncProviderFromSite() {
    const siteDataConfig = datasets?.site?.services?.data ?? {};

    provider = createCoreDataProvider({
      ...getConfig(),
      ...siteDataConfig,
      endpoints: {
        ...DATA_ENDPOINTS,
        ...getConfig().endpoints,
        ...siteDataConfig.endpoints,
      },
      memoryData: datasets ?? undefined,
    });
  }

  function notify(action, payload) {
    for (const listener of Array.from(listeners)) {
      try {
        listener({
          action,
          service: "data",
          timestamp: Date.now(),
          ...payload,
        });
      } catch (error) {
        console.error("[HoyoAO Data Service] Listener failed.", error);
      }
    }
  }

  async function loadAll(loadOptions = {}) {
    ensureActive();

    const force = loadOptions.force === true;

    if (datasets && !force) {
      if (!provider) {
        syncProviderFromSite();
      }

      return datasets;
    }

    if (loadingPromise && !force) {
      return loadingPromise;
    }

    const context = {
      eventBus,
      signal: loadOptions.signal,
      services: {
        dataProvider: ensureProvider(),
        fetch: fetchFn,
      },
    };

    loadingPromise = (async () => {
      try {
        const data = await loadAppData(context);

        datasets = data;

        syncProviderFromSite();

        notify("loaded", {
          data,
        });

        return data;
      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  async function load(key, loadOptions = {}) {
    ensureActive();

    const normalizedKey = normalizeDataKey(key);
    const force = loadOptions.force === true;

    if (datasets && datasets[normalizedKey] !== undefined && !force) {
      if (!provider) {
        syncProviderFromSite();
      }

      return datasets[normalizedKey];
    }

    const currentProvider = ensureProvider();

    const value = await currentProvider.load(normalizedKey, {
      signal: loadOptions.signal,
      cache: force ? false : undefined,
      timeoutMs: loadOptions.timeoutMs,
    });

    datasets = {
      ...(datasets ?? {}),
      [normalizedKey]: value,
    };

    if (normalizedKey === DATA_KEYS.SITE) {
      syncProviderFromSite();
    }

    notify("refreshed", {
      key: normalizedKey,
      value,
    });

    return value;
  }

  function get(key) {
    try {
      const normalizedKey = normalizeDataKey(key);

      return datasets?.[normalizedKey] ?? null;
    } catch {
      return null;
    }
  }

  function getSite() {
    return get(DATA_KEYS.SITE);
  }

  function getPages() {
    return get(DATA_KEYS.PAGES);
  }

  function getNavigation() {
    return get(DATA_KEYS.NAVIGATION);
  }

  function has(key) {
    try {
      const normalizedKey = normalizeDataKey(key);

      return datasets?.[normalizedKey] !== undefined;
    } catch {
      return false;
    }
  }

  function isReady() {
    return Boolean(
      datasets?.[DATA_KEYS.SITE] &&
        datasets?.[DATA_KEYS.PAGES] &&
        datasets?.[DATA_KEYS.NAVIGATION],
    );
  }

  function hydrate(data) {
    ensureActive();

    if (!isPlainObject(data)) {
      throw new TypeError(
        "[HoyoAO Data Service] hydrate expects a plain object dataset.",
      );
    }

    datasets = data;

    syncProviderFromSite();

    notify("hydrated", {
      data,
    });
  }

  function setProvider(providerName, providerOptions = {}) {
    ensureActive();

    serviceOptions.provider = providerName;
    serviceOptions.config = {
      ...serviceOptions.config,
      ...providerOptions,
    };

    provider = null;

    if (options.clearCacheOnProviderChange !== false) {
      clearDataCache();
    }

    notify("provider-changed", {
      provider: providerName,
    });
  }

  function getProviderName() {
    return getConfig().provider;
  }

  function clearCache() {
    clearDataCache();

    provider = null;

    notify("cache-cleared", {});
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError(
        "[HoyoAO Data Service] Listener must be a function.",
      );
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    listeners.clear();

    provider = null;
    loadingPromise = null;
  }

  return Object.freeze({
    loadAll,
    load,
    get,
    getSite,
    getPages,
    getNavigation,
    has,
    isReady,
    hydrate,
    setProvider,
    getProviderName,
    clearCache,
    subscribe,
    destroy,
  });
}

export function createDataServiceFromContext(context) {
  const dataConfig = context?.config?.services?.data ?? {};

  return createDataService({
    eventBus: context?.eventBus ?? null,
    fetchFn: context?.services?.fetch ?? null,
    initialData: context?.data ?? null,
    config: dataConfig,
  });
}

export function createLocalDataService(options = {}) {
  return createDataService({
    ...options,
    provider: DATA_PROVIDERS.LOCAL,
  });
}

export function createApiDataService(options = {}) {
  return createDataService({
    ...options,
    provider: DATA_PROVIDERS.API,
  });
}

export default createDataService; 
