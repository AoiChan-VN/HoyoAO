import { APP_IDS } from "../core/constants.js";

function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);

  const {
    id,
    className,
    text,
    attrs = {},
    dataset = {},
    props = {},
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

  for (const [key, value] of Object.entries(props)) {
    element[key] = value;
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) {
      continue;
    }

    element.append(child);
  }

  return element;
}

export function renderShell(root) {
  if (!root || !(root instanceof HTMLElement)) {
    throw new Error("[HoyoAO] Shell requires a valid root element.");
  }

  root.replaceChildren();

  root.classList.add("app-shell");
  root.dataset.shellReady = "true";

  const announcer = createElement("div", {
    id: APP_IDS.ANNOUNCER,
    className: "app-visually-hidden",
    attrs: {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  });

  const headerLeft = createElement("div", {
    className: "app-header-left nav-group",
    dataset: {
      region: "header-left",
    },
  });

  const headerRight = createElement("div", {
    className: "app-header-right nav-group",
    dataset: {
      region: "header-right",
    },
  });

  const headerInner = createElement(
    "div",
    {
      className: "app-header-inner",
    },
    [headerLeft, headerRight],
  );

  const header = createElement(
    "header",
    {
      id: APP_IDS.HEADER,
      className: "app-header",
      attrs: {
        role: "banner",
      },
    },
    [headerInner],
  );

  const environment = createElement("div", {
    className: "app-environment",
    dataset: {
      layer: "environment",
    },
    attrs: {
      "aria-hidden": "true",
    },
  });

  const content = createElement("section", {
    id: APP_IDS.CONTENT,
    className: "app-content app-container",
    attrs: {
      role: "region",
      "aria-label": "Nội dung trang",
      tabindex: "-1",
    },
    dataset: {
      region: "page-content",
    },
  });

  const main = createElement(
    "main",
    {
      id: APP_IDS.MAIN,
      className: "app-main",
    },
    [environment, content],
  );

  const footerInner = createElement("div", {
    className: "app-footer-inner",
    dataset: {
      region: "footer-inner",
    },
  });

  const footer = createElement(
    "footer",
    {
      id: APP_IDS.FOOTER,
      className: "app-footer",
      attrs: {
        role: "contentinfo",
      },
    },
    [footerInner],
  );

  const panelLayer = createElement("div", {
    className: "app-panel-layer",
    dataset: {
      layer: "panel",
    },
  });

  const modalLayer = createElement("div", {
    className: "app-modal-layer",
    dataset: {
      layer: "modal",
    },
  });

  const toastLayer = createElement("div", {
    className: "app-toast-layer",
    attrs: {
      role: "status",
      "aria-live": "polite",
    },
    dataset: {
      layer: "toast",
    },
  });

  root.append(
    header,
    main,
    footer,
    panelLayer,
    modalLayer,
    toastLayer,
    announcer,
  );

  return Object.freeze({
    root,
    header,
    headerInner,
    headerLeft,
    headerRight,
    main,
    environment,
    content,
    footer,
    footerInner,
    panelLayer,
    modalLayer,
    toastLayer,
    announcer,
  });
} 
