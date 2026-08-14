import { createEventBus } from "./event-bus.js";
import { APP_EVENTS } from "./constants.js";

export { createEventBus };

export const EVENTS = APP_EVENTS;

export const EVENT_NAMESPACES = Object.freeze({
  APP: "app",
  ROUTE: "route",
  PAGE: "page",
  MENU: "menu",
  SEARCH: "search",
  ACCOUNT: "account",
  PANEL: "panel",
  MODAL: "modal",
  DROPDOWN: "dropdown",
  OVERLAY: "overlay",
  ENV: "env",
  DATA: "data",
  THEME: "theme",
  A11Y: "a11y",
});

function normalizeNamespace(namespace) {
  const normalized = String(namespace ?? "").trim().toLowerCase();

  if (!normalized) {
    return "hoyoao";
  }

  if (normalized === "hoyoao") {
    return "hoyoao";
  }

  if (normalized.startsWith("hoyoao:")) {
    return normalized;
  }

  return `hoyoao:${normalized}`;
}

function resolveEventName(namespace, event) {
  const eventName = String(event ?? "").trim();

  if (!eventName) {
    throw new TypeError("[HoyoAO Events] Event name must be a non-empty string.");
  }

  if (eventName.startsWith("hoyoao:")) {
    return eventName;
  }

  return `${namespace}:${eventName}`;
}

export function createEventChannel(eventBus, namespace) {
  if (!eventBus || typeof eventBus.emit !== "function") {
    throw new TypeError("[HoyoAO Events] Event channel requires a valid event bus.");
  }

  const normalizedNamespace = normalizeNamespace(namespace);
  const subscriptions = new Set();

  let disposed = false;

  function resolve(event) {
    return resolveEventName(normalizedNamespace, event);
  }

  function on(event, listener, options) {
    if (disposed) {
      return () => {};
    }

    const eventName = resolve(event);
    const dispose = eventBus.on(eventName, listener, options);

    subscriptions.add(dispose);

    return () => {
      dispose();
      subscriptions.delete(dispose);
    };
  }

  function once(event, listener, options) {
    if (disposed) {
      return () => {};
    }

    const eventName = resolve(event);
    const dispose = eventBus.once(eventName, listener, options);

    subscriptions.add(dispose);

    return () => {
      dispose();
      subscriptions.delete(dispose);
    };
  }

  function emit(event, payload) {
    if (disposed) {
      return false;
    }

    return eventBus.emit(resolve(event), payload);
  }

  function off(event, listener) {
    if (disposed) {
      return;
    }

    eventBus.off(resolve(event), listener);
  }

  function listenerCount(event) {
    if (typeof eventBus.listenerCount !== "function") {
      return 0;
    }

    return eventBus.listenerCount(resolve(event));
  }

  function dispose() {
    if (disposed) {
      return;
    }

    disposed = true;

    for (const disposeSubscription of subscriptions) {
      try {
        disposeSubscription();
      } catch {
        /* Ignore subscription cleanup errors. */
      }
    }

    subscriptions.clear();
  }

  return Object.freeze({
    namespace: normalizedNamespace,
    emit,
    on,
    once,
    off,
    listenerCount,
    dispose,
  });
}

export function createEventEmitter(eventBus, namespace) {
  const channel = createEventChannel(eventBus, namespace);

  return Object.freeze({
    namespace: channel.namespace,
    emit: channel.emit,
    dispose: channel.dispose,
  });
}

export function ensureEventBus(context) {
  if (!context) {
    throw new Error("[HoyoAO Events] Event context is required.");
  }

  context.services = context.services ?? {};

  if (!context.eventBus && context.services.eventBus) {
    context.eventBus = context.services.eventBus;
  }

  if (!context.eventBus) {
    context.eventBus = createEventBus();
  }

  context.services.eventBus = context.eventBus;

  return context.eventBus;
}

export function createAppEventChannel(context, namespace) {
  const eventBus = ensureEventBus(context);

  return createEventChannel(eventBus, namespace);
}

export function subscribeAppEvent(context, event, listener, options) {
  const eventBus = context?.eventBus ?? context?.services?.eventBus;

  if (!eventBus || typeof eventBus.on !== "function") {
    return () => {};
  }

  return eventBus.on(event, listener, options);
}

export function emitAppEvent(context, event, payload) {
  const eventBus = context?.eventBus ?? context?.services?.eventBus;

  if (!eventBus || typeof eventBus.emit !== "function") {
    return false;
  }

  return eventBus.emit(event, payload);
}

export default createEventChannel; 
