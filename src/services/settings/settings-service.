import { createStorageServiceFromContext } from "../storage/storage-service.js";

const SETTINGS_STORAGE_KEY = "settings";

export const SETTINGS_KEYS = Object.freeze({
  LOCALE: "locale",
  THEME: "theme",
  DISPLAY_NAME: "displayName",
  ACCENT: "accent",
  REDUCE_MOTION: "reduceMotion",
  COMPACT_MODE: "compactMode",
});

export const DEFAULT_SETTINGS = Object.freeze({
  locale: "vi",
  theme: "dark",
  displayName: "",
  accent: "default",
  reduceMotion: false,
  compactMode: false,
});

export const SETTING_OPTIONS = Object.freeze({
  locale: ["vi", "en"],
  theme: ["dark", "light"],
  accent: ["default", "cyan", "violet", "amber"],
});

function sanitizeSettings(raw) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...(raw && typeof raw === "object" ? raw : {}),
  };

  if (!SETTING_OPTIONS.locale.includes(merged.locale)) {
    merged.locale = DEFAULT_SETTINGS.locale;
  }

  if (!SETTING_OPTIONS.theme.includes(merged.theme)) {
    merged.theme = DEFAULT_SETTINGS.theme;
  }

  if (!SETTING_OPTIONS.accent.includes(merged.accent)) {
    merged.accent = DEFAULT_SETTINGS.accent;
  }

  merged.displayName = String(merged.displayName ?? "").slice(0, 40);
  merged.reduceMotion = merged.reduceMotion === true;
  merged.compactMode = merged.compactMode === true;

  return merged;
}

export function createSettingsService(context, options = {}) {
  const storage =
    context.services?.storage ??
    options.storage ??
    createStorageServiceFromContext(context);

  const listeners = new Set();

  let settings = sanitizeSettings(
    storage.get?.(SETTINGS_STORAGE_KEY, null),
  );

  function persist() {
    try {
      storage.set?.(SETTINGS_STORAGE_KEY, settings);
    } catch (error) {
      console.error("[HoyoAO Settings] Persist failed.", error);
    }
  }

  function applySettings() {
    const root = document.documentElement;

    root.lang = settings.locale || DEFAULT_SETTINGS.locale;
    root.dataset.theme = settings.theme || DEFAULT_SETTINGS.theme;
    root.dataset.accent = settings.accent || DEFAULT_SETTINGS.accent;
    root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";

    if (document.body) {
      document.body.dataset.compact = settings.compactMode
        ? "true"
        : "false";
    }
  }

  function notify(changedKeys) {
    const snapshot = getSettings();

    for (const listener of Array.from(listeners)) {
      try {
        listener(snapshot, changedKeys);
      } catch (error) {
        console.error("[HoyoAO Settings] Listener failed.", error);
      }
    }
  }

  function getSettings() {
    return { ...settings };
  }

  function getSetting(key, fallback = null) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      return settings[key];
    }

    return fallback;
  }

  function setSetting(key, value) {
    const next = sanitizeSettings({ ...settings, [key]: value });

    const changedKeys = Object.keys(next).filter(
      (nextKey) => next[nextKey] !== settings[nextKey],
    );

    if (changedKeys.length === 0) {
      return getSettings();
    }

    settings = next;

    persist();
    applySettings();
    notify(changedKeys);

    return getSettings();
  }

  function updateSettings(partial) {
    if (!partial || typeof partial !== "object") {
      return getSettings();
    }

    const next = sanitizeSettings({ ...settings, ...partial });

    const changedKeys = Object.keys(next).filter(
      (nextKey) => next[nextKey] !== settings[nextKey],
    );

    if (changedKeys.length === 0) {
      return getSettings();
    }

    settings = next;

    persist();
    applySettings();
    notify(changedKeys);

    return getSettings();
  }

  function resetSettings() {
    settings = sanitizeSettings({ ...DEFAULT_SETTINGS });

    persist();
    applySettings();
    notify(Object.keys(DEFAULT_SETTINGS));

    return getSettings();
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError(
        "[HoyoAO Settings] Listener must be a function.",
      );
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  applySettings();

  function destroy() {
    listeners.clear();
  }

  return Object.freeze({
    getSettings,
    getSetting,
    setSetting,
    updateSettings,
    resetSettings,
    subscribe,
    destroy,
  });
}

export function createSettingsServiceFromContext(context) {
  if (context.services?.settings) {
    return context.services.settings;
  }

  const service = createSettingsService(context);

  if (context.services) {
    context.services.settings = service;
  }

  return service;
}

export default createSettingsService; 
