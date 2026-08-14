const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function isDomNode(value) {
  return typeof Node !== "undefined" && value instanceof Node;
}

function normalizeClassName(className) {
  if (Array.isArray(className)) {
    return className.filter(Boolean).join(" ");
  }

  return className ?? "";
}

export function appendChildren(target, children) {
  if (!target) {
    return target;
  }

  const list = Array.isArray(children) ? children : [children];

  for (const child of list) {
    if (child === undefined || child === null || child === false) {
      continue;
    }

    if (Array.isArray(child)) {
      appendChildren(target, child);
      continue;
    }

    if (isDomNode(child)) {
      target.appendChild(child);
      continue;
    }

    target.appendChild(document.createTextNode(String(child)));
  }

  return target;
}

export function createFragment(children = []) {
  const fragment = document.createDocumentFragment();

  appendChildren(fragment, children);

  return fragment;
}

export function setAttributes(element, attrs = {}) {
  if (!element || !attrs || typeof attrs !== "object") {
    return element;
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

  return element;
}

export function setDataset(element, dataset = {}) {
  if (!element || !dataset || typeof dataset !== "object") {
    return element;
  }

  for (const [key, value] of Object.entries(dataset)) {
    if (value === undefined || value === null) {
      continue;
    }

    element.dataset[key] = String(value);
  }

  return element;
}

export function setStyles(element, styles = {}) {
  if (!element || !styles || typeof styles !== "object") {
    return element;
  }

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) {
      continue;
    }

    element.style[key] = value;
  }

  return element;
}

export function setProperties(element, props = {}) {
  if (!element || !props || typeof props !== "object") {
    return element;
  }

  for (const [key, value] of Object.entries(props)) {
    element[key] = value;
  }

  return element;
}

export function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);

  const {
    id,
    className,
    text,
    attrs = {},
    dataset = {},
    props = {},
    styles = {},
  } = options;

  if (id) {
    element.id = id;
  }

  const normalizedClassName = normalizeClassName(className);

  if (normalizedClassName) {
    element.className = normalizedClassName;
  }

  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }

  setAttributes(element, attrs);
  setDataset(element, dataset);
  setProperties(element, props);
  setStyles(element, styles);
  appendChildren(element, children);

  return element;
}

export const el = createElement;

export function setText(element, text) {
  if (!element) {
    return element;
  }

  element.replaceChildren();

  if (text !== undefined && text !== null) {
    element.appendChild(document.createTextNode(String(text)));
  }

  return element;
}

export function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }

  return element;
}

export function removeElement(element) {
  if (element && typeof element.remove === "function") {
    element.remove();
  }

  return element;
}

export function replaceElement(oldElement, newElement) {
  if (oldElement && newElement && oldElement.replaceWith) {
    oldElement.replaceWith(newElement);
  }

  return newElement;
}

export function mount(target, node, { replace = false } = {}) {
  if (!target || !node) {
    return node;
  }

  if (replace) {
    target.replaceChildren(node);
  } else {
    target.append(node);
  }

  return node;
}

export function unmount(node) {
  return removeElement(node);
}

export function setHidden(element, hidden) {
  if (!element) {
    return element;
  }

  element.hidden = Boolean(hidden);

  return element;
}

export function addClass(element, className) {
  if (!element || !className) {
    return element;
  }

  element.classList.add(...normalizeClassName(className).split(/\s+/).filter(Boolean));

  return element;
}

export function removeClass(element, className) {
  if (!element || !className) {
    return element;
  }

  element.classList.remove(...normalizeClassName(className).split(/\s+/).filter(Boolean));

  return element;
}

export function toggleClass(element, className, force) {
  if (!element || !className) {
    return element;
  }

  const classes = normalizeClassName(className).split(/\s+/).filter(Boolean);

  for (const token of classes) {
    element.classList.toggle(token, force);
  }

  return element;
}

export function isVisible(element) {
  if (!element) {
    return false;
  }

  if (element.hidden) {
    return false;
  }

  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const computedStyle = getComputedStyle(element);

  if (computedStyle.display === "none") {
    return false;
  }

  if (computedStyle.visibility === "hidden") {
    return false;
  }

  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility();
  }

  return element.getClientRects().length > 0;
}

export function getFocusableElements(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => isVisible(element),
  );
}

function ensureFocusable(element) {
  if (!element) {
    return null;
  }

  if (element === document.body) {
    return element;
  }

  if (
    element instanceof HTMLElement &&
    !element.hasAttribute("tabindex")
  ) {
    element.setAttribute("tabindex", "-1");
  }

  return element;
}

export function focusFirstFocusable(container, fallback = container) {
  if (!container) {
    return null;
  }

  const focusableElements = getFocusableElements(container);
  const target = focusableElements[0] ?? fallback;

  const focusableTarget = ensureFocusable(target);

  if (focusableTarget && typeof focusableTarget.focus === "function") {
    focusableTarget.focus({ preventScroll: true });
  }

  return focusableTarget ?? null;
}

export function createFocusTrap(container, options = {}) {
  const {
    initialFocus = null,
    restoreFocus = true,
    onEscape = null,
  } = options;

  let active = false;
  let previouslyFocusedElement = null;

  function resolveInitialFocusTarget() {
    if (!initialFocus) {
      return getFocusableElements(container)[0] ?? container;
    }

    if (typeof initialFocus === "function") {
      return initialFocus();
    }

    if (typeof initialFocus === "string") {
      return container.querySelector(initialFocus);
    }

    if (isDomNode(initialFocus)) {
      return initialFocus;
    }

    return container;
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && typeof onEscape === "function") {
      onEscape(event);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) {
      event.preventDefault();

      const focusableContainer = ensureFocusable(container);

      focusableContainer?.focus({ preventScroll: true });

      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement;

    if (event.shiftKey) {
      if (currentElement === firstElement || currentElement === container) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }

      return;
    }

    if (currentElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  }

  function activate() {
    if (active || !container) {
      return;
    }

    active = true;
    previouslyFocusedElement = document.activeElement;

    document.addEventListener("keydown", handleKeyDown, true);

    requestAnimationFrame(() => {
      const target = ensureFocusable(resolveInitialFocusTarget());

      target?.focus({ preventScroll: true });
    });
  }

  function deactivate() {
    if (!active) {
      return;
    }

    active = false;

    document.removeEventListener("keydown", handleKeyDown, true);

    if (
      restoreFocus &&
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus({ preventScroll: true });
    }

    previouslyFocusedElement = null;
  }

  function isActive() {
    return active;
  }

  return Object.freeze({
    activate,
    deactivate,
    isActive,
  });
}

export function on(target, type, listener, options) {
  if (!target || typeof target.addEventListener !== "function") {
    return () => {};
  }

  target.addEventListener(type, listener, options);

  return () => {
    target.removeEventListener(type, listener, options);
  };
}

export function createSvg(paths, options = {}) {
  const {
    viewBox = "0 0 24 24",
    className = "nav-icon",
    attrs = {},
  } = options;

  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  setAttributes(svg, {
    viewBox,
    "aria-hidden": "true",
    focusable: "false",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    ...attrs,
  });

  const normalizedClassName = normalizeClassName(className);

  if (normalizedClassName) {
    svg.setAttribute("class", normalizedClassName);
  }

  if (typeof paths === "string") {
    svg.innerHTML = paths;
  } else {
    appendChildren(svg, paths);
  }

  return svg;
} 
