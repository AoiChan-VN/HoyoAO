export const CHART_TYPES = Object.freeze({
  BAR: "bar",
  LINE: "line",
  AREA: "area",
});

const PALETTE_VARS = [
  "--color-brand-primary",
  "--color-status-success",
  "--color-status-warning",
  "--color-status-danger",
  "--color-brand-secondary",
];

function readCssVar(name, fallback) {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    return value || fallback;
  } catch {
    return fallback;
  }
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function formatCompact(value) {
  const abs = Math.abs(value);

  if (abs >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }

  if (abs >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }

  if (abs >= 1e3) {
    return `${(value / 1e3).toFixed(1)}k`;
  }

  return `${Math.round(value * 10) / 10}`;
}

function niceScale(min, max, tickCount) {
  if (min === max) {
    max = min + 1;
  }

  const range = max - min;
  const rawStep = range / Math.max(1, tickCount);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const error = rawStep / magnitude;

  let step = magnitude;

  if (error >= 7.5) {
    step = magnitude * 10;
  } else if (error >= 3.5) {
    step = magnitude * 5;
  } else if (error >= 1.5) {
    step = magnitude * 2;
  }

  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
    step,
  };
}

function resolveColor(color, index) {
  if (typeof color === "string" && color.startsWith("--")) {
    return readCssVar(color, PALETTE_VARS[index % PALETTE_VARS.length]);
  }

  if (typeof color === "string" && color) {
    return color;
  }

  return readCssVar(
    PALETTE_VARS[index % PALETTE_VARS.length],
    "#38bdf8",
  );
}

function roundedTopRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, Math.max(0, height));

  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
}

function smoothPath(ctx, points) {
  if (points.length === 0) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.x + current.x) / 2;

    ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + current.y) / 2);
  }

  const last = points[points.length - 1];

  ctx.lineTo(last.x, last.y);
}

export function createChart(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") {
    throw new TypeError("[HoyoAO Charts] createChart requires a canvas element.");
  }

  const ctx = canvas.getContext("2d");

  let chartType = options.type ?? CHART_TYPES.LINE;
  let labels = Array.isArray(options.labels) ? options.labels : [];
  let seriesList = Array.isArray(options.series) ? options.series : [];
  let hoverIndex = -1;
  let progress = 1;
  let animationFrame = 0;
  let destroyed = false;

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width, height };
  }

  function drawEmpty(width, height) {
    ctx.fillStyle = readCssVar("--color-text-muted", "#7f8998");
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Chưa có dữ liệu.", width / 2, height / 2);
  }

  function computeLayout(width, height) {
    const pad = { top: 10, right: 10, bottom: 22, left: 42 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;

    return { pad, plotWidth, plotHeight };
  }

  function computeScale() {
    let min = 0;
    let max = 0;

    for (const series of seriesList) {
      for (const value of series.data ?? []) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }

    return niceScale(Math.min(0, min), max, 4);
  }

  function drawGrid(width, height, layout, scale) {
    const { pad, plotHeight } = layout;

    ctx.strokeStyle = readCssVar(
      "--color-border-subtle",
      "rgba(148, 163, 184, 0.12)",
    );
    ctx.fillStyle = readCssVar("--color-text-muted", "#7f8998");
    ctx.lineWidth = 1;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const ticks = Math.round((scale.max - scale.min) / scale.step);

    for (let i = 0; i <= ticks; i += 1) {
      const value = scale.min + i * scale.step;
      const y = pad.top + plotHeight - (i / Math.max(1, ticks)) * plotHeight;

      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      ctx.fillText(formatCompact(value), pad.left - 6, y);
    }
  }

  function drawXLabels(width, height, layout) {
    const { pad, plotWidth } = layout;

    ctx.fillStyle = readCssVar("--color-text-muted", "#7f8998");
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const maxLabels = Math.max(2, Math.floor(plotWidth / 64));
    const step = Math.max(1, Math.ceil(labels.length / maxLabels));

    for (let i = 0; i < labels.length; i += step) {
      const x =
        chartType === CHART_TYPES.BAR
          ? pad.left + ((i + 0.5) / labels.length) * plotWidth
          : pad.left + (i / Math.max(1, labels.length - 1)) * plotWidth;

      ctx.fillText(String(labels[i] ?? ""), x, height - pad.bottom + 6);
    }
  }

  function drawBars(layout, scale) {
    const { pad, plotWidth, plotHeight } = layout;
    const bandWidth = plotWidth / Math.max(1, labels.length);
    const groupCount = Math.max(1, seriesList.length);
    const barWidth = Math.max(
      2,
      (bandWidth * 0.7) / groupCount,
    );

    const zeroY = pad.top + plotHeight - ((0 - scale.min) / (scale.max - scale.min)) * plotHeight;

    seriesList.forEach((series, seriesIndex) => {
      ctx.fillStyle = resolveColor(series.color, seriesIndex);

      (series.data ?? []).forEach((value, index) => {
        const bandX = pad.left + index * bandWidth;
        const x =
          bandX +
          bandWidth * 0.15 +
          seriesIndex * barWidth;

        const targetY =
          pad.top +
          plotHeight -
          ((value - scale.min) / (scale.max - scale.min)) * plotHeight;

        const animatedY = zeroY + (targetY - zeroY) * progress;
        const height = Math.abs(zeroY - animatedY);
        const y = Math.min(zeroY, animatedY);

        roundedTopRect(ctx, x, y, barWidth, height, 3);
        ctx.fill();
      });
    });
  }

  function seriesPoints(series, layout, scale) {
    const { pad, plotWidth, plotHeight } = layout;
    const baseline =
      pad.top +
      plotHeight -
      ((0 - scale.min) / (scale.max - scale.min)) * plotHeight;

    return (series.data ?? []).map((value, index) => {
      const targetY =
        pad.top +
        plotHeight -
        ((value - scale.min) / (scale.max - scale.min)) * plotHeight;

      return {
        x: pad.left + (index / Math.max(1, labels.length - 1)) * plotWidth,
        y: baseline + (targetY - baseline) * progress,
        value,
      };
    });
  }

  function drawLineOrArea(layout, scale) {
    seriesList.forEach((series, seriesIndex) => {
      const color = resolveColor(series.color, seriesIndex);
      const points = seriesPoints(series, layout, scale);

      if (points.length === 0) {
        return;
      }

      if (chartType === CHART_TYPES.AREA) {
        const { pad, plotHeight } = layout;
        const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotHeight);

        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, `${color}00`);

        smoothPath(ctx, points);
        ctx.lineTo(points[points.length - 1].x, pad.top + plotHeight);
        ctx.lineTo(points[0].x, pad.top + plotHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      smoothPath(ctx, points);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      if (points.length <= 24) {
        ctx.fillStyle = color;

        for (const point of points) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  function drawHover(layout, scale) {
    if (hoverIndex < 0 || hoverIndex >= labels.length) {
      return;
    }

    const { pad, plotWidth, plotHeight } = layout;

    const x =
      chartType === CHART_TYPES.BAR
        ? pad.left + ((hoverIndex + 0.5) / labels.length) * plotWidth
        : pad.left + (hoverIndex / Math.max(1, labels.length - 1)) * plotWidth;

    ctx.strokeStyle = readCssVar("--color-border-strong", "rgba(148,163,184,0.32)");
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    const title = String(labels[hoverIndex] ?? "");
    const lines = seriesList.map((series, index) => ({
      color: resolveColor(series.color, index),
      text: `${series.name ?? "Series"}: ${formatCompact(
        series.data?.[hoverIndex] ?? 0,
      )}`,
    }));

    ctx.font = "11px system-ui, sans-serif";

    let boxWidth = ctx.measureText(title).width;

    for (const line of lines) {
      boxWidth = Math.max(boxWidth, ctx.measureText(line.text).width + 14);
    }

    boxWidth += 20;

    const boxHeight = 24 + lines.length * 16;
    let boxX = x + 10;
    let boxY = pad.top + 8;

    const width = pad.left + plotWidth + pad.right;

    if (boxX + boxWidth > width - 4) {
      boxX = x - boxWidth - 10;
    }

    ctx.fillStyle = readCssVar("--color-bg-elevated", "rgba(20,26,38,0.96)");
    ctx.strokeStyle = readCssVar("--color-border-default", "rgba(148,163,184,0.18)");
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8)
      : ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = readCssVar("--color-text-primary", "#f8fafc");
    ctx.fillText(title, boxX + 10, boxY + 6);

    lines.forEach((line, index) => {
      const y = boxY + 22 + index * 16;

      ctx.fillStyle = line.color;
      ctx.fillRect(boxX + 10, y + 3, 8, 8);

      ctx.fillStyle = readCssVar("--color-text-secondary", "#c3cbd8");
      ctx.fillText(line.text, boxX + 24, y);
    });
  }

  function render() {
    if (destroyed) {
      return;
    }

    const { width, height } = sizeCanvas();

    ctx.clearRect(0, 0, width, height);

    if (!seriesList.length || !labels.length) {
      drawEmpty(width, height);
      return;
    }

    const layout = computeLayout(width, height);

    if (layout.plotWidth <= 0 || layout.plotHeight <= 0) {
      return;
    }

    const scale = computeScale();

    drawGrid(width, height, layout, scale);
    drawXLabels(width, height, layout);

    if (chartType === CHART_TYPES.BAR) {
      drawBars(layout, scale);
    } else {
      drawLineOrArea(layout, scale);
    }

    drawHover(layout, scale);
  }

  function animate() {
    cancelAnimationFrame(animationFrame);

    if (prefersReducedMotion() || options.animate === false) {
      progress = 1;
      render();
      return;
    }

    const start = performance.now();
    const duration = 480;

    progress = 0;

    const step = (now) => {
      if (destroyed) {
        return;
      }

      const t = Math.min(1, (now - start) / duration);

      progress = 1 - Math.pow(1 - t, 3);

      render();

      if (t < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
  }

  function onPointerMove(event) {
    if (!labels.length) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const { pad, plotWidth } = computeLayout(rect.width, rect.height);

    const ratio = (x - pad.left) / Math.max(1, plotWidth);
    const index =
      chartType === CHART_TYPES.BAR
        ? Math.floor(ratio * labels.length)
        : Math.round(ratio * (labels.length - 1));

    const clamped = Math.max(0, Math.min(labels.length - 1, index));

    if (clamped !== hoverIndex) {
      hoverIndex = clamped;
      render();

      if (typeof options.onHover === "function") {
        options.onHover(hoverIndex);
      }
    }
  }

  function onPointerLeave() {
    if (hoverIndex !== -1) {
      hoverIndex = -1;
      render();
    }
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);

  const resizeObserver =
    typeof ResizeObserver !== "undefined" && canvas.parentElement
      ? new ResizeObserver(() => render())
      : null;

  if (resizeObserver) {
    resizeObserver.observe(canvas.parentElement);
  }

  function setData(nextLabels, nextSeries) {
    labels = Array.isArray(nextLabels) ? nextLabels : [];
    seriesList = Array.isArray(nextSeries) ? nextSeries : [];
    hoverIndex = -1;

    animate();
  }

  function setType(nextType) {
    chartType = nextType;
    render();
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    cancelAnimationFrame(animationFrame);

    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);

    resizeObserver?.disconnect();
  }

  if (options.labels || options.series) {
    animate();
  } else {
    render();
  }

  return Object.freeze({
    canvas,
    render,
    setData,
    setType,
    destroy,
  });
}

export default createChart; 
