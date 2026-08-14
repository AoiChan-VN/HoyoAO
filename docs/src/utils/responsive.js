import { BREAKPOINTS, MEDIA_QUERIES } from "../core/constants.js";

const PREFERENCE_QUERIES = Object.freeze([
  "(prefers-reduced-motion: reduce)",
  "(prefers-color-scheme: dark)",
  "(pointer: coarse)",
]);

function canUseDom() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  );
}

function resolveBreakpoint(width) {
  if (width >= BREAKPOINTS.ULTRA) {
    return "ultra";
  }

  if (width >= BREAKPOINTS.XXL) {
    return "xxl";
  }

  if (width >= BREAKPOINTS.XL) {
    return "xl";
  }

  if (width >= BREAKPOINTS.LG) {
    return "lg";
  }

  if (width >= BREAKPOINTS.MD) {
    return "md";
  }

  if (width >= BREAKPOINTS.SM) {
    return "sm";
  }

  return "xs";
}

function createStaticState() {
  return Object.freeze({
    width: 0,
    height: 0,
    orientation: "landscape",
    aspect: 0,
    dpr: 1,
    breakpoint: "xs",
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isWide: false,
    isUltra: false,
    isTouch: false,
    reducedMotion: false,
    darkMode: false,
  });
}

function isSameState(a, b) {
  if (!a || !b) {
    return false;
  }

  return (
    a.width === b.width &&
    a.height === b.height &&
    a.orientation === b.orientation &&
    a.dpr === b.dpr &&
    a.breakpoint === b.breakpoint &&
    a.isTouch === b.isTouch &&
    a.reducedMotion === b.reducedMotion &&
    a.darkMode === b.darkMode
  );
}

export function createMediaQuery(query) {
  if (!canUseDom()) {
    return Object.freeze({
      query,
      get matches() {
        return false;
      },
      subscribe() {
        return () => {};
      },
      destroy() {},
    });
  }

  const mediaQueryList = window.matchMedia(query);
  const listeners = new Set();

  function handleChange(event) {
    for (const listener of Array.from(listeners)) {
      try {
        listener(event.matches, event);
      } catch (error) {
        console.error("[HoyoAO] Media query listener failed.", error);
      }
    }
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("[HoyoAO] Media query listener must be a function.");
    }

    if (listeners.size === 0) {
      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", handleChange);
      } else if (typeof mediaQueryList.addListener === "function") {
        mediaQueryList.addListener(handleChange);
      }
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        if (typeof mediaQueryList.removeEventListener === "function") {
          mediaQueryList.removeEventListener("change", handleChange);
        } else if (typeof mediaQueryList.removeListener === "function") {
          mediaQueryList.removeListener(handleChange);
        }
      }
    };
  }

  function destroy() {
    listeners.clear();

    if (typeof mediaQueryList.removeEventListener === "function") {
      mediaQueryList.removeEventListener("change", handleChange);
    } else if (typeof mediaQueryList.removeListener === "function") {
      mediaQueryList.removeListener(handleChange);
    }
  }

  return Object.freeze({
    query,
    get matches() {
      return mediaQueryList.matches;
    },
    subscribe,
    destroy,
  });
}

export function createResponsiveManager(options = {}) {
  if (!canUseDom()) {
    const staticState = createStaticState();

    return Object.freeze({
      getState() {
        return staticState;
      },
      getViewport() {
        return {
          width: staticState.width,
          height: staticState.height,
          dpr: staticState.dpr,
          orientation: staticState.orientation,
        };
      },
      getBreakpoint() {
        return staticState.breakpoint;
      },
      matches() {
        return false;
      },
      isAtLeast() {
        return false;
      },
      isMobile() {
        return true;
      },
      isTablet() {
        return false;
      },
      isDesktop() {
        return false;
      },
      isWide() {
        return false;
      },
      isUltra() {
        return false;
      },
      subscribe() {
        return () => {};
      },
      destroy() {},
    });
  }

  const listeners = new Set();
  const disposers = [];

  let rafId = 0;
  let destroyed = false;
  let state = computeState();

  function computeState() {
    const width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      0;

    const height =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      0;

    const dpr = window.devicePixelRatio || 1;
    const orientation = width >= height ? "landscape" : "portrait";
    const aspect = height > 0 ? width / height : 0;
    const breakpoint = resolveBreakpoint(width);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const darkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    return Object.freeze({
      width,
      height,
      orientation,
      aspect,
      dpr,
      breakpoint,
      isMobile: width < BREAKPOINTS.MD,
      isTablet: width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG,
      isDesktop: width >= BREAKPOINTS.LG,
      isWide: width >= BREAKPOINTS.XXL,
      isUltra: width >= BREAKPOINTS.ULTRA,
      isTouch,
      reducedMotion,
      darkMode,
    });
  }

  function notify(previousState) {
    for (const listener of Array.from(listeners)) {
      try {
        listener(state, previousState);
      } catch (error) {
        console.error("[HoyoAO] Responsive listener failed.", error);
      }
    }
  }

  function update() {
    if (destroyed) {
      return;
    }

    const nextState = computeState();

    if (isSameState(state, nextState)) {
      return;
    }

    const previousState = state;

    state = nextState;

    notify(previousState);
  }

  function scheduleUpdate() {
    if (destroyed) {
      return;
    }

    cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(update);
  }

  function matches(query) {
    if (!query || typeof query !== "string") {
      return false;
    }

    const resolvedQuery =
      MEDIA_QUERIES[query] ??
      MEDIA_QUERIES[query.toUpperCase()] ??
      query;

    return window.matchMedia(resolvedQuery).matches;
  }

  function isAtLeast(breakpoint) {
    const key = String(breakpoint ?? "").toUpperCase();
    const minWidth = BREAKPOINTS[key];

    if (!Number.isFinite(minWidth)) {
      throw new Error(
        `[HoyoAO] Unknown breakpoint "${breakpoint}" in responsive manager.`,
      );
    }

    return state.width >= minWidth;
  }

  function subscribe(listener, { immediate = false } = {}) {
    if (typeof listener !== "function") {
      throw new TypeError("[HoyoAO] Responsive listener must be a function.");
    }

    listeners.add(listener);

    if (immediate) {
      try {
        listener(state, null);
      } catch (error) {
        console.error("[HoyoAO] Responsive listener failed.", error);
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    cancelAnimationFrame(rafId);

    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("orientationchange", scheduleUpdate);

    if (screen.orientation?.addEventListener) {
      screen.orientation.removeEventListener("change", scheduleUpdate);
    }

    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error("[HoyoAO] Responsive disposer failed.", error);
      }
    }

    listeners.clear();
  }

  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("orientationchange", scheduleUpdate);

  if (screen.orientation?.addEventListener) {
    screen.orientation.addEventListener("change", scheduleUpdate);
  }

  for (const query of PREFERENCE_QUERIES) {
    const mediaQuery = window.matchMedia(query);

    const handlePreferenceChange = () => {
      scheduleUpdate();
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handlePreferenceChange);

      disposers.push(() => {
        mediaQuery.removeEventListener("change", handlePreferenceChange);
      });
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handlePreferenceChange);

      disposers.push(() => {
        mediaQuery.removeListener(handlePreferenceChange);
      });
    }
  }

  return Object.freeze({
    getState() {
      return state;
    },

    getViewport() {
      return {
        width: state.width,
        height: state.height,
        dpr: state.dpr,
        orientation: state.orientation,
      };
    },

    getBreakpoint() {
      return state.breakpoint;
    },

    matches,
    isAtLeast,

    isMobile() {
      return state.isMobile;
    },

    isTablet() {
      return state.isTablet;
    },

    isDesktop() {
      return state.isDesktop;
    },

    isWide() {
      return state.isWide;
    },

    isUltra() {
      return state.isUltra;
    },

    subscribe,
    destroy,
  });
}

export function syncResponsiveDataset(
  manager,
  element = document.documentElement,
) {
  if (!manager || typeof manager.subscribe !== "function" || !element) {
    return () => {};
  }

  function applyState(state) {
    element.dataset.breakpoint = state.breakpoint;
    element.dataset.orientation = state.orientation;
    element.dataset.touch = String(state.isTouch);
    element.dataset.reducedMotion = String(state.reducedMotion);
    element.dataset.darkMode = String(state.darkMode);
  }

  const dispose = manager.subscribe(applyState, {
    immediate: true,
  });

  return dispose;
}

export default createResponsiveManager; 
