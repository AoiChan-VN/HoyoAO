/**
 * Main Visualization (§13, §77)
 *
 * A Canvas activity stream answering:
 *   "What data is entering the system, when, and from which domains?"
 *
 *   - Each bar = one indexed packet, positioned by timestamp.
 *   - Color = domain (system-metrics / network-event / app-event).
 *   - Overlay line = rolling packet-rate trend.
 *
 * Not decorative — every element encodes data (§77).
 * Respects reduced-motion (§96). Cleans up RAF + observer (§74).
 */
export function createMainVisualization(options = {}) {
  const { store, reducedMotion = false } = options;

  const container = document.createElement('div');
  container.className = 'dashboard__viz';

  const canvas = document.createElement('canvas');
  canvas.className = 'dashboard__viz-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Indexed data activity over time');
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Resolve design tokens once (§21) — Canvas cannot read CSS vars directly.
  const rootStyles = getComputedStyle(document.documentElement);
  const tok = (name, fallback) =>
    (rootStyles.getPropertyValue(name) || '').trim() || fallback;

  const DOMAIN_COLORS = {
    'system-metrics': tok('--color-accent', '#3b82f6'),
    'network-event': tok('--color-info', '#06b6d4'),
    'app-event': tok('--color-success', '#10b981'),
  };
  const FALLBACK_COLOR = tok('--color-text-muted', '#64748b');
  const BORDER_COLOR = tok('--color-border', '#1e293b');
  const TEXT_MUTED = tok('--color-text-muted', '#64748b');
  const RATE_COLOR = tok('--color-text-secondary', '#94a3b8');
  const FONT = tok('--font-family', 'sans-serif');

  const WINDOW_MS = 60000; // show last 60 seconds
  const RATE_BUCKETS = 12;

  let rafId = null;
  let resizeObserver = null;
  let unsubscribe = null;
  let cssWidth = 0;
  let cssHeight = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    const packets = store.getPackets();
    const now = Date.now();
    const start = now - WINDOW_MS;
    const baselineY = cssHeight - 24;

    // baseline
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baselineY + 0.5);
    ctx.lineTo(cssWidth, baselineY + 0.5);
    ctx.stroke();

    if (packets.length === 0) return;

    // bars: one per packet, color by domain
    for (const p of packets) {
      const t = p.metadata.timestamp;
      if (t < start || t > now) continue;
      const x = ((t - start) / WINDOW_MS) * cssWidth;
      const domain = p.metadata.domain || 'unclassified';
      ctx.fillStyle = DOMAIN_COLORS[domain] || FALLBACK_COLOR;
      ctx.fillRect(x, baselineY - 24, 3, 24);
    }

    // rolling rate trend line (meaningful second dimension)
    const bucketCounts = new Array(RATE_BUCKETS).fill(0);
    for (const p of packets) {
      const t = p.metadata.timestamp;
      if (t < start || t > now) continue;
      const idx = Math.min(
        RATE_BUCKETS - 1,
        Math.floor(((t - start) / WINDOW_MS) * RATE_BUCKETS),
      );
      bucketCounts[idx]++;
    }
    const maxCount = Math.max(1, ...bucketCounts);

    ctx.strokeStyle = RATE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < RATE_BUCKETS; i++) {
      const x = ((i + 0.5) / RATE_BUCKETS) * cssWidth;
      const y = baselineY - 30 - (bucketCounts[i] / maxCount) * (cssHeight - 70);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // time axis labels
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('-60s', 4, cssHeight - 8);
    ctx.textAlign = 'center';
    ctx.fillText('-30s', cssWidth / 2, cssHeight - 8);
    ctx.textAlign = 'right';
    ctx.fillText('now', cssWidth - 4, cssHeight - 8);
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(container);

    if (reducedMotion) {
      // §96 — no continuous animation; redraw only on data change.
      unsubscribe = store.subscribe(() => draw());
      draw();
    } else {
      loop();
    }
  }

  function destroy() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return { element: container, start, destroy };
} 
