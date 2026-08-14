export function noop() {}

export function identity(value) {
  return value;
}

export function isFunction(value) {
  return typeof value === "function";
}

export function isString(value) {
  return typeof value === "string";
}

export function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isNil(value) {
  return value === undefined || value === null;
}

export function ensureArray(value) {
  if (isNil(value)) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function clamp(value, min, max) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return min;
  }

  return Math.min(max, Math.max(min, numeric));
}

export function lerp(start, end, amount) {
  const numericStart = Number(start) || 0;
  const numericEnd = Number(end) || 0;
  const numericAmount = clamp(Number(amount) || 0, 0, 1);

  return numericStart + (numericEnd - numericStart) * numericAmount;
}

export function normalize(value, min, max) {
  const numeric = Number(value);
  const numericMin = Number(min);
  const numericMax = Number(max);

  if (numericMax === numericMin) {
    return 0;
  }

  return (numeric - numericMin) / (numericMax - numericMin);
}

export function createUid(prefix = "id") {
  const cryptoApi = globalThis.crypto;

  const random =
    cryptoApi?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return prefix ? `${prefix}-${random}` : random;
}

export function sleep(ms = 0, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      reject(abortError);
      return;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timeoutId);
      cleanup();

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      reject(abortError);
    }

    function cleanup() {
      signal?.removeEventListener("abort", onAbort);
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function withTimeout(promise, ms = 8000, message = "Operation timed out") {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export function debounce(fn, wait = 160, options = {}) {
  if (typeof fn !== "function") {
    throw new TypeError("[HoyoAO] debounce expects a function.");
  }

  const leading = options.leading === true;

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result;

  function invoke() {
    result = fn.apply(lastThis, lastArgs);
    lastArgs = null;
    lastThis = null;

    return result;
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (leading && timeoutId === null) {
      invoke();
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;

      if (!leading && lastArgs) {
        invoke();
      } else {
        lastArgs = null;
        lastThis = null;
      }
    }, wait);
  }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;

      if (lastArgs) {
        invoke();
      }
    }

    return result;
  };

  debounced.pending = () => timeoutId !== null;

  return debounced;
}

export function throttle(fn, wait = 160, options = {}) {
  if (typeof fn !== "function") {
    throw new TypeError("[HoyoAO] throttle expects a function.");
  }

  const leading = options.leading !== false;
  const trailing = options.trailing !== false;

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastInvokeTime = 0;
  let result;

  function invoke() {
    lastInvokeTime = Date.now();
    result = fn.apply(lastThis, lastArgs);
    lastArgs = null;
    lastThis = null;

    return result;
  }

  function startTimer(remaining) {
    timeoutId = setTimeout(() => {
      timeoutId = null;

      if (trailing && lastArgs) {
        invoke();
      } else {
        lastArgs = null;
        lastThis = null;
      }
    }, remaining);
  }

  function throttled(...args) {
    const now = Date.now();

    lastArgs = args;
    lastThis = this;

    const elapsed = now - lastInvokeTime;

    if (elapsed >= wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (leading) {
        return invoke();
      }

      if (trailing) {
        startTimer(wait);
      }

      return result;
    }

    if (!timeoutId && trailing) {
      startTimer(wait - elapsed);
    }

    return result;
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = 0;
  };

  throttled.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      invoke();
    }

    return result;
  };

  throttled.pending = () => timeoutId !== null;

  return throttled;
}

export function rafThrottle(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("[HoyoAO] rafThrottle expects a function.");
  }

  const raf = globalThis.requestAnimationFrame?.bind(globalThis);

  if (!raf) {
    return throttle(fn, 16);
  }

  let frameId = 0;
  let lastArgs = null;
  let lastThis = null;

  function throttled(...args) {
    lastArgs = args;
    lastThis = this;

    if (frameId) {
      return;
    }

    frameId = raf(() => {
      frameId = 0;

      if (lastArgs) {
        fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    });
  }

  throttled.cancel = () => {
    if (frameId) {
      globalThis.cancelAnimationFrame?.(frameId);
      frameId = 0;
    }

    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

export function safeJsonParse(text, fallback = null) {
  try {
    const parsed = JSON.parse(text);

    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value, fallback = "", space = 0) {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return fallback;
  }
}

export function parseSearchParams(search) {
  if (typeof URLSearchParams !== "function") {
    return {};
  }

  const params = new URLSearchParams(search ?? "");
  const result = {};

  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function serializeSearchParams(params) {
  if (typeof URLSearchParams !== "function") {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (!params || typeof params !== "object") {
    return searchParams.toString();
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

export function sortByOrder(items, options = {}) {
  const {
    orderKey = "order",
    idKey = "id",
    direction = "asc",
  } = options;

  const list = Array.isArray(items) ? [...items] : [];

  list.sort((a, b) => {
    const rawOrderA = Number(a?.[orderKey]);
    const rawOrderB = Number(b?.[orderKey]);

    const orderA = Number.isFinite(rawOrderA) ? rawOrderA : 100;
    const orderB = Number.isFinite(rawOrderB) ? rawOrderB : 100;

    if (orderA !== orderB) {
      return direction === "desc" ? orderB - orderA : orderA - orderB;
    }

    const idA = String(a?.[idKey] ?? "");
    const idB = String(b?.[idKey] ?? "");

    return idA.localeCompare(idB);
  });

  return list;
}

export function shallowEqual(a, b) {
  if (Object.is(a, b)) {
    return true;
  }

  if (
    !a ||
    !b ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b)
  ) {
    return false;
  }

  const keysA = Object.keys(a);

  if (keysA.length !== Object.keys(b).length) {
    return false;
  }

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(a[key], b[key])
    ) {
      return false;
    }
  }

  return true;
}

export function pick(source = {}, keys = []) {
  const result = {};

  for (const key of ensureArray(keys)) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }

  return result;
}

export function omit(source = {}, keys = []) {
  const result = { ...source };

  for (const key of ensureArray(keys)) {
    delete result[key];
  }

  return result;
}

export function composeDisposers(disposers = []) {
  return () => {
    for (const dispose of ensureArray(disposers).splice(0)) {
      try {
        dispose?.();
      } catch (error) {
        console.error("[HoyoAO] Disposer failed.", error);
      }
    }
  };
}

export function createDeferred() {
  let resolve = noop;
  let reject = noop;

  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return Object.freeze({
    promise,
    resolve,
    reject,
  });
} 
