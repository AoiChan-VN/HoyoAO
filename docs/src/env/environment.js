import {
  APP_EVENTS,
  APP_IDS,
  PAGE_MODES,
} from "../core/constants.js";

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_motion;
  uniform vec3 u_color_top;
  uniform vec3 u_color_bottom;
  uniform vec3 u_color_accent;

  void main() {
    vec2 uv = gl_FragCoord.xy / max(u_resolution, vec2(1.0, 1.0));
    float time = u_time * u_motion;

    float wave =
      sin(uv.x * 3.0 + time * 0.2) * 0.04 +
      sin(uv.y * 6.0 - time * 0.15) * 0.025;

    float gradient = clamp(uv.y + wave, 0.0, 1.0);
    vec3 color = mix(u_color_bottom, u_color_top, gradient);

    vec2 center = vec2(0.5, 0.35);
    float distanceToCenter = distance(uv, center);
    float glow = smoothstep(0.75, 0.0, distanceToCenter);

    color += u_color_accent * glow * 0.06;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const MAX_CANVAS_DIMENSION = 4096;

function parseCssColor(value, fallback) {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx) {
      return fallback;
    }

    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);

    const data = ctx.getImageData(0, 0, 1, 1).data;

    return [
      data[0] / 255,
      data[1] / 255,
      data[2] / 255,
    ];
  } catch (error) {
    return fallback;
  }
}

function readEnvironmentColors() {
  const rootStyles = getComputedStyle(document.documentElement);

  const top = rootStyles.getPropertyValue("--color-bg-page").trim();
  const bottom = rootStyles.getPropertyValue("--color-bg-canvas").trim();
  const accent = rootStyles.getPropertyValue("--color-brand-primary").trim();

  return {
    top: parseCssColor(top, [0.027, 0.039, 0.063]),
    bottom: parseCssColor(bottom, [0.02, 0.027, 0.043]),
    accent: parseCssColor(accent, [0.22, 0.74, 0.97]),
  };
}

export function mountEnvironment(context) {
  const config = context.config?.["3d"] ?? {};

  if (config.enabled === false) {
    return null;
  }

  const container = context.shell?.environment;

  if (!container) {
    throw new Error("[HoyoAO] Environment requires shell.environment container.");
  }

  const canvas = document.createElement("canvas");

  canvas.id = APP_IDS.ENV_CANVAS;
  canvas.className = "app-environment-canvas";

  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    zIndex: "0",
    overflow: "hidden",
    pointerEvents: "none",
  });

  Object.assign(canvas.style, {
    display: "block",
    width: "100%",
    height: "100%",
  });

  if (context.shell.main) {
    context.shell.main.style.position = "relative";
    context.shell.main.style.zIndex = "1";
  }

  if (context.shell.content) {
    context.shell.content.style.position = "relative";
    context.shell.content.style.zIndex = "1";
  }

  container.append(canvas);

  const disposers = [];

  let destroyed = false;
  let gl = null;
  let resources = null;
  let colors = readEnvironmentColors();

  let running = false;
  let rafId = 0;
  let startTime = performance.now();
  let resizeFrame = 0;

  let visible = document.visibilityState === "visible";
  let routeActive = false;

  const dprCap =
    config.quality === "low"
      ? 1
      : Number.isFinite(config.dprCap)
        ? config.dprCap
        : 2;

  const glOptions = {
    alpha: config.alpha !== false,
    antialias: config.antialias !== false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: config.preserveDrawingBuffer === true,
    powerPreference:
      config.quality === "low" ? "low-power" : "high-performance",
  };

  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  let motion = motionQuery?.matches ? 0 : 1;

  function emit(event, payload) {
    try {
      context.eventBus?.emit?.(event, payload);
    } catch (error) {
      console.error("[HoyoAO] Environment event emission failed.", error);
    }
  }

  function applyCssFallback() {
    canvas.style.display = "none";
    container.style.background =
      "linear-gradient(to top, var(--color-bg-canvas), var(--color-bg-page))";
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);

      throw new Error(`[HoyoAO] Shader compilation failed: ${info}`);
    }

    return shader;
  }

  function cleanupGL() {
    if (!gl) {
      resources = null;
      return;
    }

    if (gl.isContextLost?.()) {
      resources = null;
      return;
    }

    if (resources) {
      if (resources.buffer) {
        gl.deleteBuffer(resources.buffer);
      }

      if (resources.program) {
        gl.deleteProgram(resources.program);
      }

      if (resources.vertexShader) {
        gl.deleteShader(resources.vertexShader);
      }

      if (resources.fragmentShader) {
        gl.deleteShader(resources.fragmentShader);
      }
    }

    resources = null;
  }

  function initGL() {
    cleanupGL();

    gl =
      canvas.getContext("webgl2", glOptions) ||
      canvas.getContext("webgl", glOptions);

    if (!gl) {
      applyCssFallback();
      return false;
    }

    try {
      const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fragmentShader = compileShader(
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER_SOURCE,
      );

      const program = gl.createProgram();

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);

        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        throw new Error(`[HoyoAO] WebGL program link failed: ${info}`);
      }

      const buffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );

      const positionLocation = gl.getAttribLocation(program, "a_position");

      resources = {
        program,
        vertexShader,
        fragmentShader,
        buffer,
        locations: {
          position: positionLocation,
          resolution: gl.getUniformLocation(program, "u_resolution"),
          time: gl.getUniformLocation(program, "u_time"),
          motion: gl.getUniformLocation(program, "u_motion"),
          colorTop: gl.getUniformLocation(program, "u_color_top"),
          colorBottom: gl.getUniformLocation(program, "u_color_bottom"),
          colorAccent: gl.getUniformLocation(program, "u_color_accent"),
        },
      };

      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);

      return true;
    } catch (error) {
      emit(APP_EVENTS.ENV_ERROR, {
        error,
      });

      applyCssFallback();

      return false;
    }
  }

  function resize() {
    if (!canvas) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    let width = Math.floor(window.innerWidth * dpr);
    let height = Math.floor(window.innerHeight * dpr);

    width = Math.max(1, Math.min(width, MAX_CANVAS_DIMENSION));
    height = Math.max(1, Math.min(height, MAX_CANVAS_DIMENSION));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (gl && !gl.isContextLost?.()) {
      gl.viewport(0, 0, width, height);
    }

    emit(APP_EVENTS.ENV_RESIZE, {
      width,
      height,
      dpr,
    });
  }

  function render(time) {
    if (!gl || !resources || gl.isContextLost?.()) {
      return;
    }

    const { program, buffer, locations } = resources;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(locations.resolution, canvas.width, canvas.height);
    gl.uniform1f(locations.time, time);
    gl.uniform1f(locations.motion, motion);
    gl.uniform3fv(locations.colorTop, colors.top);
    gl.uniform3fv(locations.colorBottom, colors.bottom);
    gl.uniform3fv(locations.colorAccent, colors.accent);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function stop() {
    if (!running) {
      return;
    }

    running = false;
    cancelAnimationFrame(rafId);
  }

  function frame(now) {
    if (!running) {
      return;
    }

    const time = (now - startTime) / 1000;

    render(time);

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !gl || !resources) {
      return;
    }

    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function shouldBeRunning() {
    return Boolean(
      gl &&
        resources &&
        routeActive &&
        visible &&
        !destroyed &&
        !gl.isContextLost?.(),
    );
  }

  function refresh() {
    container.style.visibility = routeActive ? "visible" : "hidden";
    container.setAttribute("aria-hidden", String(!routeActive));

    if (!shouldBeRunning()) {
      stop();
      return;
    }

    if (motion === 0) {
      stop();
      render(0);
      return;
    }

    start();
  }

  function onResize() {
    cancelAnimationFrame(resizeFrame);

    resizeFrame = requestAnimationFrame(() => {
      resize();
      refresh();
    });
  }

  function onVisibilityChange() {
    visible = document.visibilityState === "visible";

    emit(APP_EVENTS.ENV_VISIBILITY_CHANGE, {
      visible,
    });

    refresh();
  }

  function onMotionPreferenceChange() {
    motion = motionQuery?.matches ? 0 : 1;

    refresh();
  }

  function onThemeChanged() {
    colors = readEnvironmentColors();

    if (!gl) {
      applyCssFallback();
    }

    refresh();
  }

  function onContextLost(event) {
    event.preventDefault();

    stop();

    emit(APP_EVENTS.ENV_ERROR, {
      error: new Error("[HoyoAO] WebGL context lost."),
    });
  }

  function onContextRestored() {
    initGL();
    resize();
    refresh();

    emit(APP_EVENTS.ENV_READY, {
      restored: true,
    });
  }

  function updateRouteMode(mode) {
    routeActive =
      config.alwaysOn === true || mode === PAGE_MODES.THREE_D;

    refresh();
  }

  emit(APP_EVENTS.ENV_BEFORE_INIT, {
    canvas,
    container,
    config,
  });

  const glInitialized = initGL();

  resize();

  if (glInitialized) {
    emit(APP_EVENTS.ENV_READY, {
      canvas,
      container,
      gl,
    });
  } else {
    emit(APP_EVENTS.ENV_READY, {
      canvas,
      container,
      fallback: true,
    });
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  document.addEventListener("visibilitychange", onVisibilityChange);

  canvas.addEventListener("webglcontextlost", onContextLost, false);
  canvas.addEventListener("webglcontextrestored", onContextRestored, false);

  if (motionQuery) {
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionPreferenceChange);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener(onMotionPreferenceChange);
    }
  }

  if (context.eventBus?.on) {
    const disposeTheme = context.eventBus.on(
      APP_EVENTS.THEME_CHANGED,
      onThemeChanged,
    );

    disposers.push(disposeTheme);
  }

  if (context.store?.subscribeSelector) {
    const currentMode = context.store.getState()?.route?.mode ?? null;

    updateRouteMode(currentMode);

    const disposeRoute = context.store.subscribeSelector(
      (state) => state.route.mode,
      updateRouteMode,
    );

    disposers.push(disposeRoute);
  } else {
    routeActive = true;
  }

  refresh();

  const controller = Object.freeze({
    canvas,
    container,
    getGL() {
      return gl;
    },
    isActive() {
      return routeActive;
    },
    isRunning() {
      return running;
    },
    resize,
    refresh,
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;

      emit(APP_EVENTS.ENV_BEFORE_DESTROY, {
        canvas,
        container,
      });

      stop();

      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);

      document.removeEventListener("visibilitychange", onVisibilityChange);

      canvas.removeEventListener("webglcontextlost", onContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
        false,
      );

      if (motionQuery) {
        if (typeof motionQuery.removeEventListener === "function") {
          motionQuery.removeEventListener("change", onMotionPreferenceChange);
        } else if (typeof motionQuery.removeListener === "function") {
          motionQuery.removeListener(onMotionPreferenceChange);
        }
      }

      for (const dispose of disposers.splice(0)) {
        try {
          dispose();
        } catch (error) {
          console.error("[HoyoAO] Environment disposer failed.", error);
        }
      }

      cleanupGL();

      const loseContextExtension = gl?.getExtension?.("WEBGL_lose_context");

      if (loseContextExtension) {
        try {
          loseContextExtension.loseContext();
        } catch (error) {
          console.error("[HoyoAO] WebGL context cleanup failed.", error);
        }
      }

      gl = null;

      container.replaceChildren();
      container.removeAttribute("style");

      emit(APP_EVENTS.ENV_DESTROYED, {
        canvas,
        container,
      });
    },
  });

  if (context.services) {
    context.services.environment = controller;
  }

  context.registerDisposer?.(() => {
    controller.destroy();
  });

  return controller;
} 
