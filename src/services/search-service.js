import { APP_EVENTS } from "../../core/constants.js";

export const SEARCH_PROVIDERS = Object.freeze({
  LOCAL: "local",
  API: "api",
  CUSTOM: "custom",
});

export const SEARCH_RESULT_TYPES = Object.freeze({
  PAGE: "page",
  NAVIGATION: "navigation",
  SITE: "site",
  RESULT: "result",
});

const DEFAULT_MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_RESULTS = 12;
const MAX_RESULT_LIMIT = 50;

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function foldDiacritics(value) {
  try {
    return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  } catch {
    return value;
  }
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

function toKeywordString(value) {
  const text = toDisplayString(value);

  if (!text) {
    return "";
  }

  return foldDiacritics(text.toLowerCase());
}

function normalizeQuery(rawQuery) {
  return toKeywordString(rawQuery);
}

function tokenize(query) {
  return String(query ?? "")
    .split(/\s+/)
    .filter(Boolean);
}

function createAbortError() {
  const error = new Error("Search request aborted.");
  error.name = "AbortError";

  return error;
}

function toSearchEntry(raw, source) {
  if (!isPlainObject(raw)) {
    return null;
  }

  const title = toDisplayString(raw.title ?? raw.label ?? raw.name);

  if (!title) {
    return null;
  }

  const id = toDisplayString(raw.id) || `${source}:${title.toLowerCase()}`;
  const orderValue = Number(raw.order);

  return {
    id,
    source,
    type: toDisplayString(raw.type) || SEARCH_RESULT_TYPES.RESULT,
    title,
    subtitle: toDisplayString(raw.subtitle ?? raw.description),
    description: toDisplayString(raw.description ?? raw.subtitle),
    keywordsText: toKeywordString(raw.keywords ?? raw.tags),
    route: raw.route ?? raw.href ?? null,
    pageId: raw.pageId ?? null,
    icon: raw.icon ?? null,
    order: Number.isFinite(orderValue) ? orderValue : 100,
  };
}

function buildDefaultEntries(datasets) {
  const entries = [];

  const pagesData = datasets?.pages;
  const pages = Array.isArray(pagesData?.pages) ? pagesData.pages : [];

  for (const page of pages) {
    if (!page || page.hidden === true || page.enabled === false) {
      continue;
    }

    const entry = toSearchEntry(
      {
        id: `page:${page.id}`,
        type: SEARCH_RESULT_TYPES.PAGE,
        title: page.label,
        subtitle: page.description,
        description: page.description,
        keywords: page.keywords,
        route: page.route,
        pageId: page.id,
        icon: page.icon,
        order: page.order,
      },
      "pages",
    );

    if (entry) {
      entries.push(entry);
    }
  }

  const navigationGroups = datasets?.navigation?.menu?.groups ?? [];

  for (const group of navigationGroups) {
    if (!group || group.hidden === true || group.enabled === false) {
      continue;
    }

    const items = Array.isArray(group.items) ? group.items : [];

    for (const item of items) {
      if (!item || item.hidden === true || item.enabled === false) {
        continue;
      }

      if (!item.route && !item.pageId) {
        continue;
      }

      const entry = toSearchEntry(
        {
          id: `navigation:${item.id}`,
          type: SEARCH_RESULT_TYPES.NAVIGATION,
          title: item.label,
          subtitle: item.description,
          description: item.description,
          keywords: item.keywords ?? item.label,
          route: item.route ?? null,
          pageId: item.pageId ?? null,
          icon: item.icon,
          order: item.order,
        },
        "navigation",
      );

      if (entry) {
        entries.push(entry);
      }
    }
  }

  const site = datasets?.site;

  if (site?.name) {
    const defaultPage = pages.find(
      (page) =>
        page?.id === pagesData?.defaultPageId && page.enabled !== false,
    );

    const siteEntry = toSearchEntry(
      {
        id: "site:global",
        type: SEARCH_RESULT_TYPES.SITE,
        title: site.name,
        subtitle: site.tagline,
        description: site.meta?.description ?? site.tagline,
        keywords: [site.name, site.tagline, site.siteId].filter(Boolean),
        route: defaultPage?.route ?? "#/",
        pageId: defaultPage?.id ?? null,
        icon: "logo",
        order: 0,
      },
      "site",
    );

    if (siteEntry) {
      entries.push(siteEntry);
    }
  }

  return entries;
}

function scoreEntry(entry, query, tokens) {
  const title = toKeywordString(entry.title);
  const subtitle = toKeywordString(entry.subtitle);
  const description = toKeywordString(entry.description);
  const keywords = entry.keywordsText ?? "";

  if (!title) {
    return 0;
  }

  let score = 0;

  if (title === query) {
    score += 140;
  } else if (title.startsWith(query)) {
    score += 90;
  } else if (title.includes(query)) {
    score += 55;
  }

  if (keywords && keywords.includes(query)) {
    score += 28;
  }

  if (subtitle && subtitle.includes(query)) {
    score += 18;
  }

  if (description && description.includes(query)) {
    score += 12;
  }

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 16;
    }

    if (keywords.includes(token)) {
      score += 10;
    }

    if (subtitle.includes(token)) {
      score += 7;
    }

    if (description.includes(token)) {
      score += 4;
    }
  }

  return score;
}

function sortAndDedupe(results, limit) {
  const sorted = [...results].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.title.localeCompare(b.title);
  });

  const deduped = [];
  const seen = new Map();
  const positions = new Map();

  for (const result of sorted) {
    const key = result.pageId ? `page:${result.pageId}` : result.id;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, result);
      positions.set(key, deduped.length);
      deduped.push(result);
      continue;
    }

    const shouldReplace =
      (result.type === SEARCH_RESULT_TYPES.PAGE &&
        existing.type !== SEARCH_RESULT_TYPES.PAGE) ||
      result.score > existing.score;

    if (shouldReplace) {
      const index = positions.get(key);

      deduped[index] = result;
      seen.set(key, result);
    }
  }

  return deduped.slice(0, limit);
}

function normalizeResult(raw, source = "api") {
  const entry = toSearchEntry(raw, source);

  if (!entry) {
    return null;
  }

  const scoreValue = Number(raw?.score);

  return {
    ...entry,
    score: Number.isFinite(scoreValue) ? scoreValue : 0,
    data: raw?.data ?? raw?.payload ?? null,
  };
}

function normalizeApiPayload(payload) {
  let items = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (isPlainObject(payload)) {
    items =
      payload.results ??
      payload.items ??
      payload.entries ??
      payload.data ??
      [];
  }

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeResult(item, "api"))
    .filter(Boolean);
}

export function createSearchService(options = {}) {
  const settings = {
    provider: SEARCH_PROVIDERS.LOCAL,
    minQueryLength: DEFAULT_MIN_QUERY_LENGTH,
    maxResults: DEFAULT_MAX_RESULTS,
    endpoint: null,
    baseUrl: null,
    fetchFn: null,
    eventBus: null,
    datasets: null,
    executeSearch: null,
    useDefaultSources: true,
    ...options,
  };

  const customSources = new Map();

  let datasets = settings.datasets ?? null;
  let index = null;
  let destroyed = false;

  function emit(event, payload) {
    try {
      settings.eventBus?.emit?.(event, payload);
    } catch (error) {
      console.error("[HoyoAO Search] Event emission failed.", error);
    }
  }

  function ensureActive() {
    if (destroyed) {
      throw new Error("[HoyoAO Search] Search service is destroyed.");
    }
  }

  function buildIndex() {
    const entries = [];

    for (const source of customSources.values()) {
      try {
        const rawEntries = source.getEntries(datasets) ?? [];

        for (const rawEntry of rawEntries) {
          const entry = toSearchEntry(rawEntry, source.id);

          if (entry) {
            entries.push(entry);
          }
        }
      } catch (error) {
        console.error(
          `[HoyoAO Search] Custom source "${source.id}" failed.`,
          error,
        );
      }
    }

    if (settings.useDefaultSources !== false) {
      entries.push(...buildDefaultEntries(datasets));
    }

    index = entries;
  }

  function searchLocal(query, { limit, signal }) {
    if (!index) {
      buildIndex();
    }

    if (signal?.aborted) {
      throw createAbortError();
    }

    const tokens = tokenize(query);
    const scored = [];

    for (const entry of index) {
      if (signal?.aborted) {
        throw createAbortError();
      }

      const score = scoreEntry(entry, query, tokens);

      if (score > 0) {
        scored.push({
          ...entry,
          score,
        });
      }
    }

    return sortAndDedupe(scored, limit);
  }

  async function searchApi(query, { limit, signal }) {
    if (!settings.endpoint) {
      throw new Error(
        "[HoyoAO Search] API provider requires an endpoint configuration.",
      );
    }

    const fetchFn = settings.fetchFn ?? globalThis.fetch?.bind(globalThis);

    if (typeof fetchFn !== "function") {
      throw new Error("[HoyoAO Search] Fetch API is not available.");
    }

    const base =
      settings.baseUrl ?? globalThis.location?.href ?? "http://localhost/";

    const url = new URL(settings.endpoint, base);

    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const response = await fetchFn(url.toString(), {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `[HoyoAO Search] Search request failed with status ${response.status}.`,
      );
    }

    let payload;

    try {
      payload = await response.json();
    } catch {
      throw new Error("[HoyoAO Search] Search API returned invalid JSON.");
    }

    return normalizeApiPayload(payload);
  }

  async function search(rawQuery, searchOptions = {}) {
    if (destroyed) {
      return [];
    }

    const query = normalizeQuery(rawQuery);
    const minQueryLength = Number.isFinite(settings.minQueryLength)
      ? Math.max(0, settings.minQueryLength)
      : DEFAULT_MIN_QUERY_LENGTH;

    if (!query || query.length < minQueryLength) {
      return [];
    }

    const requestedLimit = Number(searchOptions.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(MAX_RESULT_LIMIT, Math.max(1, requestedLimit))
      : Math.max(1, settings.maxResults);

    const signal = searchOptions.signal;

    emit(APP_EVENTS.SEARCH_QUERY, {
      query,
      provider: settings.provider,
    });

    let rawResults;

    if (typeof settings.executeSearch === "function") {
      rawResults = await settings.executeSearch(query, {
        limit,
        signal,
        provider: settings.provider,
      });

      rawResults = Array.isArray(rawResults)
        ? rawResults
            .map((item) => normalizeResult(item, "custom"))
            .filter(Boolean)
        : [];
    } else if (settings.provider === SEARCH_PROVIDERS.API) {
      rawResults = await searchApi(query, {
        limit,
        signal,
      });
    } else {
      rawResults = searchLocal(query, {
        limit,
        signal,
      });
    }

    const results = Array.isArray(rawResults) ? rawResults : [];

    emit(APP_EVENTS.SEARCH_RESULTS_READY, {
      query,
      results,
      provider: settings.provider,
    });

    return results;
  }

  function clear() {
    emit(APP_EVENTS.SEARCH_CLEAR, {});
  }

  function setData(nextDatasets) {
    ensureActive();

    datasets = nextDatasets ?? null;
    index = null;
  }

  function registerSource(source) {
    ensureActive();

    if (!source?.id || typeof source.getEntries !== "function") {
      throw new TypeError(
        "[HoyoAO Search] Search source must have id and getEntries(datasets).",
      );
    }

    customSources.set(source.id, source);
    index = null;

    return () => {
      customSources.delete(source.id);
      index = null;
    };
  }

  function invalidate() {
    index = null;
  }

  function getProvider() {
    return settings.provider;
  }

  function isLocal() {
    return settings.provider === SEARCH_PROVIDERS.LOCAL;
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    customSources.clear();
    index = null;
    datasets = null;
  }

  return Object.freeze({
    search,
    clear,
    setData,
    registerSource,
    invalidate,
    getProvider,
    isLocal,
    destroy,
  });
}

export function createSearchServiceFromContext(context) {
  const searchConfig = context?.config?.services?.search ?? {};

  return createSearchService({
    provider: searchConfig.provider ?? SEARCH_PROVIDERS.LOCAL,
    minQueryLength: searchConfig.minQueryLength,
    maxResults: searchConfig.maxResults,
    endpoint: searchConfig.endpoint ?? null,
    baseUrl: searchConfig.baseUrl ?? null,
    fetchFn: context?.services?.fetch ?? null,
    eventBus: context?.eventBus ?? null,
    datasets: context?.data ?? null,
    useDefaultSources: true,
  });
}

export default createSearchService; 
