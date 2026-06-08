export class ShaderManager {

    constructor({
        renderer,
        state,
        eventBus
    }) {

        if (!renderer) {
            throw new Error(
                'ShaderManager requires renderer.'
            );
        }

        this.renderer = renderer;
        this.gl = renderer.gl;

        this.state = state;
        this.eventBus = eventBus;

        this.programs =
            new Map();

        this.shaders =
            new Map();

        this.uniformCache =
            new Map();

        this.attributeCache =
            new Map();

        this.activeProgram =
            null;
    }

    async initialize() {

        this.registerBuiltins();

        this.eventBus.emit(
            'shader:initialized'
        );

        console.info(
            '[Shader] Initialized'
        );
    }

    registerBuiltins() {

        this.createProgram(
            'ui-basic',
            ShaderLibrary.UI_VERTEX,
            ShaderLibrary.UI_FRAGMENT
        );

        this.createProgram(
            'skybox',
            ShaderLibrary.SKYBOX_VERTEX,
            ShaderLibrary.SKYBOX_FRAGMENT
        );

        this.createProgram(
            'world-basic',
            ShaderLibrary.WORLD_VERTEX,
            ShaderLibrary.WORLD_FRAGMENT
        );
    }

    createProgram(
        name,
        vertexSource,
        fragmentSource
    ) {

        const vertexShader =
            this.compileShader(
                this.gl.VERTEX_SHADER,
                vertexSource
            );

        const fragmentShader =
            this.compileShader(
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

            const error =
                this.gl.getProgramInfoLog(
                    program
                );

            this.gl.deleteProgram(
                program
            );

            throw new Error(
                `Shader Link Error: ${error}`
            );
        }

        this.programs.set(
            name,
            program
        );

        this.shaders.set(
            `${name}:vertex`,
            vertexShader
        );

        this.shaders.set(
            `${name}:fragment`,
            fragmentShader
        );

        return program;
    }

    compileShader(
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
                `Shader Compile Error: ${error}`
            );
        }

        return shader;
    }

    use(name) {

        const program =
            this.programs.get(
                name
            );

        if (!program) {

            throw new Error(
                `Program not found: ${name}`
            );
        }

        if (
            this.activeProgram ===
            program
        ) {
            return;
        }

        this.gl.useProgram(
            program
        );

        this.activeProgram =
            program;
    }

    getProgram(name) {

        return this.programs.get(
            name
        );
    }

    getUniform(
        programName,
        uniformName
    ) {

        const key =
            `${programName}:${uniformName}`;

        if (
            this.uniformCache.has(
                key
            )
        ) {

            return this.uniformCache.get(
                key
            );
        }

        const program =
            this.programs.get(
                programName
            );

        const location =
            this.gl.getUniformLocation(
                program,
                uniformName
            );

        this.uniformCache.set(
            key,
            location
        );

        return location;
    }

    getAttribute(
        programName,
        attributeName
    ) {

        const key =
            `${programName}:${attributeName}`;

        if (
            this.attributeCache.has(
                key
            )
        ) {

            return this.attributeCache.get(
                key
            );
        }

        const program =
            this.programs.get(
                programName
            );

        const location =
            this.gl.getAttribLocation(
                program,
                attributeName
            );

        this.attributeCache.set(
            key,
            location
        );

        return location;
    }

    setMatrix4(
        programName,
        uniformName,
        matrix
    ) {

        const location =
            this.getUniform(
                programName,
                uniformName
            );

        this.gl.uniformMatrix4fv(
            location,
            false,
            matrix
        );
    }

    setVector3(
        programName,
        uniformName,
        value
    ) {

        const location =
            this.getUniform(
                programName,
                uniformName
            );

        this.gl.uniform3f(
            location,
            value.x,
            value.y,
            value.z
        );
    }

    setFloat(
        programName,
        uniformName,
        value
    ) {

        const location =
            this.getUniform(
                programName,
                uniformName
            );

        this.gl.uniform1f(
            location,
            value
        );
    }

    hotReload(
        name,
        vertexSource,
        fragmentSource
    ) {

        const oldProgram =
            this.programs.get(
                name
            );

        if (
            oldProgram
        ) {

            this.gl.deleteProgram(
                oldProgram
            );
        }

        return this.createProgram(
            name,
            vertexSource,
            fragmentSource
        );
    }

    destroy() {

        for (
            const shader
            of this.shaders.values()
        ) {

            this.gl.deleteShader(
                shader
            );
        }

        for (
            const program
            of this.programs.values()
        ) {

            this.gl.deleteProgram(
                program
            );
        }

        this.shaders.clear();

        this.programs.clear();

        this.uniformCache.clear();

        this.attributeCache.clear();

        this.activeProgram =
            null;

        this.eventBus.emit(
            'shader:destroyed'
        );
    }
}

export const ShaderLibrary = {

    UI_VERTEX: `#version 300 es
in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

void main() {

    gl_Position =
        uProjection *
        uView *
        uModel *
        vec4(
            aPosition,
            1.0
        );
}`,

    UI_FRAGMENT: `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {

    fragColor =
        vec4(
            0.9,
            0.95,
            1.0,
            1.0
        );
}`,

    SKYBOX_VERTEX: `#version 300 es
in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;

out vec3 vDirection;

void main() {

    vDirection =
        aPosition;

    vec4 pos =
        uProjection *
        uView *
        vec4(
            aPosition,
            1.0
        );

    gl_Position =
        pos.xyww;
}`,

    SKYBOX_FRAGMENT: `#version 300 es
precision highp float;

in vec3 vDirection;

out vec4 fragColor;

void main() {

    vec3 color =
        normalize(
            abs(
                vDirection
            )
        );

    fragColor =
        vec4(
            color,
            1.0
        );
}`,

    WORLD_VERTEX: `#version 300 es
in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

void main() {

    gl_Position =
        uProjection *
        uView *
        uModel *
        vec4(
            aPosition,
            1.0
        );
}`,

    WORLD_FRAGMENT: `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {

    fragColor =
        vec4(
            0.8,
            0.85,
            0.95,
            1.0
        );
}`
}; 
