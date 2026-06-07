// ./js/core/webgl-context.js

export class WebGLContext {
    constructor(
        canvasId = 'xr-canvas'
    ) {
        this.canvasId =
            canvasId;

        this.canvas = null;

        this.gl = null;

        this.extensions = {};

        this.capabilities = {};
    }

    initialize() {
        this.canvas =
            document.getElementById(
                this.canvasId
            );

        if (
            !this.canvas
        ) {
            throw new Error(
                `[WEBGL_CONTEXT] Canvas "${this.canvasId}" not found.`
            );
        }

        this.gl =
            this.canvas.getContext(
                'webgl2',
                {
                    alpha: false,
                    antialias: true,
                    depth: true,
                    stencil: false,
                    preserveDrawingBuffer: false,
                    powerPreference:
                        'high-performance'
                }
            );

        if (
            !this.gl
        ) {
            throw new Error(
                '[WEBGL_CONTEXT] WebGL2 is not supported.'
            );
        }

        this.resize();

        this.detectExtensions();

        this.detectCapabilities();

        window.addEventListener(
            'resize',
            () =>
                this.resize()
        );

        return this.gl;
    }

    resize() {
        if (
            !this.canvas ||
            !this.gl
        ) {
            return;
        }

        const pixelRatio =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        const width =
            Math.floor(
                window.innerWidth *
                    pixelRatio
            );

        const height =
            Math.floor(
                window.innerHeight *
                    pixelRatio
            );

        if (
            this.canvas.width !==
                width ||
            this.canvas.height !==
                height
        ) {
            this.canvas.width =
                width;

            this.canvas.height =
                height;
        }

        this.canvas.style.width =
            '100vw';

        this.canvas.style.height =
            '100vh';

        this.gl.viewport(
            0,
            0,
            width,
            height
        );
    }

    detectExtensions() {
        const gl =
            this.gl;

        const extensionList = [
            'EXT_color_buffer_float',
            'OES_texture_float_linear',
            'EXT_texture_filter_anisotropic',
            'WEBGL_debug_renderer_info'
        ];

        for (
            let i = 0;
            i < extensionList.length;
            i += 1
        ) {
            const name =
                extensionList[i];

            this.extensions[name] =
                gl.getExtension(
                    name
                );
        }
    }

    detectCapabilities() {
        const gl =
            this.gl;

        this.capabilities = {
            maxTextureSize:
                gl.getParameter(
                    gl.MAX_TEXTURE_SIZE
                ),

            maxCubeMapSize:
                gl.getParameter(
                    gl.MAX_CUBE_MAP_TEXTURE_SIZE
                ),

            maxVertexUniforms:
                gl.getParameter(
                    gl.MAX_VERTEX_UNIFORM_VECTORS
                ),

            maxFragmentUniforms:
                gl.getParameter(
                    gl.MAX_FRAGMENT_UNIFORM_VECTORS
                ),

            maxSamples:
                gl.getParameter(
                    gl.MAX_SAMPLES
                ),

            renderer:
                this.getRenderer(),

            version:
                gl.getParameter(
                    gl.VERSION
                ),

            shadingLanguage:
                gl.getParameter(
                    gl.SHADING_LANGUAGE_VERSION
                )
        };
    }

    getRenderer() {
        const debug =
            this.extensions[
                'WEBGL_debug_renderer_info'
            ];

        if (!debug) {
            return 'Unknown';
        }

        return this.gl.getParameter(
            debug.UNMASKED_RENDERER_WEBGL
        );
    }

    clear(
        red = 0,
        green = 0,
        blue = 0,
        alpha = 1
    ) {
        const gl =
            this.gl;

        gl.clearColor(
            red,
            green,
            blue,
            alpha
        );

        gl.clearDepth(1);

        gl.enable(
            gl.DEPTH_TEST
        );

        gl.depthFunc(
            gl.LEQUAL
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );
    }

    createBuffer(
        target,
        data,
        usage =
            this.gl.STATIC_DRAW
    ) {
        const buffer =
            this.gl.createBuffer();

        this.gl.bindBuffer(
            target,
            buffer
        );

        this.gl.bufferData(
            target,
            data,
            usage
        );

        return buffer;
    }

    createTexture2D(
        image
    ) {
        const texture =
            this.gl.createTexture();

        this.gl.bindTexture(
            this.gl.TEXTURE_2D,
            texture
        );

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR
        );

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR
        );

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            image
        );

        this.gl.generateMipmap(
            this.gl.TEXTURE_2D
        );

        return texture;
    }

    getGL() {
        return this.gl;
    }

    getCanvas() {
        return this.canvas;
    }

    getExtensions() {
        return {
            ...this.extensions
        };
    }

    getCapabilities() {
        return {
            ...this.capabilities
        };
    }
}
