/**
 * @file    infrastructure/WebGLRenderer.js
 * @layer   Infrastructure — Hardware Adapter
 * @desc    WebGL2 renderer for the full-viewport procedural space background.
 *
 *          Architecture:
 *            • Renders a full-screen quad (NDC −1…+1 covering the canvas).
 *            • Fragment shader casts a world-space ray from camera basis
 *              vectors for EVERY pixel → true 360° spherical scene.
 *            • Procedural content: nebula (FBM noise), multi-scale star field
 *              with twinkling, neon dust particles, Phong-model sun disc.
 *            • Phong uniforms (u_lightDir, u_camForward/Right/Up) are updated
 *              each frame from SensorCamera; specular highlight and sun disc
 *              respond to real-time camera orientation changes.
 *            • Fallback: hides canvas gracefully when WebGL2 is unavailable.
 *
 * @exports WebGLRenderer
 * @license MIT — VR Personal Website Platform
 */

'use strict';

import { Vector3 } from '../domain/Vector3.js';
import { Matrix4  } from '../domain/Matrix4.js';

// ─── GLSL Vertex Shader ───────────────────────────────────────────────────────
// Passes a full-screen NDC quad straight through.
// z = 1.0 puts the geometry at the far clip plane so it is always behind
// any depth-tested foreground geometry.
const VERT_SRC = /* glsl */`#version 300 es
precision highp float;

in vec2 a_pos;   // Input: NDC position (-1..1, -1..1)
out vec2 v_ndc;  // To fragment: raw NDC for ray-dir calculation

void main() {
  v_ndc       = a_pos;
  gl_Position = vec4(a_pos, 1.0, 1.0);
}
`;

// ─── GLSL Fragment Shader ────────────────────────────────────────────────────
// Complete procedural space scene.  Each fragment computes a world-space
// ray direction from camera basis vectors then samples the scene along it.
const FRAG_SRC = /* glsl */`#version 300 es
precision highp float;

in  vec2 v_ndc;
out vec4 fragColor;

// ── Camera orientation uniforms (updated every frame) ──────────────────────
uniform vec3  u_camForward;   // Normalized forward vector (world space)
uniform vec3  u_camRight;     // Normalized right   vector (world space)
uniform vec3  u_camUp;        // Normalized up      vector (world space)
uniform float u_fovTanHalf;   // tan(fovY / 2)
uniform float u_aspect;       // viewport width / height

// ── Lighting uniforms ──────────────────────────────────────────────────────
uniform vec3  u_lightDir;     // Normalized world-space sun direction
uniform vec3  u_lightColor;   // Sun colour / intensity
uniform vec3  u_ambientColor; // Base ambient tint

// ── Time ──────────────────────────────────────────────────────────────────
uniform float u_time;         // Seconds since renderer init

// ══════════════════════════════════════════════════════════════════════════════
//  Noise / hash utilities
// ══════════════════════════════════════════════════════════════════════════════

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
  p  = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 17.47);
  return fract(p.x * p.y);
}

float hash3(vec3 p) {
  p  = fract(p * vec3(0.10313, 0.10307, 0.09731));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Smooth value noise on 2-D
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);  // smoothstep curve
  return mix(
    mix(hash2(i),             hash2(i + vec2(1.0, 0.0)), f.x),
    mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Fractional Brownian Motion (7 octaves)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2  s = vec2(1.7, 2.3);   // lacunarity offset
  for (int i = 0; i < 7; ++i) {
    v += a * vnoise(p);
    p  = p * 2.03 + s;
    a *= 0.48;
  }
  return v;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Scene layers
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Nebula ────────────────────────────────────────────────────────────────
vec3 nebula(vec2 uv) {
  vec2 coord = uv * 3.8 + vec2(u_time * 0.007, u_time * 0.0043);

  float n1 = fbm(coord);
  float n2 = fbm(coord * 1.6 + vec2(n1 * 1.8 + 1.7,  9.2));
  float n3 = fbm(coord * 0.9 + vec2(n2 * 1.4, n1 * 1.2));

  // Deep-space colour palette
  vec3 col = vec3(0.015, 0.0,  0.06 );                // void
  col = mix(col, vec3(0.06, 0.0,  0.24 ), n1 * 0.85); // purple cloud
  col = mix(col, vec3(0.0,  0.04, 0.28 ), n2 * 0.60); // electric blue depth
  col = mix(col, vec3(0.18, 0.0,  0.38 ), n3 * 0.45); // magenta tinge

  // Bright nebula core / streaks
  float streakMask = smoothstep(0.52, 0.74, n3) * smoothstep(0.44, 0.64, n1);
  col += vec3(0.55, 0.12, 0.95) * streakMask * 0.75;
  col += vec3(0.0,  0.60, 1.00) * streakMask * 0.28;

  return col;
}

// ── 2. Star field ─────────────────────────────────────────────────────────────
vec3 starField(vec3 rayDir) {
  vec3 col = vec3(0.0);

  // Three passes at different angular densities
  // (Cubic-cell hash; slight density variation toward poles is acceptable.)
  const float SCALES[3] = float[](48.0, 28.0, 16.0);
  const vec3  OFFSETS[3] = vec3[](
    vec3( 0.0,  0.0,  0.0),
    vec3(17.3,  5.1,  9.7),
    vec3( 3.7, 11.2,  7.9)
  );
  const float THRESHOLD[3] = float[](0.976, 0.970, 0.984);
  const float BASE_BRIGHT[3] = float[](0.55, 0.90, 1.60);

  for (int i = 0; i < 3; ++i) {
    float sc = SCALES[i];
    vec3  pp = rayDir * sc + OFFSETS[i];
    vec3  cell = floor(pp);
    vec3  loc  = fract(pp) - 0.5;  // local offset inside cell, centred

    float h   = hash3(cell);
    if (h < THRESHOLD[i]) continue;  // most cells are empty

    // Distance from ray to cell centre (approximate angular distance)
    float d   = length(loc);
    float bri = pow(max(0.0, 1.0 - d * 4.0), 3.0);

    // Twinkling — each star has its own phase and speed
    float twinkle = 0.65 + 0.35 * sin(u_time * (2.5 + h * 9.0) + h * 18.84);

    // Colour temperature from white-warm to blue-cold via hash
    vec3 starCol = mix(vec3(1.0, 0.90, 0.75), vec3(0.75, 0.88, 1.0), h);

    // Cross-flare for bright stars (scale 3 only)
    float flare = 0.0;
    if (i == 2) {
      float fx = exp(-abs(loc.x) * 60.0) * 0.25;
      float fy = exp(-abs(loc.y) * 60.0) * 0.25;
      flare = max(fx, fy);
    }

    col += (bri + flare) * twinkle * starCol * BASE_BRIGHT[i];
  }
  return col;
}

// ── 3. Neon dust particles ───────────────────────────────────────────────────
vec3 neonDust(vec2 uv) {
  vec2 du = uv * 14.0 + vec2( u_time * 0.038, -u_time * 0.022);
  vec2 dv = uv * 8.0  + vec2(-u_time * 0.015,  u_time * 0.011);

  float d1 = vnoise(du) * vnoise(du * 2.4 + 3.1);
  float d2 = vnoise(dv) * vnoise(dv * 1.8 + 7.6);
  d1 = pow(d1, 5.5) * 0.7;
  d2 = pow(d2, 6.0) * 0.5;

  vec3 c1 = vec3(0.25, 0.08, 1.00) * d1;
  vec3 c2 = vec3(0.00, 0.55, 1.00) * d2 * vnoise(du * 4.0);
  return c1 + c2;
}

// ── 4. Phong sun disc + halo ──────────────────────────────────────────────────
vec3 sunContrib(vec3 rayDir) {
  float alignment = dot(rayDir, normalize(u_lightDir));

  // Sharp sun disc
  float disc  = smoothstep(0.9992, 1.0, alignment) * 30.0;
  // Wide corona / halo
  float halo  = exp(-max(0.0, 1.0 - alignment) * 10.0) * 0.35;
  // Inner glow ring
  float ring  = exp(-abs(alignment - 0.998) * 400.0) * 0.5;

  vec3 sunCol = u_lightColor * (disc + halo + ring);

  // Phong specular on the "skybox sphere":
  // Treat rayDir as surface normal, viewer direction = -rayDir
  vec3 viewDir  = -rayDir;
  vec3 halfVec  = normalize(normalize(u_lightDir) + viewDir);
  float specExp = 48.0;
  float spec    = pow(max(dot(rayDir, halfVec), 0.0), specExp) * 0.12;

  return sunCol + u_lightColor * spec;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Main
// ══════════════════════════════════════════════════════════════════════════════
void main() {
  // ── Compute world-space ray direction for this pixel ─────────────────────
  // Unprojects NDC (v_ndc) through the camera frustum:
  //   horizontal span = u_aspect * u_fovTanHalf
  //   vertical   span = u_fovTanHalf
  vec3 rayDir = normalize(
    u_camForward
    + u_camRight * v_ndc.x * u_aspect * u_fovTanHalf
    + u_camUp    * v_ndc.y *            u_fovTanHalf
  );

  // ── Equirectangular UV for 2-D noise sampling ────────────────────────────
  // phi ∈ (−π,π), theta ∈ (−π/2,π/2)
  float phi   = atan(rayDir.x, rayDir.z) / 3.14159265;  // normalised −1..1
  float theta = rayDir.y;                                // −1..1
  vec2 skyUV = vec2(phi * 0.5 + 0.5, theta * 0.5 + 0.5);

  // ── Compose layers ───────────────────────────────────────────────────────
  vec3 col  = vec3(0.0);

  // Base nebula (sky) — uses ambient for tint
  col += nebula(skyUV) * (u_ambientColor * 8.0 + vec3(0.4));

  // Neon dust on top of nebula
  col += neonDust(skyUV);

  // Stars
  col += starField(rayDir);

  // Sun disc + specular highlights driven by camera orientation
  col += sunContrib(rayDir);

  // ── Subtle vignette (screen-edge atmospheric darkening) ──────────────────
  float vigLen  = dot(v_ndc, v_ndc);   // 0 at centre, ≈2 at corner
  float vignette = 1.0 - smoothstep(1.0, 2.2, vigLen) * 0.35;
  col *= vignette;

  // ── Tone mapping (Reinhard) ───────────────────────────────────────────────
  col = col / (col + vec3(1.0));

  // ── Gamma correction (linear → sRGB) ─────────────────────────────────────
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

  fragColor = vec4(col, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
export class WebGLRenderer {

  /**
   * @param {object} [opts]
   * @param {number} [opts.fovYRad=Math.PI/3]         Vertical field of view (radians).
   * @param {number} [opts.maxDPR=2]                  Cap device-pixel-ratio to avoid fill-rate budget overrun.
   */
  constructor(opts = {}) {
    /** @type {HTMLCanvasElement} */
    this.canvas      = null;
    /** @type {WebGL2RenderingContext} */
    this._gl         = null;

    this._program    = null;
    this._vao        = null;
    this._vbuf       = null;
    this._ibuf       = null;

    /** Cached uniform locations. */
    this._u          = {};

    this._fovYRad    = opts.fovYRad ?? Math.PI / 3;
    this._maxDPR     = opts.maxDPR  ?? 2;
    this._time       = 0;
    this._ok         = false;

    // Camera state (updated by AppController each frame)
    this._camForward = new Vector3( 0,  0, -1);
    this._camRight   = new Vector3( 1,  0,  0);
    this._camUp      = new Vector3( 0,  1,  0);

    // Lighting state
    this._lightDir   = new Vector3( 0.4,  0.8,  0.3).normalize();
    this._lightColor = new Vector3( 1.0, 0.92,  0.75);
    this._ambientCol = new Vector3( 0.08, 0.04, 0.18);

    this._resizeObserver = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Create the backing canvas element, initialise WebGL2, and compile shaders.
   * The canvas is returned so AppController can insert it into the DOM.
   *
   * @returns {HTMLCanvasElement|null}  null when WebGL2 is unavailable.
   */
  init() {
    const canvas = document.createElement('canvas');
    canvas.id    = 'vr-gl-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset:    '0',
      width:    '100%',
      height:   '100%',
      zIndex:   '0',
      display:  'block',
      pointerEvents: 'none'
    });
    this.canvas = canvas;

    const gl = canvas.getContext('webgl2', {
      antialias:        false,
      alpha:            false,
      depth:            false,
      stencil:          false,
      powerPreference: 'high-performance',
      desynchronized:   true
    });

    if (!gl) {
      console.warn('[WebGLRenderer] WebGL2 not available — canvas hidden.');
      canvas.style.display = 'none';
      return canvas; // Caller can still insert it; it is just invisible
    }

    this._gl = gl;

    const prog = this._buildProgram(VERT_SRC, FRAG_SRC);
    if (!prog) { canvas.style.display = 'none'; return canvas; }
    this._program = prog;

    this._buildGeometry();
    this._cacheUniforms();
    this._watchResize();
    this._resize();

    // GL state — we never depth-test this background quad
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    this._ok = true;
    return canvas;
  }

  /**
   * Advance the time uniform.  Call once per animation frame.
   * @param {number} dt  Frame delta-time in seconds.
   */
  update(dt) {
    this._time += dt;
  }

  /**
   * Push current camera orientation into GLSL uniforms.
   * Should be called after SensorCamera.update() each frame.
   *
   * @param {SensorCamera} cam  Any object exposing getForwardVector/getRightVector/getUpVector.
   */
  syncCamera(cam) {
    this._camForward = cam.getForwardVector();
    this._camRight   = cam.getRightVector();
    this._camUp      = cam.getUpVector();

    // Derive a subtle light direction from camera orientation
    // (sun appears at a fixed world position; its apparent direction rotates
    //  as the camera turns, creating dynamic specular highlights on the nebula)
    this._lightDir = new Vector3(
       0.55 + this._camForward.x * 0.15,
       0.72 + this._camForward.y * 0.10,
       0.40 + this._camForward.z * 0.10
    ).normalize();
  }

  /**
   * Render one frame.  Call at the end of the main animation loop.
   */
  render() {
    if (!this._ok) return;

    const gl = this._gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this._program);
    gl.bindVertexArray(this._vao);

    const u = this._u;

    // Camera basis
    gl.uniform3fv(u.u_camForward, this._camForward.toFloat32Array());
    gl.uniform3fv(u.u_camRight,   this._camRight.toFloat32Array());
    gl.uniform3fv(u.u_camUp,      this._camUp.toFloat32Array());

    // Projection parameters
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    gl.uniform1f(u.u_fovTanHalf, Math.tan(this._fovYRad * 0.5));
    gl.uniform1f(u.u_aspect,     aspect);

    // Lighting
    gl.uniform3fv(u.u_lightDir,     this._lightDir.toFloat32Array());
    gl.uniform3fv(u.u_lightColor,   this._lightColor.toFloat32Array());
    gl.uniform3fv(u.u_ambientColor, this._ambientCol.toFloat32Array());

    // Time
    gl.uniform1f(u.u_time, this._time);

    // Draw full-screen quad (2 triangles = 6 indices)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
  }

  /**
   * Update FOV (called from SettingsPanel when user changes quality/zoom).
   * @param {number} fovYRad
   */
  setFovY(fovYRad) {
    this._fovYRad = fovYRad;
  }

  /** Free all GPU resources. */
  dispose() {
    if (!this._gl) return;
    const gl = this._gl;
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._vao)  gl.deleteVertexArray(this._vao);
    if (this._vbuf) gl.deleteBuffer(this._vbuf);
    if (this._ibuf) gl.deleteBuffer(this._ibuf);
    if (this._program) gl.deleteProgram(this._program);
    this._ok = false;
  }

  // ── Private: shader compilation ────────────────────────────────────────────

  _compileShader(type, src) {
    const gl = this._gl;
    const s  = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[WebGLRenderer] Shader compile error:\n', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  _buildProgram(vSrc, fSrc) {
    const gl = this._gl;
    const vs = this._compileShader(gl.VERTEX_SHADER,   vSrc);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, fSrc);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[WebGLRenderer] Program link error:\n', gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  // ── Private: geometry setup ────────────────────────────────────────────────

  _buildGeometry() {
    const gl = this._gl;
    // Full-screen quad: 4 vertices at NDC corners
    //   (-1, 1) --- (1, 1)
    //      |    \     |
    //   (-1,-1) --- (1,-1)
    const verts = new Float32Array([
      -1,  1,   // top-left     index 0
      -1, -1,   // bottom-left  index 1
       1, -1,   // bottom-right index 2
       1,  1    // top-right    index 3
    ]);
    const idxs = new Uint16Array([0, 1, 2,  0, 2, 3]);

    this._vao  = gl.createVertexArray();
    gl.bindVertexArray(this._vao);

    this._vbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(this._program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this._ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxs, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
  }

  // ── Private: uniform cache ─────────────────────────────────────────────────

  _cacheUniforms() {
    const gl   = this._gl;
    const prog = this._program;
    const names = [
      'u_camForward', 'u_camRight', 'u_camUp',
      'u_fovTanHalf', 'u_aspect',
      'u_lightDir', 'u_lightColor', 'u_ambientColor',
      'u_time'
    ];
    for (const n of names) {
      this._u[n] = gl.getUniformLocation(prog, n);
    }
  }

  // ── Private: resize handling ───────────────────────────────────────────────

  _watchResize() {
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(document.documentElement);
  }

  _resize() {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this._maxDPR);
    const w   = Math.floor(canvas.clientWidth  * dpr);
    const h   = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
      if (this._gl) this._gl.viewport(0, 0, w, h);
    }
  }
} 
