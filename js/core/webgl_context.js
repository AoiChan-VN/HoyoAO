export const webglContext = {
    gl: null,

    initialize(canvas) {
        const options = {
            alpha: false,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
        };

        this.gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);

        if (!this.gl) {
            return false;
        }

        this.setupState();
        return true;
    },

    setupState() {
        const gl = this.gl;
        gl.clearColor(0.008, 0.008, 0.031, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    },

    clear() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },

    setViewPort(width, height) {
        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }
    },

    getGL() {
        return this.gl;
    }
};
 
