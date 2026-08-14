import { APP_EVENTS } from "./constants.js";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray(value) === false &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function mergeDeep(current, partial) {
  const next = { ...current };

  for (const key of Object.keys(partial)) {
    const partialValue = partial[key];

    if (partialValue === undefined) {
      continue;
    }

    const currentValue = current[key];

    if (isPlainObject(currentValue) && isPlainObject(partialValue)) {
      next[key] = mergeDeep(currentValue, partialValue);
    } else {
      next[key] = partialValue;
    }
  }

  return next;
}

export function createStore(initialState = {}, options = {}) {
  const storeName = options.name ?? "HoyoAO Store";

  let state = isPlainObject(initialState) ? mergeDeep({}, initialState) : {};
  const initialStateSnapshot = isPlainObject(initialState)
    ? mergeDeep({}, initialState)
    : {};

  const listeners = new Set();

  let destroyed = false;
  let version = 0;

  function notify(prevState, nextState, changedKeys) {
    const meta = {
      changedKeys,
      version,
      storeName,
    };

    for (const listener of Array.from(listeners)) {
      try {
        listener(nextState, prevState, meta);
      } catch (error) {
        console.error(`[HoyoAO] Store listener failed in "${storeName}".`, error);
      }
    }

    if (options.eventBus && typeof options.eventBus.emit === "function") {
      try {
        options.eventBus.emit(APP_EVENTS.STORE_CHANGED, {
          state: nextState,
          prevState,
          changedKeys,
          version,
          storeName,
        });
      } catch (error) {
        console.error(`[HoyoAO] Store event emission failed in "${storeName}".`, error);
      }
    }
  }

  function getState() {
    return state;
  }

  function getSnapshot() {
    return state;
  }

  function setState(partialOrUpdater) {
    if (destroyed) {
      return state;
    }

    const prevState = state;

    const partial =
      typeof partialOrUpdater === "function"
        ? partialOrUpdater(prevState)
        : partialOrUpdater;

    if (partial === undefined || partial === null) {
      return state;
    }

    if (partial === prevState) {
      return state;
    }

    if (!isPlainObject(partial)) {
      throw new TypeError(
        `[HoyoAO] ${storeName}.setState expects a plain object or an updater returning a plain object.`,
      );
    }

    const changedKeys = Object.keys(partial).filter(
      (key) => partial[key] !== undefined,
    );

    if (changedKeys.length === 0) {
      return state;
    }

    const nextState = mergeDeep(prevState, partial);

    state = nextState;
    version += 1;

    notify(prevState, nextState, changedKeys);

    return state;
  }

  function replaceState(nextState) {
    if (destroyed) {
      return state;
    }

    if (!isPlainObject(nextState)) {
      throw new TypeError(
        `[HoyoAO] ${storeName}.replaceState expects a plain object.`,
      );
    }

    const prevState = state;
    const changedKeys = Object.keys(nextState);

    state = { ...nextState };
    version += 1;

    notify(prevState, state, changedKeys);

    return state;
  }

  function reset() {
    if (destroyed) {
      return state;
    }

    const prevState = state;
    const nextState = mergeDeep({}, initialStateSnapshot);
    const changedKeys = Object.keys(initialStateSnapshot);

    state = nextState;
    version += 1;

    notify(prevState, nextState, changedKeys);

    return state;
  }

  function subscribe(listener) {
    if (destroyed) {
      return () => {};
    }

    if (typeof listener !== "function") {
      throw new TypeError(
        `[HoyoAO] ${storeName}.subscribe expects a function.`,
      );
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function subscribeOnce(listener) {
    if (destroyed) {
      return () => {};
    }

    if (typeof listener !== "function") {
      throw new TypeError(
        `[HoyoAO] ${storeName}.subscribeOnce expects a function.`,
      );
    }

    const unsubscribe = subscribe((nextState, prevState, meta) => {
      unsubscribe();
      listener(nextState, prevState, meta);
    });

    return unsubscribe;
  }

  function select(selector) {
    if (typeof selector !== "function") {
      throw new TypeError(`[HoyoAO] ${storeName}.select expects a function.`);
    }

    return selector(state);
  }

  function subscribeSelector(selector, listener, { equals = Object.is } = {}) {
    if (destroyed) {
      return () => {};
    }

    if (typeof selector !== "function") {
      throw new TypeError(
        `[HoyoAO] ${storeName}.subscribeSelector expects a selector function.`,
      );
    }

    if (typeof listener !== "function") {
      throw new TypeError(
        `[HoyoAO] ${storeName}.subscribeSelector expects a listener function.`,
      );
    }

    if (typeof equals !== "function") {
      throw new TypeError(
        `[HoyoAO] ${storeName}.subscribeSelector expects an equals function.`,
      );
    }

    let previousSelectedValue = selector(state);

    const unsubscribe = subscribe((nextState, prevState, meta) => {
      let nextSelectedValue;

      try {
        nextSelectedValue = selector(nextState);
      } catch (error) {
        console.error(`[HoyoAO] Store selector failed in "${storeName}".`, error);
        return;
      }

      if (!equals(nextSelectedValue, previousSelectedValue)) {
        const previousValue = previousSelectedValue;
        previousSelectedValue = nextSelectedValue;

        try {
          listener(nextSelectedValue, previousValue, nextState, prevState, meta);
        } catch (error) {
          console.error(
            `[HoyoAO] Store selector listener failed in "${storeName}".`,
            error,
          );
        }
      }
    });

    return unsubscribe;
  }

  function listenerCount() {
    return listeners.size;
  }

  function isDestroyed() {
    return destroyed;
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    listeners.clear();
  }

  return Object.freeze({
    getState,
    getSnapshot,
    setState,
    replaceState,
    reset,
    subscribe,
    subscribeOnce,
    select,
    subscribeSelector,
    listenerCount,
    isDestroyed,
    destroy,
  });
} 
