export class Renderer {

    constructor({
        canvas,
        state,
        eventBus
    }) {

        if (!canvas) {
            throw new Error(
                'Renderer requires canvas.'
            );
        }

        this.canvas = canvas;
        this.state = state;
        this.eventBus = eventBus;

        this.gl = null;

        this.clearColor = {
            r: 0.02,
            g: 0.04,
            b: 0.08,
            a: 1.0
        };

        this.sceneObjects = [];

        this.visibleObjects = [];

        this.renderQueue = [];

        this.objectPool = [];

        this.stats = {
            fps: 0,
            drawCalls: 0,
            triangles: 0,
            visibleObjects: 0,
            culledObjects: 0
        };

        this.lastFpsUpdate = 0;
        this.frameCounter = 0;

        this.shaderPrograms =
            new Map();

        this.buffers =
            new Map();

        this.extensions =
            new Map();

        this.projectionMatrix =
            new Float32Array(16);

        this.viewMatrix =
            new Float32Array(16);

        this.worldMatrix =
            new Float32Array(16);

        this.frustumPlanes = [];
    }

    async initialize() {

        this.initializeContext();

        this.initializeExtensions();

        this.initializeState();

        this.initializeMatrices();

        this.resize();

        this.registerEvents();

        console.info(
            '[Renderer] Initialized'
        );
    }

    initializeContext() {

        const gl =
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

        if (!gl) {

            throw new Error(
                'WebGL2 initialization failed.'
            );
        }

        this.gl = gl;
    }

    initializeExtensions() {

        const extensionList = [
            'EXT_color_buffer_float',
            'OES_texture_float_linear',
            'EXT_texture_filter_anisotropic'
        ];

        for (
            const name
            of extensionList
        ) {

            const extension =
                this.gl.getExtension(
                    name
                );

            if (extension) {

                this.extensions.set(
                    name,
                    extension
                );
            }
        }
    }

    initializeState() {

        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);

        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.CULL_FACE);

        gl.cullFace(gl.BACK);

        gl.frontFace(gl.CCW);

        gl.enable(gl.BLEND);

        gl.blendFunc(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA
        );

        gl.clearColor(
            this.clearColor.r,
            this.clearColor.g,
            this.clearColor.b,
            this.clearColor.a
        );
    }

    initializeMatrices() {

        this.identityMatrix(
            this.projectionMatrix
        );

        this.identityMatrix(
            this.viewMatrix
        );

        this.identityMatrix(
            this.worldMatrix
        );
    }

    registerEvents() {

        this.eventBus.on(
            'viewport:resize',
            () => {

                this.resize();
            }
        );

        this.eventBus.on(
            'world:add-object',
            (object) => {

                this.addObject(
                    object
                );
            }
        );

        this.eventBus.on(
            'world:remove-object',
            (objectId) => {

                this.removeObject(
                    objectId
                );
            }
        );
    }

    resize() {

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        const width =
            Math.floor(
                this.canvas.clientWidth ||
                window.innerWidth
            );

        const height =
            Math.floor(
                this.canvas.clientHeight ||
                window.innerHeight
            );

        this.canvas.width =
            width * dpr;

        this.canvas.height =
            height * dpr;

        this.canvas.style.width =
            `${width}px`;

        this.canvas.style.height =
            `${height}px`;

        this.gl.viewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    addObject(object) {

        if (!object) {
            return;
        }

        this.sceneObjects.push(
            object
        );
    }

    removeObject(objectId) {

        this.sceneObjects =
            this.sceneObjects.filter(
                object =>
                    object.id !== objectId
            );
    }

    render(deltaTime) {

        const gl = this.gl;

        this.resetFrameStats();

        this.performFrustumCulling();

        this.buildRenderQueue();

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        this.renderSkybox();

        this.renderWorld();

        this.renderUI();

        this.updateStats(
            deltaTime
        );
    }

    performFrustumCulling() {

        this.visibleObjects.length = 0;

        let culled = 0;

        for (
            const object
            of this.sceneObjects
        ) {

            if (
                object.visible === false
            ) {

                culled++;

                continue;
            }

            if (
                typeof object.isVisible ===
                'function'
            ) {

                const visible =
                    object.isVisible(
                        this.frustumPlanes
                    );

                if (!visible) {

                    culled++;

                    continue;
                }
            }

            this.visibleObjects.push(
                object
            );
        }

        this.stats.visibleObjects =
            this.visibleObjects.length;

        this.stats.culledObjects =
            culled;
    }

    buildRenderQueue() {

        this.renderQueue.length = 0;

        for (
            const object
            of this.visibleObjects
        ) {

            this.renderQueue.push(
                object
            );
        }

        this.renderQueue.sort(
            (a, b) => {

                const za =
                    a.position?.z ?? 0;

                const zb =
                    b.position?.z ?? 0;

                return za - zb;
            }
        );
    }

    renderSkybox() {

        for (
            const object
            of this.renderQueue
        ) {

            if (
                object.layer !==
                'skybox'
            ) {
                continue;
            }

            this.drawObject(
                object
            );
        }
    }

    renderWorld() {

        for (
            const object
            of this.renderQueue
        ) {

            if (
                object.layer !==
                'world'
            ) {
                continue;
            }

            this.drawObject(
                object
            );
        }
    }

    renderUI() {

        for (
            const object
            of this.renderQueue
        ) {

            if (
                object.layer !==
                'ui'
            ) {
                continue;
            }

            this.drawObject(
                object
            );
        }
    }

    drawObject(object) {

        if (
            typeof object.draw ===
            'function'
        ) {

            object.draw(
                this.gl,
                this
            );

            this.stats.drawCalls++;
        }
    }

    updateStats(deltaTime) {

        this.frameCounter++;

        const now =
            performance.now();

        if (
            now - this.lastFpsUpdate >
            1000
        ) {

            this.stats.fps =
                Math.round(
                    this.frameCounter
                );

            this.frameCounter = 0;

            this.lastFpsUpdate = now;

            this.eventBus.emit(
                'renderer:stats',
                {
                    ...this.stats
                }
            );
        }
    }

    resetFrameStats() {

        this.stats.drawCalls = 0;

        this.stats.triangles = 0;
    }

    createBuffer(
        name,
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

        this.buffers.set(
            name,
            buffer
        );

        return buffer;
    }

    getBuffer(name) {

        return this.buffers.get(
            name
        );
    }

    createShader(
        type,
        source
    ) {

        const shader =
            this.gl.createShader(
                type
            );

        this.gl.shaderSource(
            shader,
            source
        );

        this.gl.compileShader(
            shader
        );

        if (
            !this.gl.getShaderParameter(
                shader,
                this.gl.COMPILE_STATUS
            )
        ) {

            const error =
                this.gl.getShaderInfoLog(
                    shader
                );

            this.gl.deleteShader(
                shader
            );

            throw new Error(
                error
            );
        }

        return shader;
    }

    createProgram(
        name,
        vertexSource,
        fragmentSource
    ) {

        const vertexShader =
            this.createShader(
                this.gl.VERTEX_SHADER,
                vertexSource
            );

        const fragmentShader =
            this.createShader(
                this.gl.FRAGMENT_SHADER,
                fragmentSource
            );

        const program =
            this.gl.createProgram();

        this.gl.attachShader(
            program,
            vertexShader
        );

        this.gl.attachShader(
            program,
            fragmentShader
        );

        this.gl.linkProgram(
            program
        );

        if (
            !this.gl.getProgramParameter(
                program,
                this.gl.LINK_STATUS
            )
        ) {

            throw new Error(
                this.gl.getProgramInfoLog(
                    program
                )
            );
        }

        this.shaderPrograms.set(
            name,
            program
        );

        return program;
    }

    getProgram(name) {

        return this.shaderPrograms.get(
            name
        );
    }

    identityMatrix(matrix) {

        matrix[0] = 1;
        matrix[5] = 1;
        matrix[10] = 1;
        matrix[15] = 1;

        matrix[1] =
        matrix[2] =
        matrix[3] =
        matrix[4] =
        matrix[6] =
        matrix[7] =
        matrix[8] =
        matrix[9] =
        matrix[11] =
        matrix[12] =
        matrix[13] =
        matrix[14] = 0;
    }

    destroy() {

        for (
            const buffer
            of this.buffers.values()
        ) {

            this.gl.deleteBuffer(
                buffer
            );
        }

        for (
            const program
            of this.shaderPrograms.values()
        ) {

            this.gl.deleteProgram(
                program
            );
        }

        this.buffers.clear();

        this.shaderPrograms.clear();

        this.sceneObjects.length = 0;

        this.visibleObjects.length = 0;

        this.renderQueue.length = 0;
    }
} 
