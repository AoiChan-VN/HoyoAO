import { LINK_TYPES } from "../core/constants.js";

function el(tag, options = {}, children = []) {
  const element = document.createElement(tag);

  const {
    id,
    className,
    text,
    attrs = {},
    dataset = {},
  } = options;

  if (id) {
    element.id = id;
  }

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = text;
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    if (value === true) {
      element.setAttribute(key, "");
    } else {
      element.setAttribute(key, String(value));
    }
  }

  for (const [key, value] of Object.entries(dataset)) {
    if (value !== undefined && value !== null) {
      element.dataset[key] = String(value);
    }
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) {
      continue;
    }

    element.append(child);
  }

  return element;
}

function createFooterLogo(context, logoConfig) {
  const label = context.i18n?.logoHome ?? "Về trang chủ HoyoAO";
  const defaultPageId = context.data.pages?.defaultPageId ?? "home";
  const targetPageId = logoConfig?.action?.pageId ?? defaultPageId;

  const button = el("button", {
    className: "app-footer-logo",
    attrs: {
      type: "button",
      "aria-label": label,
    },
  });

  if (logoConfig?.src) {
    const image = document.createElement("img");
    image.src = logoConfig.src;
    image.alt = logoConfig.alt ?? label;
    button.append(image);
  } else {
    const fallback = el("span", {
      text: logoConfig?.initials ?? "AO",
    });

    button.append(fallback);
  }

  button.addEventListener("click", () => {
    context.router?.navigate?.(targetPageId);
  });

  return button;
}

export function mountFooter(context) {
  const footerInner = context.shell?.footerInner;

  if (!footerInner) {
    throw new Error("[HoyoAO] Footer requires footerInner shell region.");
  }

  footerInner.replaceChildren();

  const siteConfig = context.config ?? {};
  const footerConfig = siteConfig.footer ?? {};

  if (
    footerConfig.links &&
    Array.isArray(footerConfig.links) &&
    footerConfig.links.length > 0
  ) {
    const nav = el("nav", {
      className: "app-footer-nav",
      attrs: {
        "aria-label": footerConfig.navigationAriaLabel ?? "Footer navigation",
      },
    });

    const visibleLinks = footerConfig.links.filter(
      (link) => link.enabled !== false && link.hidden !== true,
    );

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
        if (link.type === LINK_TYPES.ROUTE || link.type === LINK_TYPES.PAGE) {
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
            attrs: {
              "aria-hidden": "true",
            },
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
    const logoConfig = footerConfig.logo ?? siteConfig.brand?.logo;

    if (logoConfig) {
      brandContainer.append(createFooterLogo(context, logoConfig));
    }
  }

  if (footerConfig.showCopyright !== false) {
    const copyrightText =
      footerConfig.copyright ??
      siteConfig.copyrightText ??
      `© ${new Date().getFullYear()} ${siteConfig.name ?? "HoyoAO"}`;

    brandContainer.append(
      el("span", {
        className: "app-footer-copy",
        text: copyrightText,
      }),
    );
  }

  if (brandContainer.children.length > 0) {
    footerInner.append(brandContainer);
  }

  context.registerDisposer?.(() => {
    footerInner.replaceChildren();
  });

  return Object.freeze({
    root: footerInner,
  });
} 
