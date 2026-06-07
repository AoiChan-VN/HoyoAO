/* ==========================================================================
   WEBGL2 VR ENGINE
   File: src/core/vr-engine.js
   ========================================================================== */

import { Mat4, degToRad } from './gl-matrix.js';
import { getCameraState } from './store.js';

import { VERTEX_SHADER_SOURCE }
from '../shaders/vertex-shader.js';

import { FRAGMENT_SHADER_SOURCE }
from '../shaders/fragment-shader.js';

export class VREngine {

    constructor(canvas) {

        this.canvas = canvas;

        this.gl =
            canvas.getContext(
                'webgl2',
                {
                    antialias: true,
                    alpha: false,
                    depth: true,
                    stencil: false,
                    preserveDrawingBuffer: false
                }
            );

        if (!this.gl) {
            throw new Error(
                'WebGL2 is not supported.'
            );
        }

        this.program = null;

        this.vao = null;
        this.vertexBuffer = null;

        this.baseCubemap = null;
        this.parallaxCubemap = null;

        this.uniforms = {};

        this.vertexCount = 0;
    }

    async initialize(sceneConfig) {

        const gl = this.gl;

        this.program =
            this.createProgram(
                VERTEX_SHADER_SOURCE,
                FRAGMENT_SHADER_SOURCE
            );

        this.cacheUniforms();

        this.createSkyboxGeometry();

        this.baseCubemap =
            await this.loadCubemap(
                sceneConfig.skybox.baseLayer
            );

        this.parallaxCubemap =
            await this.loadCubemap(
                sceneConfig.skybox.parallaxLayer
            );

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        this.resize();
    }

    cacheUniforms() {

        const gl = this.gl;

        this.uniforms.projection =
            gl.getUniformLocation(
                this.program,
                'uProjectionMatrix'
            );

        this.uniforms.view =
            gl.getUniformLocation(
                this.program,
                'uViewMatrix'
            );

        this.uniforms.baseTexture =
            gl.getUniformLocation(
                this.program,
                'uBaseTexture'
            );

        this.uniforms.parallaxTexture =
            gl.getUniformLocation(
                this.program,
                'uParallaxTexture'
            );
    }

    createProgram(
        vertexSource,
        fragmentSource
    ) {

        const gl = this.gl;

        const vertexShader =
            this.createShader(
                gl.VERTEX_SHADER,
                vertexSource
            );

        const fragmentShader =
            this.createShader(
                gl.FRAGMENT_SHADER,
                fragmentSource
            );

        const program =
            gl.createProgram();

        gl.attachShader(
            program,
            vertexShader
        );

        gl.attachShader(
            program,
            fragmentShader
        );

        gl.linkProgram(program);

        if (
            !gl.getProgramParameter(
                program,
                gl.LINK_STATUS
            )
        ) {
            throw new Error(
                gl.getProgramInfoLog(program)
            );
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    createShader(
        type,
        source
    ) {

        const gl = this.gl;

        const shader =
            gl.createShader(type);

        gl.shaderSource(
            shader,
            source
        );

        gl.compileShader(shader);

        if (
            !gl.getShaderParameter(
                shader,
                gl.COMPILE_STATUS
            )
        ) {
            throw new Error(
                gl.getShaderInfoLog(shader)
            );
        }

        return shader;
    }

    createSkyboxGeometry() {

        const gl = this.gl;

        const vertices =
            new Float32Array([
                -1,-1,-1,
                 1,-1,-1,
                 1, 1,-1,

                -1,-1,-1,
                 1, 1,-1,
                -1, 1,-1,

                -1,-1, 1,
                 1,-1, 1,
                 1, 1, 1,

                -1,-1, 1,
                 1, 1, 1,
                -1, 1, 1,

                -1,-1,-1,
                -1, 1,-1,
                -1, 1, 1,

                -1,-1,-1,
                -1, 1, 1,
                -1,-1, 1,

                 1,-1,-1,
                 1, 1,-1,
                 1, 1, 1,

                 1,-1,-1,
                 1, 1, 1,
                 1,-1, 1,

                -1, 1,-1,
                 1, 1,-1,
                 1, 1, 1,

                -1, 1,-1,
                 1, 1, 1,
                -1, 1, 1,

                -1,-1,-1,
                 1,-1,-1,
                 1,-1, 1,

                -1,-1,-1,
                 1,-1, 1,
                -1,-1, 1
            ]);

        this.vertexCount =
            vertices.length / 3;

        this.vao =
            gl.createVertexArray();

        this.vertexBuffer =
            gl.createBuffer();

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.vertexBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertices,
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(
            0,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindVertexArray(null);
    }

    async loadCubemap(faceSet) {

        const gl = this.gl;

        const texture =
            gl.createTexture();

        gl.bindTexture(
            gl.TEXTURE_CUBE_MAP,
            texture
        );

        const faces = [
            [gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceSet.px],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceSet.nx],
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceSet.py],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceSet.ny],
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceSet.pz],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceSet.nz]
        ];

        await Promise.all(
            faces.map(
                async ([target, url]) => {

                    const image =
                        await this.loadImage(url);

                    gl.texImage2D(
                        target,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        image
                    );
                }
            )
        );

        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR
        );

        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_MAG_FILTER,
            gl.LINEAR
        );

        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_S,
            gl.CLAMP_TO_EDGE
        );

        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE
        );

        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_R,
            gl.CLAMP_TO_EDGE
        );

        return texture;
    }

    loadImage(url) {

        return new Promise(
            (resolve, reject) => {

                const image = new Image();

                image.onload =
                    () => resolve(image);

                image.onerror =
                    () => reject(
                        new Error(
                            'Texture load failed: ' +
                            url
                        )
                    );

                image.src = url;
            }
        );
    }

    resize() {

        const gl = this.gl;

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        const pixelRatio =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        this.canvas.width =
            Math.floor(
                width * pixelRatio
            );

        this.canvas.height =
            Math.floor(
                height * pixelRatio
            );

        gl.viewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    render() {

        const gl = this.gl;

        const camera =
            getCameraState();

        const aspect =
            this.canvas.width /
            this.canvas.height;

        const projection =
            Mat4.perspective(
                camera.fov,
                aspect,
                0.1,
                1000.0
            );

        const yaw =
            Mat4.rotationY(
                degToRad(camera.yaw)
            );

        const pitch =
            Mat4.rotationX(
                degToRad(camera.pitch)
            );

        const view =
            Mat4.multiply(
                pitch,
                yaw
            );

        gl.clearColor(
            0,
            0,
            0,
            1
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(
            this.program
        );

        gl.uniformMatrix4fv(
            this.uniforms.projection,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            this.uniforms.view,
            false,
            view
        );

        gl.activeTexture(
            gl.TEXTURE0
        );

        gl.bindTexture(
            gl.TEXTURE_CUBE_MAP,
            this.baseCubemap
        );

        gl.uniform1i(
            this.uniforms.baseTexture,
            0
        );

        gl.activeTexture(
            gl.TEXTURE1
        );

        gl.bindTexture(
            gl.TEXTURE_CUBE_MAP,
            this.parallaxCubemap
        );

        gl.uniform1i(
            this.uniforms.parallaxTexture,
            1
        );

        gl.bindVertexArray(
            this.vao
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            this.vertexCount
        );

        gl.bindVertexArray(null);
    }
} 
