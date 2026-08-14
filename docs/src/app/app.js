import { el } from "../utils/dom.js";

import { createDataServiceFromContext } from "../services/data/data-provider.js";
import { createNavigationServiceFromContext } from "../services/navigation/navigation-service.js";
import { createSearchServiceFromContext } from "../services/search/search-service.js";
import { createStorageServiceFromContext } from "../services/storage/storage-service.js";

import { createFeatureManager } from "./features.js";

function ensureServices(context) {
  context.services = context.services ?? {};

  const createdServices = [];

  if (!context.services.data) {
    context.services.data = createDataServiceFromContext(context);
    createdServices.push(context.services.data);
  }

  if (!context.services.navigation) {
    context.services.navigation = createNavigationServiceFromContext(context);
    createdServices.push(context.services.navigation);
  }

  if (!context.services.search) {
    context.services.search = createSearchServiceFromContext(context);
    createdServices.push(context.services.search);
  }

  if (!context.services.storage) {
    context.services.storage = createStorageServiceFromContext(context);
    createdServices.push(context.services.storage);
  }

  return createdServices;
}

function createMetaNote(text) {
  return el("div", {
    className: "app-panel-note",
    text,
  });
}

function renderFallbackNotFound(context) {
  const root = el("div", { className: "dsd" });

  const emptyState = el("div", { className: "dsd-empty" });

  emptyState.append(
    el("div", {
      className: "dsd-empty-title",
      text: "404",
    }),
    el("p", {
      text: "Trang không tồn tại.",
    }),
  );

  const homeButton = el("button", {
    className: "nav-control nav-control--text",
    attrs: {
      type: "button",
    },
    text: "Về trang chủ",
  });

  homeButton.addEventListener("click", () => {
    context.router?.navigate?.(
      context.data?.pages?.defaultPageId ?? "home",
    );
  });

  emptyState.append(
    el("div", { className: "dsd-empty-actions" }, [homeButton]),
  );

  root.append(emptyState);

  return root;
}

function renderFallbackPage(route, context) {
  const page =
    route?.page ??
    context.router?.getPageById?.(route?.pageId) ??
    {};

  const root = el("div", { className: "dsd" });

  const widget = el("article", { className: "dsd-widget" });

  widget.append(
    el("div", { className: "dsd-widget-header" }, [
      el("h2", {
        className: "dsd-widget-title",
        text: page.label ?? route?.title ?? context.config?.name ?? "HoyoAO",
      }),
    ]),
  );

  const body = el("div", { className: "dsd-widget-body" });

  if (page.description) {
    body.append(
      el("p", {
        text: page.description,
      }),
    );
  }

  body.append(
    createMetaNote(
      `Layout: ${page.layout ?? route?.layout ?? "article"} · Mode: ${
        page.mode ?? route?.mode ?? "2d"
      }`,
    ),
  );

  widget.append(body);
  root.append(widget);

  return root;
}

function installFallbackPageRenderer(context) {
  if (typeof context.services.pageRenderer === "function") {
    return;
  }

  context.services.pageRenderer = function fallbackPageRenderer(route) {
    const content = context.shell?.content;

    if (!content) {
      return;
    }

    content.replaceChildren();

    if (route?.notFound === true) {
      content.append(renderFallbackNotFound(context));
      return;
    }

    content.append(renderFallbackPage(route, context));
  };
}

export async function mountApplication(context) {
  if (!context) {
    throw new Error("[HoyoAO App] Application requires a valid context.");
  }

  context.services = context.services ?? {};

  if (context.services.appMounted && context.services.app) {
    return context.services.app;
  }

  const createdServices = ensureServices(context);

  installFallbackPageRenderer(context);

  const featureManager = createFeatureManager(context);

  await featureManager.mount();

  const app = Object.freeze({
    featureManager,
    services: context.services,
    isMounted: true,
  });

  context.services.app = app;
  context.services.appMounted = true;

  context.registerDisposer?.(() => {
    void featureManager.unmount();
  });

  for (const service of createdServices) {
    context.registerDisposer?.(() => {
      try {
        service.destroy?.();
      } catch (error) {
        console.error("[HoyoAO App] Service teardown failed.", error);
      }
    });
  }

  return app;
}

export default mountApplication; 
