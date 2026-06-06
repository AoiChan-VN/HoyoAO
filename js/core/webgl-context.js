// ./js/core/webgl-context.js

export class WebGLContext {
    constructor(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('[WEBGL] Invalid canvas element.');
        }

        this.canvas = canvas;
        this.gl = null;
        this.extensions = {};
    }

    async initialize() {
        const contextAttributes = {
            alpha: false,
            antialias: true,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        };

        this.gl = this.canvas.getContext(
            'webgl2',
            contextAttributes
        );

        if (!this.gl) {
            throw new Error(
                '[WEBGL] WebGL2 is not supported on this device.'
            );
        }

        this.collectExtensions();
        this.configureDefaults();
    }

    collectExtensions() {
        const requiredExtensions = [
            'EXT_color_buffer_float',
            'OES_texture_float_linear',
            'EXT_texture_filter_anisotropic'
        ];

        for (const extensionName of requiredExtensions) {
            const extension =
                this.gl.getExtension(extensionName) ||
                this.gl.getExtension(
                    `WEBKIT_${extensionName}`
                ) ||
                this.gl.getExtension(
                    `MOZ_${extensionName}`
                );

            this.extensions[extensionName] = extension;
        }
    }

    configureDefaults() {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        gl.clearColor(
            0.0,
            0.0,
            0.0,
            1.0
        );

        gl.clearDepth(1.0);

        gl.viewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    resize(width, height) {
        if (!this.gl) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        this.gl.viewport(
            0,
            0,
            width,
            height
        );
    }

    getContext() {
        if (!this.gl) {
            throw new Error(
                '[WEBGL] Context has not been initialized.'
            );
        }

        return this.gl;
    }

    getExtensions() {
        return this.extensions;
    }

    isExtensionAvailable(extensionName) {
        return Boolean(
            this.extensions[extensionName]
        );
    }
} 
