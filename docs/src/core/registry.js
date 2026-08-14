export const REGISTRY_NAMESPACES = Object.freeze({
  FEATURE: "feature",
  PAGE: "page",
  PANEL: "panel",
  MODAL: "modal",
  CARD: "card",
  DASHBOARD_WIDGET: "dashboard-widget",
  NAVIGATION_ITEM: "navigation-item",
  SEARCH_SOURCE: "search-source",
  RENDERER: "renderer",
  SERVICE: "service",
});

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function normalizeType(type) {
  if (!isNonEmptyString(type)) {
    throw new TypeError("[HoyoAO Registry] Registry type must be a non-empty string.");
  }

  return type.trim().toLowerCase();
}

function normalizeId(id) {
  if (!isNonEmptyString(id)) {
    throw new TypeError("[HoyoAO Registry] Registry item id must be a non-empty string.");
  }

  return id.trim();
}

export function defineRegistryItem(type, definition) {
  const normalizedType = normalizeType(type);

  if (!isPlainObject(definition)) {
    throw new TypeError("[HoyoAO Registry] Registry item definition must be an object.");
  }

  const id = normalizeId(definition.id);

  const order = Number.isFinite(definition.order)
    ? Number(definition.order)
    : 100;

  const tags = Array.isArray(definition.tags)
    ? Object.freeze(definition.tags.filter(isNonEmptyString))
    : Object.freeze([]);

  const data = isPlainObject(definition.data)
    ? Object.freeze({ ...definition.data })
    : Object.freeze({});

  return Object.freeze({
    type: normalizedType,
    id,
    label: isNonEmptyString(definition.label) ? definition.label : id,
    order,
    enabled: definition.enabled !== false,
    predicate:
      typeof definition.predicate === "function" ? definition.predicate : null,
    mount: typeof definition.mount === "function" ? definition.mount : null,
    unmount:
      typeof definition.unmount === "function" ? definition.unmount : null,
    tags,
    data,
    source: Object.freeze({ ...definition }),
  });
}

export function createRegistry(options = {}) {
  const registryName = isNonEmptyString(options.name)
    ? options.name.trim()
    : "default";

  const stopOnError = options.stopOnError === true;
  const byType = new Map();
  const mountedEntries = new Map();

  let mountOrder = [];
  let destroyed = false;

  function handleError(error, meta) {
    if (typeof options.onError === "function") {
      options.onError(error, meta);
      return;
    }

    console.error(`[HoyoAO Registry:${registryName}]`, meta, error);
  }

  function ensureActive() {
    if (destroyed) {
      throw new Error(`[HoyoAO Registry:${registryName}] Registry is destroyed.`);
    }
  }

  function getTypeMap(type, createIfMissing = false) {
    const normalizedType = normalizeType(type);
    let typeMap = byType.get(normalizedType);

    if (!typeMap && createIfMissing) {
      typeMap = new Map();
      byType.set(normalizedType, typeMap);
    }

    return typeMap ?? null;
  }

  function getEntry(type, id) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(id);
    const typeMap = byType.get(normalizedType);

    if (!typeMap) {
      return null;
    }

    return typeMap.get(normalizedId) ?? null;
  }

  function isEntryEnabled(entry, context) {
    if (!entry || entry.enabled === false) {
      return false;
    }

    if (typeof entry.predicate !== "function") {
      return true;
    }

    try {
      return Boolean(entry.predicate(context, entry));
    } catch (error) {
      handleError(error, {
        phase: "predicate",
        type: entry.type,
        id: entry.id,
      });

      return false;
    }
  }

  function register(type, definition) {
    ensureActive();

    const entry = defineRegistryItem(type, definition);
    const typeMap = getTypeMap(entry.type, true);

    if (typeMap.has(entry.id)) {
      throw new Error(
        `[HoyoAO Registry:${registryName}] Item "${entry.id}" is already registered in "${entry.type}".`,
      );
    }

    typeMap.set(entry.id, entry);

    return () => {
      void unregister(entry.type, entry.id);
    };
  }

  async function unregister(type, id) {
    const entry = getEntry(type, id);

    if (!entry) {
      return false;
    }

    await unmountEntry(entry);

    const typeMap = byType.get(entry.type);

    if (typeMap) {
      typeMap.delete(entry.id);

      if (typeMap.size === 0) {
        byType.delete(entry.type);
      }
    }

    return true;
  }

  function has(type, id) {
    try {
      return Boolean(getEntry(type, id));
    } catch {
      return false;
    }
  }

  function get(type, id) {
    try {
      return getEntry(type, id);
    } catch {
      return null;
    }
  }

  function getAll(type) {
    let entries = [];

    if (type === undefined || type === null) {
      for (const typeMap of byType.values()) {
        entries.push(...typeMap.values());
      }
    } else {
      const typeMap = getTypeMap(type);

      if (typeMap) {
        entries.push(...typeMap.values());
      }
    }

    entries.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }

      return a.id.localeCompare(b.id);
    });

    return entries;
  }

  function getEnabled(type, context) {
    const entries =
      type === undefined || type === null ? getAll() : getAll(type);

    return entries.filter((entry) => isEntryEnabled(entry, context));
  }

  function query(type, predicate) {
    if (typeof predicate !== "function") {
      throw new TypeError("[HoyoAO Registry] Query predicate must be a function.");
    }

    const entries =
      type === undefined || type === null ? getAll() : getAll(type);

    return entries.filter((entry) => {
      try {
        return Boolean(predicate(entry));
      } catch (error) {
        handleError(error, {
          phase: "query",
          type: entry.type,
          id: entry.id,
        });

        return false;
      }
    });
  }

  function hasTag(type, id, tag) {
    const entry = get(type, id);

    if (!entry || !isNonEmptyString(tag)) {
      return false;
    }

    return entry.tags.includes(tag.trim());
  }

  async function mount(type, id, context) {
    ensureActive();

    const entry = getEntry(type, id);

    if (!entry) {
      throw new Error(
        `[HoyoAO Registry:${registryName}] Cannot mount unknown item "${id}" in "${normalizeType(type)}".`,
      );
    }

    if (!isEntryEnabled(entry, context)) {
      return null;
    }

    if (mountedEntries.has(entry)) {
      return mountedEntries.get(entry).controller ?? null;
    }

    let controller = null;
    let cleanup = null;

    if (typeof entry.mount === "function") {
      try {
        const result = await entry.mount(context, entry);

        if (typeof result === "function") {
          cleanup = result;
        } else {
          controller = result ?? null;
        }
      } catch (error) {
        handleError(error, {
          phase: "mount",
          type: entry.type,
          id: entry.id,
        });

        if (stopOnError) {
          throw error;
        }

        return null;
      }
    }

    mountedEntries.set(entry, {
      entry,
      context,
      controller,
      cleanup,
    });

    mountOrder.push(entry);

    return controller;
  }

  async function unmountEntry(entry) {
    const record = mountedEntries.get(entry);

    if (!record) {
      return false;
    }

    mountedEntries.delete(entry);
    mountOrder = mountOrder.filter((mountedEntry) => mountedEntry !== entry);

    try {
      if (typeof entry.unmount === "function") {
        await entry.unmount(record.context, record.controller, entry);
      } else if (typeof record.cleanup === "function") {
        await record.cleanup(record.context, record.controller, entry);
      } else if (
        record.controller &&
        typeof record.controller.destroy === "function"
      ) {
        await record.controller.destroy();
      }
    } catch (error) {
      handleError(error, {
        phase: "unmount",
        type: entry.type,
        id: entry.id,
      });

      return false;
    }

    return true;
  }

  async function unmount(type, id) {
    const entry = getEntry(type, id);

    if (!entry) {
      return false;
    }

    return unmountEntry(entry);
  }

  async function mountAll(type, context) {
    ensureActive();

    const entries =
      type === undefined || type === null
        ? getEnabled(undefined, context)
        : getEnabled(type, context);

    const results = [];

    for (const entry of entries) {
      try {
        results.push(await mount(entry.type, entry.id, context));
      } catch (error) {
        handleError(error, {
          phase: "mount-all",
          type: entry.type,
          id: entry.id,
        });

        if (stopOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  async function unmountAll(type) {
    const normalizedType =
      type === undefined || type === null ? null : normalizeType(type);

    const entries = [...mountOrder]
      .reverse()
      .filter((entry) => !normalizedType || entry.type === normalizedType);

    for (const entry of entries) {
      await unmountEntry(entry);
    }
  }

  function isMounted(type, id) {
    const entry = get(type, id);

    if (!entry) {
      return false;
    }

    return mountedEntries.has(entry);
  }

  function getMounted(type, id) {
    const entry = get(type, id);

    if (!entry) {
      return null;
    }

    return mountedEntries.get(entry)?.controller ?? null;
  }

  function types() {
    return Array.from(byType.keys());
  }

  function count(type) {
    if (type === undefined || type === null) {
      let total = 0;

      for (const typeMap of byType.values()) {
        total += typeMap.size;
      }

      return total;
    }

    return getTypeMap(type)?.size ?? 0;
  }

  function mountedCount() {
    return mountedEntries.size;
  }

  function isDestroyed() {
    return destroyed;
  }

  async function clear(type) {
    if (type === undefined || type === null) {
      await unmountAll();
      byType.clear();
      return;
    }

    const normalizedType = normalizeType(type);

    await unmountAll(normalizedType);
    byType.delete(normalizedType);
  }

  async function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    await unmountAll();

    byType.clear();
    mountedEntries.clear();
    mountOrder = [];
  }

  return Object.freeze({
    name: registryName,
    register,
    unregister,
    has,
    get,
    getAll,
    getEnabled,
    query,
    hasTag,
    mount,
    unmount,
    mountAll,
    unmountAll,
    isMounted,
    getMounted,
    types,
    count,
    mountedCount,
    isDestroyed,
    clear,
    destroy,
  });
}

export default createRegistry; 
