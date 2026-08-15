import { LINK_TYPES } from "../core/constants.js";

import { el } from "../utils/dom.js";

import { createMediaServiceFromContext } from "../services/media/media-service.js";

export function mountFooter(context) {
  const footer = context.shell?.footer;
  const footerInner = context.shell?.footerInner;

  if (!footer || !footerInner) {
    throw new Error("[HoyoAO] Footer requires footer and footerInner shell regions.");
  }

  footerInner.replaceChildren();

  const media = createMediaServiceFromContext(context);
  const siteConfig = context.config ?? {};
  const footerConfig = siteConfig.footer ?? {};
  const defaultPageId =
    context.data?.pages?.defaultPageId ?? "dashboard";

  if (
    footerConfig.links &&
    Array.isArray(footerConfig.links) &&
    footerConfig.links.length > 0
  ) {
    const nav = el("nav", {
      className: "app-footer-nav",
      attrs: {
        "aria-label":
          footerConfig.navigationAriaLabel ?? "Footer navigation",
      },
    });

    const visibleLinks = footerConfig.links
      .filter((link) => link.enabled !== false && link.hidden !== true)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    visibleLinks.forEach((link, index) => {
      const linkEl = el("a", {
        className: "app-footer-link",
        attrs: {
          href: link.route ?? link.href ?? "#",
          "aria-label": link.ariaLabel ?? link.label,
        },
        text: link.label,
      });

      linkEl.addEventListener("click", (event) => {
        if (
          link.type === LINK_TYPES.ROUTE ||
          link.type === LINK_TYPES.PAGE
        ) {
          event.preventDefault();
          context.router?.navigate?.(link.route ?? link.pageId);
        }
      });

      nav.append(linkEl);

      if (
        footerConfig.showSeparators !== false &&
        index < visibleLinks.length - 1
      ) {
        nav.append(
          el("span", {
            className: "app-footer-separator",
            attrs: { "aria-hidden": "true" },
            text: footerConfig.separator ?? "|",
          }),
        );
      }
    });

    footerInner.append(nav);
  }

  const brandContainer = el("div", {
    className: "app-footer-brand",
  });

  if (footerConfig.showLogo !== false) {
    const logoButton = el("button", {
      className: "app-footer-logo",
      attrs: {
        type: "button",
        "aria-label": media.getLogoAlt(),
      },
    });

    const logoImg = document.createElement("img");

    logoImg.src = media.getLogoUrl();
    logoImg.alt = media.getLogoAlt();

    logoImg.addEventListener(
      "error",
      () => {
        logoImg.replaceWith(
          el("span", { text: media.getLogoInitials() }),
        );
      },
      { once: true },
    );

    logoButton.append(logoImg);

    logoButton.addEventListener("click", () => {
      context.router?.navigate?.(defaultPageId);
    });

    brandContainer.append(logoButton);
  }

  if (footerConfig.showCopyright !== false) {
    brandContainer.append(
      el("span", {
        className: "app-footer-copy",
        text:
          footerConfig.copyright ??
          siteConfig.copyrightText ??
          `© ${new Date().getFullYear()} ${siteConfig.name ?? "HoyoAO"}`,
      }),
    );
  }

  if (brandContainer.children.length > 0) {
    footerInner.append(brandContainer);
  }

  function syncVisibility(pageId) {
    const effectivePageId = pageId ?? defaultPageId;

    footer.hidden = effectivePageId !== defaultPageId;
  }

  const disposeVisibility = context.store?.subscribeSelector?.(
    (state) => state.route?.pageId,
    syncVisibility,
  );

  syncVisibility(context.store?.getState?.().route?.pageId);

  context.registerDisposer?.(() => {
    try {
      disposeVisibility?.();
    } catch {
      /* Ignore disposer errors. */
    }

    footerInner.replaceChildren();
    footer.hidden = false;
  });

  return Object.freeze({
    root: footerInner,
  });
}
