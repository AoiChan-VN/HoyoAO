import { createRegistry } from "../core/registry.js";
import { COMPONENT_IDS, FEATURE_KEYS } from "../core/constants.js";

import { createHomeFeature } from "../features/home/home-feature.js";
import { createPagesFeature } from "../features/pages/pages-feature.js";
import { createDashboardFeature } from "../features/dashboard/dashboard-feature.js";
import { createMenuFeature } from "../features/menu/menu-feature.js";
import { createSearchFeature } from "../features/search/search-feature.js";
import { createAccountFeature } from "../features/account/account-feature.js";
import { createSettingsFeature } from "../features/settings/settings-feature.js";

const FEATURE_TYPE = "feature";

function isFeatureFlagEnabled(context, key) {
  const features = context?.features ?? {};

  return features[key] !== false;
}

export function createFeatureManager(context) {
  if (context.services?.featureManager) {
    return context.services.featureManager;
  }

  const registry = createRegistry({
    name: "hoyoao-features",
  });

  let mounted = false;
  let destroyed = false;

  function ensureActive() {
    if (destroyed) {
      throw new Error("[HoyoAO Features] Feature manager is destroyed.");
    }
  }

  function registerFeature(feature, options = {}) {
    ensureActive();

    if (!feature || typeof feature !== "object") {
      throw new TypeError("[HoyoAO Features] Feature must be an object.");
    }

    if (!feature.id) {
      throw new TypeError("[HoyoAO Features] Feature must have an id.");
    }

    if (typeof feature.mount !== "function") {
      throw new TypeError(
        "[HoyoAO Features] Feature must implement mount().",
      );
    }

    if (typeof feature.unmount !== "function") {
      throw new TypeError(
        "[HoyoAO Features] Feature must implement unmount().",
      );
    }

    const enabled = options.enabled ?? feature.enabled ?? true;

    const definition = {
      id: feature.id,
      label: feature.label ?? feature.id,
      order: feature.order ?? 100,
      enabled: enabled !== false,
      mount: () => feature.mount(context),
      unmount: () => feature.unmount(context),
      source: feature,
    };

    const unregister = registry.register(FEATURE_TYPE, definition);

    if (mounted && definition.enabled) {
      void registry.mount(FEATURE_TYPE, feature.id, context);
    }

    return unregister;
  }

  function registerDefaultFeatures() {
    if (isFeatureFlagEnabled(context, "pages")) {
      registerFeature(createPagesFeature(context));
    }

    if (isFeatureFlagEnabled(context, "home")) {
      registerFeature(createHomeFeature(context));
    }

    if (isFeatureFlagEnabled(context, "dashboard")) {
      registerFeature(createDashboardFeature(context));
    }

    if (isFeatureFlagEnabled(context, FEATURE_KEYS.MENU)) {
      registerFeature(createMenuFeature(context));
    }

    if (isFeatureFlagEnabled(context, FEATURE_KEYS.SEARCH)) {
      registerFeature(createSearchFeature(context));
    }

    if (isFeatureFlagEnabled(context, FEATURE_KEYS.ACCOUNT_PANEL)) {
      registerFeature(createAccountFeature(context));
    }

    if (isFeatureFlagEnabled(context, "settings")) {
      registerFeature(createSettingsFeature(context));
    }
  }

  function cleanupLegacyPanelSystem() {
    const legacyPanelManager = context.services?.panelManager;

    if (legacyPanelManager) {
      try {
        legacyPanelManager.destroy?.();
      } catch (error) {
        console.error(
          "[HoyoAO Features] Legacy panel manager cleanup failed.",
          error,
        );
      }

      if (context.services?.panelManager === legacyPanelManager) {
        delete context.services.panelManager;
      }
    }

    const legacyPanelIds = [
      COMPONENT_IDS.MENU_PANEL,
      COMPONENT_IDS.SEARCH_PANEL,
      COMPONENT_IDS.ACCOUNT_PANEL,
    ];

    for (const panelId of legacyPanelIds) {
      document.getElementById(panelId)?.remove();
    }

    document
      .querySelectorAll(".app-panel-backdrop")
      .forEach((node) => node.remove());
  }

  async function mount() {
    ensureActive();

    if (mounted) {
      return api;
    }

    mounted = true;

    cleanupLegacyPanelSystem();

    await registry.mountAll(FEATURE_TYPE, context);

    if (context.services) {
      context.services.featureManager = api;
    }

    context.registerDisposer?.(() => {
      void unmount();
    });

    return api;
  }

  async function unmount() {
    if (!mounted || destroyed) {
      return;
    }

    mounted = false;

    await registry.unmountAll(FEATURE_TYPE);

    if (context.services?.featureManager === api) {
      delete context.services.featureManager;
    }
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    void unmount();

    registry.destroy();
  }

  const api = Object.freeze({
    registerFeature,

    getFeatures() {
      return registry.getAll(FEATURE_TYPE);
    },

    getEnabledFeatures() {
      return registry.getEnabled(FEATURE_TYPE, context);
    },

    isMounted() {
      return mounted;
    },

    mount,
    unmount,
    destroy,
  });

  registerDefaultFeatures();

  if (context.services) {
    context.services.featureManager = api;
  }

  return api;
}

export async function mountFeatures(context) {
  const manager = createFeatureManager(context);

  await manager.mount();

  return manager;
}

export default createFeatureManager; 
