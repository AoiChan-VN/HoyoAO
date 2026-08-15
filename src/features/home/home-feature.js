import { el } from "../../utils/dom.js";

const HOME_LAYOUT_ID = "home";

function resolveLogoUrl() {
  try {
    return new URL("../../../assets/logos/logo.png", import.meta.url).href;
  } catch {
    return "./assets/logos/logo.png";
  }
}

function createHeroLogo(context) {
  const site = context.config ?? {};
  const logoConfig = site.brand?.logo ?? {};

  const img = document.createElement("img");

  img.alt = logoConfig.alt ?? site.name ?? "HoyoAO";
  img.src = logoConfig.src ?? resolveLogoUrl();

  img.style.cssText = `
    width: clamp(4rem, 12vw, 6.5rem);
    height: clamp(4rem, 12vw, 6.5rem);
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--color-border-subtle);
    background: var(--color-bg-elevated);
  `;

  img.addEventListener(
    "error",
    () => {
      const fallback = el("div", {
        className: "app-panel-avatar",
        text: logoConfig.initials ?? "AO",
      });

      fallback.style.cssText = `
        width: clamp(4rem, 12vw, 6.5rem);
        height: clamp(4rem, 12vw, 6.5rem);
      `;

      img.replaceWith(fallback);
    },
    { once: true },
  );

  return img;
}

function createQuickActions(context, currentRoute) {
  const pages = context.router?.getSwitcherPages?.() ?? [];

  const others = pages.filter(
    (page) => page.id !== currentRoute?.pageId,
  );

  if (others.length === 0) {
    return null;
  }

  const actions = el("div", { className: "dsd-actions" });

  actions.style.justifyContent = "center";

  for (const page of others) {
    const button = el("button", {
      className: "nav-control nav-control--text",
      attrs: {
        type: "button",
        title: page.description || undefined,
      },
      text: page.label ?? page.id,
    });

    button.addEventListener("click", () => {
      context.router?.navigate?.(page.id);
    });

    actions.append(button);
  }

  return actions;
}

function renderHome(route, context) {
  const site = context.config ?? {};
  const page = route?.page ?? {};

  const root = el("div", { className: "dsd" });

  const hero = el("section", {
    className: "dsd-widget dsd-widget--center",
  });

  const heroBody = el("div", { className: "dsd-widget-body" });

  heroBody.append(createHeroLogo(context));

  heroBody.append(
    el("h1", {
      className: "dsd-title",
      text: site.name ?? "HoyoAO",
    }),
  );

  if (site.tagline) {
    heroBody.append(
      el("p", {
        className: "dsd-subtitle",
        text: site.tagline,
      }),
    );
  }

  const description = page.description ?? site.meta?.description;

  if (description) {
    heroBody.append(
      el("p", {
        className: "dsd-subtitle",
        text: description,
      }),
    );
  }

  const quickActions = createQuickActions(context, route);

  if (quickActions) {
    heroBody.append(quickActions);
  }

  heroBody.append(
    el("div", {
      className: "crd-subtitle",
      text: `Locale: ${site.locale ?? "vi"} • Hosting: ${
        site.environment?.hosting ?? "github-pages"
      }`,
    }),
  );

  hero.append(heroBody);
  root.append(hero);

  return root;
}

export function createHomeFeature(context) {
  let mounted = false;
  let registeredViaPages = false;
  let previousRenderer = null;

  async function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    const pagesService = context.services?.pages;

    if (pagesService?.registerLayout) {
      registeredViaPages = true;

      try {
        await pagesService.unregisterLayout(HOME_LAYOUT_ID);
      } catch {
        /* Layout default may not exist. */
      }

      try {
        pagesService.registerLayout({
          id: HOME_LAYOUT_ID,
          label: "Home layout",
          order: 10,
          render: renderHome,
        });
      } catch (error) {
        console.error("[HoyoAO Home] Layout registration failed.", error);
      }
    } else {
      previousRenderer = context.services?.pageRenderer ?? null;

      if (context.services) {
        context.services.pageRenderer = (route) => {
          if (route?.pageId === "home") {
            const content = context.shell?.content;

            if (content) {
              content.replaceChildren();
              content.append(renderHome(route, context));
            }

            return undefined;
          }

          return previousRenderer?.(route);
        };
      }
    }

    context.registerDisposer?.(() => {
      unmount();
    });
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    if (registeredViaPages) {
      context.services?.pages?.unregisterLayout?.(HOME_LAYOUT_ID);
      registeredViaPages = false;
    } else if (context.services?.pageRenderer && previousRenderer !== null) {
      context.services.pageRenderer = previousRenderer;
      previousRenderer = null;
    }
  }

  const feature = Object.freeze({
    id: "home",
    type: "feature",
    order: 9,
    mount,
    unmount,
    isMounted() {
      return mounted;
    },
  });

  if (context.services) {
    context.services.homeFeature = feature;
  }

  return feature;
}

export function mountHomeFeature(context) {
  const feature = createHomeFeature(context);

  void feature.mount();

  return feature;
}

export default createHomeFeature;
