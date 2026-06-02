// Vanilla Parallax Engine - No dependencies
// Supports:
// - Mouse parallax (desktop)
// - Gyroscope (mobile)
// - Layer depth system
// - Smooth easing (requestAnimationFrame)

export class ParallaxEngine {
  constructor(options = {}) {
    this.layers = [];
    this.mouse = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };

    this.sensitivity = options.sensitivity ?? 30;
    this.smoothness = options.smoothness ?? 0.08;

    this.useGyro = false;

    this.initMouse();
    this.initGyro();
    this.loop();
  }

  registerLayer(el, depth = 1) {
    this.layers.push({
      el,
      depth
    });
  }

  initMouse() {
    window.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;

      this.target.x = x;
      this.target.y = y;
    });
  }

  initGyro() {
    if (typeof window === "undefined") return;

    const handler = (e) => {
      if (!e.gamma && !e.beta) return;

      this.useGyro = true;

      const x = e.gamma / 45;
      const y = e.beta / 45;

      this.target.x = Math.max(-1, Math.min(1, x));
      this.target.y = Math.max(-1, Math.min(1, y));
    };

    window.addEventListener("deviceorientation", handler);
  }

  update() {
    // Smooth camera easing
    this.current.x += (this.target.x - this.current.x) * this.smoothness;
    this.current.y += (this.target.y - this.current.y) * this.smoothness;

    for (const layer of this.layers) {
      const moveX = this.current.x * layer.depth * this.sensitivity;
      const moveY = this.current.y * layer.depth * this.sensitivity;

      layer.el.style.transform =
        `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
  }

  loop() {
    this.update();
    requestAnimationFrame(() => this.loop());
  }
}
