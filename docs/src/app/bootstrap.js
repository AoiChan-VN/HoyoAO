import { APP_ROOT_ID, APP_EVENTS, APP_STATE } from "../core/constants.js";
import { createEventBus } from "../core/event-bus.js";
import { createStore } from "../core/state.js";
import { loadAppData } from "../core/data.js";
import { createRouter } from "../core/router.js";
import { renderShell } from "./shell.js";
import { mountHeader } from "../components/header.js";
import { mountFooter } from "../components/footer.js";
import { mountEnvironment } from "../env/environment.js";
import { mountApplication } from "./app.js";

let appContext = null;

function resolveRoot() {
  const root = document.getElementById(APP_ROOT_ID);

  if (!root) {
    throw new Error("[HoyoAO] Root application container #app not found.");
  }

  return root;
}

function applySiteMetadata(site) {
  if (!site) {
    return;
  }

  if (site.locale) {
    document.documentElement.lang = site.locale;
  }

  if (site.theme?.default) {
    document.documentElement.dataset.theme = site.theme.default;
  }

  const meta = site.meta ?? {};

  if (meta.title) {
    document.title = meta.title;
  } else if (site.name) {
    document.title = site.name;
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta && meta.themeColor) {
    themeColorMeta.setAttribute("content", meta.themeColor);
  }

  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

  if (colorSchemeMeta && meta.colorScheme) {
    colorSchemeMeta.setAttribute("content", meta.colorScheme);
  }

  const descriptionMeta = document.querySelector('meta[name="description"]');

  if (descriptionMeta && meta.description) {
    descriptionMeta.setAttribute("content", meta.description);
  }
}

function renderFatalError(root, error) {
  root.replaceChildren();

  const container = document.createElement("div");
  container.className = "app-fatal app-container";
  container.setAttribute("role", "alert");

  const title = document.createElement("h1");
  title.className = "app-fatal-title";
  title.textContent = "HoyoAO không thể khởi động.";

  const message = document.createElement("p");
  message.className = "app-fatal-message";
  message.textContent =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "nav-control nav-control--text";
  retry.textContent = "Tải lại trang";

  retry.addEventListener("click", () => {
    window.location.reload();
  });

  container.append(title, message, retry);
  root.appendChild(container);
}

export function getApplicationContext() {
  return appContext;
}

export async function bootstrapApplication() {
  if (appContext) {
    return appContext;
  }

  const root = resolveRoot();

  const eventBus = createEventBus();
  const store = createStore({
    app: {
      status: APP_STATE.BOOTING,
      error: null,
    },
    route: {
      pageId: null,
      route: null,
      title: null,
    },
    ui: {
      activePanel: null,
      activeModal: null,
      activeDropdown: null,
    },
  });

  const context = {
    root,
    eventBus,
    store,
    shell: null,
    data: null,
    config: null,
    features: {},
    i18n: {},
    router: null,
    env: null,
    app: null,
    services: {},
    disposers: [],
    isDestroyed: false,

    registerDisposer(disposer) {
      if (typeof disposer === "function") {
        this.disposers.push(disposer);
      }
    },

    destroy() {
      if (this.isDestroyed) {
        return;
      }

      this.isDestroyed = true;

      this.eventBus.emit(APP_EVENTS.APP_BEFORE_DESTROY, {
        context: this,
      });

      for (const disposer of this.disposers.splice(0)) {
        try {
          disposer();
        } catch (disposeError) {
          console.error("[HoyoAO] Disposer failed.", disposeError);
        }
      }

      try {
        this.router?.destroy?.();
      } catch (routerError) {
        console.error("[HoyoAO] Router teardown failed.", routerError);
      }

      try {
        this.env?.destroy?.();
      } catch (envError) {
        console.error("[HoyoAO] Environment teardown failed.", envError);
      }

      try {
        this.eventBus.destroy?.();
      } catch (busError) {
        console.error("[HoyoAO] Event bus teardown failed.", busError);
      }

      this.root?.replaceChildren();

      document.body.classList.remove(
        "app-state-booting",
        "app-state-ready",
        "app-state-error",
      );
    },
  };

  try {
    document.body.classList.add("app-state-booting");
    root.classList.add("app-root");

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    eventBus.emit(APP_EVENTS.APP_BEFORE_BOOTSTRAP, { context });

    context.shell = renderShell(root);

    context.a11y = {
      announce(message) {
        const announcer = context.shell?.announcer;

        if (!announcer) {
          return;
        }

        announcer.textContent = "";

        window.requestAnimationFrame(() => {
          announcer.textContent = message;
        });
      },
    };

    eventBus.emit(APP_EVENTS.APP_SHELL_READY, {
      shell: context.shell,
      context,
    });

    context.data = await loadAppData(context);
    context.config = context.data.site ?? {};
    context.features = context.config.features ?? {};
    context.i18n = context.config.i18n ?? {};

    applySiteMetadata(context.config);

    eventBus.emit(APP_EVENTS.APP_DATA_LOADED, {
      data: context.data,
      context,
    });

    mountHeader(context);

    if (context.features["3dEnvironment"]) {
      context.env = mountEnvironment(context);
    }

    mountFooter(context);

    context.app = mountApplication(context);

    context.router = createRouter(context);
    await context.router.start();

    store.setState((state) => ({
      ...state,
      app: {
        status: APP_STATE.READY,
        error: null,
      },
    }));

    document.body.classList.remove("app-state-booting");
    document.body.classList.add("app-state-ready");

    eventBus.emit(APP_EVENTS.APP_READY, { context });

    appContext = context;

    return context;
  } catch (error) {
    store.setState((state) => ({
      ...state,
      app: {
        status: APP_STATE.ERROR,
        error,
      },
    }));

    document.body.classList.remove("app-state-booting");
    document.body.classList.add("app-state-error");

    eventBus.emit(APP_EVENTS.APP_ERROR, {
      error,
      context,
    });

    renderFatalError(root, error);

    throw error;
  }
} 
