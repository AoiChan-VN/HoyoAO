import { createRouter as createCoreRouter } from "../core/router.js";

function ensureServices(context) {
  context.services = context.services ?? {};
}

export function createRouter(context) {
  if (!context) {
    throw new Error("[HoyoAO App Router] Router requires a valid context.");
  }

  ensureServices(context);

  if (context.services.router) {
    return context.services.router;
  }

  const router = createCoreRouter(context);

  context.services.router = router;

  context.registerDisposer?.(() => {
    if (context.services?.router === router) {
      delete context.services.router;
    }
  });

  return router;
}

export function getRouter(context) {
  return context?.services?.router ?? context?.router ?? null;
}

export function getCurrentRoute(context) {
  const router = getRouter(context);

  return router?.getCurrentRoute?.() ?? null;
}

export async function navigate(context, input, options) {
  const router = getRouter(context);

  if (!router) {
    throw new Error("[HoyoAO App Router] Router is not available.");
  }

  return router.navigate(input, options);
}

export async function replace(context, input, options) {
  const router = getRouter(context);

  if (!router) {
    throw new Error("[HoyoAO App Router] Router is not available.");
  }

  return router.replace(input, options);
}

export default createRouter; 
