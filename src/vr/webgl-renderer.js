import { Mat4, VRCameraController } from './camera-matrix.js';

export class WebGL2Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias: true, powerPreference: "high-performance" });
    if (!this.gl) throw new Error('WebGL2 not supported');

    this.cameraController = new VRCameraController();
    this.viewMatrix = Mat4.create();
    this.projectionMatrix = Mat4.create();
    
    this.mouseState = { deltaX: 0, deltaY: 0, useGyro: true };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    this.program = null;
    this.vao = null;
    this.texture = null;

    this.initEvents();
  }

  initEvents() {
    this.cameraController.init();
    
    const start = (e) => {
      this.isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const move = (e) => {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const sensitivity = 0.15;
      this.mouseState.deltaX = (clientX - this.previousMousePosition.x) * sensitivity;
      this.mouseState.deltaY = (clientY - this.previousMousePosition.y) * sensitivity;
      
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const end = () => { this.isDragging = false; };

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', start, { passive: true });
    this.canvas.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
  }

  initShaders() {
    const vsSource = `#version 300 es
      in vec3 a_position;
      out vec3 v_texCoord;
      uniform mat4 u_viewMatrix;
      uniform mat4 u_projectionMatrix;
      void main() {
        v_texCoord = a_position;
        mat4 viewRaw = u_viewMatrix;
        viewRaw[3][0] = 0.0;
        viewRaw[3][1] = 0.0;
        viewRaw[3][2] = 0.0;
        vec4 pos = u_projectionMatrix * viewRaw * vec4(a_position, 1.0);
        gl_Position = pos.xyww;
      }`;

    const fsSource = `#version 300 es
      precision mediump float;
      in vec3 v_texCoord;
      out vec4 fragColor;
      uniform samplerCube u_skybox;
      void main() {
        fragColor = texture(u_skybox, v_texCoord);
      }`;

    const vs = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vs, vsSource);
    this.gl.compileShader(vs);
    if (!this.gl.getShaderParameter(vs, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(vs));
    }

    const fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fs, fsSource);
    this.gl.compileShader(fs);
    if (!this.gl.getShaderParameter(fs, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(fs));
    }

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(this.program));
    }
  }

  initCube() {
    const vertices = new Float32Array([
      -1.0,  1.0, -1.0,  -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0,  1.0, -1.0,  -1.0,  1.0, -1.0,
      -1.0, -1.0,  1.0,  -1.0, -1.0, -1.0,  -1.0,  1.0, -1.0,  -1.0,  1.0, -1.0,  -1.0,  1.0,  1.0,  -1.0, -1.0,  1.0,
       1.0, -1.0, -1.0,   1.0, -1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0, -1.0,   1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,  -1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0, -1.0,  1.0,  -1.0, -1.0,  1.0,
      -1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0,  1.0,  1.0,   1.0,  1.0,  1.0,  -1.0,  1.0,  1.0,  -1.0,  1.0, -1.0,
      -1.0, -1.0, -1.0,  -1.0, -1.0,  1.0,   1.0, -1.0, -1.0,   1.0, -1.0, -1.0,  -1.0, -1.0,  1.0,   1.0, -1.0,  1.0
    ]);

    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    const posLoc = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
  }

  async loadSkybox(imagesObj) {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

    const targets = [
      { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: imagesObj.px },
      { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: imagesObj.nx },
      { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: imagesObj.py },
      { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: imagesObj.ny },
      { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: imagesObj.pz },
      { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: imagesObj.nz }
    ];

    const loadImg = (url) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = url;
    });

    for (let i = 0; i < 6; i++) {
      const img = await loadImg(targets[i].url);
      this.gl.texImage2D(targets[i].target, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }

    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  render() {
    this.resize();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (!this.program || !this.texture) return;

    this.cameraController.updateCameraMatrix(this.viewMatrix, this.mouseState);
    this.mouseState.deltaX *= 0.92;
    this.mouseState.deltaY *= 0.92;

    const fov = 75 * (Math.PI / 180);
    const aspect = this.canvas.width / this.canvas.height;
    Mat4.perspective(this.projectionMatrix, fov, aspect, 0.1, 1000);

    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);

    const viewLoc = this.gl.getUniformLocation(this.program, 'u_viewMatrix');
    const projLoc = this.gl.getUniformLocation(this.program, 'u_projectionMatrix');

    this.gl.uniformMatrix4fv(viewLoc, false, this.viewMatrix);
    this.gl.uniformMatrix4fv(projLoc, false, this.projectionMatrix);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'u_skybox'), 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
  }

  destroy() {
    this.cameraController.destroy();
    if (this.program) this.gl.deleteProgram(this.program);
    if (this.vao) this.gl.deleteVertexArray(this.vao);
    if (this.texture) this.gl.deleteTexture(this.texture);
  }
} 
