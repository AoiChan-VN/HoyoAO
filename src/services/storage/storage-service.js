import { STORAGE_PROVIDERS } from "../../core/constants.js";

const DEFAULT_NAMESPACE = "hoyoao";
const DEFAULT_SEPARATOR = ":";
const ENVELOPE_VERSION = 1;

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false
  );
}

function normalizeKey(key) {
  const normalized = String(key ?? "").trim();

  if (!normalized) {
    throw new TypeError("[HoyoAO Storage] Storage key must be a non-empty string.");
  }

  return normalized;
}

function createMemoryAdapter() {
  const store = new Map();

  return {
    get(key) {
      return store.has(key) ? store.get(key) : undefined;
    },

    set(key, value) {
      store.set(key, value);

      return true;
    },

    remove(key) {
      return store.delete(key);
    },

    keys() {
      return Array.from(store.keys());
    },
  };
}

function createWebStorageAdapter(storage) {
  return {
    get(key) {
      return storage.getItem(key);
    },

    set(key, value) {
      storage.setItem(key, value);

      return true;
    },

    remove(key) {
      storage.removeItem(key);
    },

    keys() {
      const keys = [];

      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);

        if (key) {
          keys.push(key);
        }
      }

      return keys;
    },
  };
}

function getWebStorageAdapter(type) {
  try {
    const storage =
      type === "session" ? window.sessionStorage : window.localStorage;

    const testKey = "__hoyoao_storage_test__";

    storage.setItem(testKey, "1");
    storage.removeItem(testKey);

    return createWebStorageAdapter(storage);
  } catch {
    return null;
  }
}

function resolveAdapter(preferredProvider) {
  if (preferredProvider === STORAGE_PROVIDERS.MEMORY) {
    return {
      name: STORAGE_PROVIDERS.MEMORY,
      adapter: createMemoryAdapter(),
    };
  }

  if (typeof window !== "undefined") {
    if (preferredProvider === STORAGE_PROVIDERS.SESSION) {
      const sessionAdapter = getWebStorageAdapter("session");

      if (sessionAdapter) {
        return {
          name: STORAGE_PROVIDERS.SESSION,
          adapter: sessionAdapter,
        };
      }
    }

    if (
      preferredProvider === STORAGE_PROVIDERS.LOCAL ||
      preferredProvider === STORAGE_PROVIDERS.INDEXED_DB ||
      preferredProvider === undefined ||
      preferredProvider === null
    ) {
      const localAdapter = getWebStorageAdapter("local");

      if (localAdapter) {
        return {
          name: STORAGE_PROVIDERS.LOCAL,
          adapter: localAdapter,
        };
      }

      const sessionAdapter = getWebStorageAdapter("session");

      if (sessionAdapter) {
        return {
          name: STORAGE_PROVIDERS.SESSION,
          adapter: sessionAdapter,
        };
      }
    }
  }

  if (
    preferredProvider === STORAGE_PROVIDERS.INDEXED_DB ||
    preferredProvider === STORAGE_PROVIDERS.SESSION ||
    preferredProvider === STORAGE_PROVIDERS.LOCAL
  ) {
    console.warn(
      `[HoyoAO Storage] Provider "${preferredProvider}" is unavailable. Falling back to memory storage.`,
    );
  }

  return {
    name: STORAGE_PROVIDERS.MEMORY,
    adapter: createMemoryAdapter(),
  };
}

export function createStorageService(options = {}) {
  const namespace =
    options.namespace === undefined || options.namespace === null
      ? DEFAULT_NAMESPACE
      : String(options.namespace);

  const separator = options.separator ?? DEFAULT_SEPARATOR;
  const prefix = namespace ? `${namespace}${separator}` : "";

  const serialize = options.serialize ?? JSON.stringify;
  const parse = options.parse ?? JSON.parse;

  const resolved = resolveAdapter(options.provider ?? STORAGE_PROVIDERS.LOCAL);

  let adapter = resolved.adapter;
  let providerName = resolved.name;

  const overlay = new Map();
  const listeners = new Set();

  let destroyed = false;

  function fullKey(key) {
    return `${prefix}${key}`;
  }

  function notify(action, key, value) {
    const payload = Object.freeze({
      action,
      key,
      value,
      provider: providerName,
      namespace,
      timestamp: Date.now(),
    });

    for (const listener of Array.from(listeners)) {
      try {
        listener(payload);
      } catch (error) {
        console.error("[HoyoAO Storage] Storage listener failed.", error);
      }
    }
  }

  function parseRecord(raw) {
    let parsed;

    try {
      parsed = parse(raw);
    } catch {
      return { valid: false };
    }

    if (!isPlainObject(parsed)) {
      return { valid: false };
    }

    if (
      typeof parsed.expiresAt === "number" &&
      Number.isFinite(parsed.expiresAt) &&
      Date.now() >= parsed.expiresAt
    ) {
      return { valid: false, expired: true };
    }

    if (!("value" in parsed)) {
      return { valid: false };
    }

    return {
      valid: true,
      record: parsed,
    };
  }

  function getRecord(key) {
    if (overlay.has(key)) {
      const record = overlay.get(key);

      if (
        record &&
        typeof record.expiresAt === "number" &&
        Number.isFinite(record.expiresAt) &&
        Date.now() >= record.expiresAt
      ) {
        overlay.delete(key);

        return undefined;
      }

      return record;
    }

    let raw;

    try {
      raw = adapter.get(fullKey(key));
    } catch {
      return undefined;
    }

    if (raw === undefined || raw === null) {
      return undefined;
    }

    const parsed = parseRecord(raw);

    if (!parsed.valid) {
      try {
        adapter.remove(fullKey(key));
      } catch {
        /* Ignore cleanup errors. */
      }

      return undefined;
    }

    return parsed.record;
  }

  function resolveExpiration(setOptions = {}) {
    if (Number.isFinite(setOptions.expiresAt)) {
      return setOptions.expiresAt;
    }

    if (setOptions.expiresAt instanceof Date) {
      return setOptions.expiresAt.getTime();
    }

    const ttl = Number(setOptions.ttl);

    if (Number.isFinite(ttl) && ttl > 0) {
      return Date.now() + ttl;
    }

    return null;
  }

  function get(key, fallback = null) {
    if (destroyed) {
      return fallback;
    }

    try {
      const normalizedKey = normalizeKey(key);
      const record = getRecord(normalizedKey);

      return record ? record.value : fallback;
    } catch {
      return fallback;
    }
  }

  function set(key, value, setOptions = {}) {
    if (destroyed) {
      return false;
    }

    try {
      const normalizedKey = normalizeKey(key);
      const normalizedValue = value === undefined ? null : value;

      const record = {
        v: ENVELOPE_VERSION,
        value: normalizedValue,
        createdAt: Date.now(),
        expiresAt: resolveExpiration(setOptions),
      };

      let serialized;

      try {
        serialized = serialize(record);
      } catch (error) {
        console.error(
          `[HoyoAO Storage] Failed to serialize key "${normalizedKey}".`,
          error,
        );

        return false;
      }

      try {
        adapter.set(fullKey(normalizedKey), serialized);
        overlay.delete(normalizedKey);
      } catch (error) {
        overlay.set(normalizedKey, record);
      }

      notify("set", normalizedKey, normalizedValue);

      return true;
    } catch (error) {
      console.error("[HoyoAO Storage] Failed to set value.", error);

      return false;
    }
  }

  function remove(key) {
    if (destroyed) {
      return false;
    }

    try {
      const normalizedKey = normalizeKey(key);

      const hadOverlay = overlay.has(normalizedKey);

      overlay.delete(normalizedKey);

      let raw;

      try {
        raw = adapter.get(fullKey(normalizedKey));
      } catch {
        raw = null;
      }

      const hadPersisted = raw !== undefined && raw !== null;

      try {
        adapter.remove(fullKey(normalizedKey));
      } catch {
        /* Ignore adapter removal errors. */
      }

      const existed = hadOverlay || hadPersisted;

      if (existed) {
        notify("remove", normalizedKey, undefined);
      }

      return existed;
    } catch {
      return false;
    }
  }

  function has(key) {
    if (destroyed) {
      return false;
    }

    try {
      const normalizedKey = normalizeKey(key);

      return getRecord(normalizedKey) !== undefined;
    } catch {
      return false;
    }
  }

  function keys() {
    if (destroyed) {
      return [];
    }

    const collected = new Set();

    try {
      const rawKeys = adapter.keys();

      for (const rawKey of rawKeys) {
        if (typeof rawKey === "string" && rawKey.startsWith(prefix)) {
          collected.add(rawKey.slice(prefix.length));
        }
      }
    } catch {
      /* Ignore adapter key enumeration errors. */
    }

    for (const overlayKey of overlay.keys()) {
      collected.add(overlayKey);
    }

    const validKeys = [];

    for (const key of collected) {
      const record = getRecord(key);

      if (record) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  function clear() {
    if (destroyed) {
      return 0;
    }

    const existingKeys = keys();

    for (const key of existingKeys) {
      overlay.delete(key);

      try {
        adapter.remove(fullKey(key));
      } catch {
        /* Ignore adapter removal errors. */
      }
    }

    overlay.clear();

    notify("clear", null, null);

    return existingKeys.length;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("[HoyoAO Storage] Storage listener must be a function.");
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function getProvider() {
    return providerName;
  }

  function getNamespace() {
    return namespace;
  }

  function isPersistent() {
    return (
      providerName === STORAGE_PROVIDERS.LOCAL ||
      providerName === STORAGE_PROVIDERS.SESSION
    );
  }

  function onStorageEvent(event) {
    if (!event || !event.key || !event.key.startsWith(prefix)) {
      return;
    }

    const key = event.key.slice(prefix.length);
    const record = getRecord(key);

    notify("sync", key, record ? record.value : undefined);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorageEvent);
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorageEvent);
    }

    listeners.clear();
    overlay.clear();
  }

  return Object.freeze({
    get,
    set,
    remove,
    has,
    keys,
    clear,
    subscribe,
    getProvider,
    getNamespace,
    isPersistent,
    destroy,
  });
}

export function createStorageServiceFromContext(context) {
  const storageConfig = context?.config?.services?.storage ?? {};

  return createStorageService({
    provider: storageConfig.provider ?? STORAGE_PROVIDERS.LOCAL,
    namespace: storageConfig.namespace ?? DEFAULT_NAMESPACE,
    separator: storageConfig.separator,
  });
}

export default createStorageService; 
