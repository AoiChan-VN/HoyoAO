// ./js/shaders/skybox.shader.js

export const SKYBOX_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 vTexCoord;

void main() {
    vTexCoord = aPosition;

    mat4 viewRotation = mat4(
        mat3(uViewMatrix)
    );

    vec4 position =
        uProjectionMatrix *
        viewRotation *
        vec4(aPosition, 1.0);

    gl_Position =
        position.xyww;
}
`;

export const SKYBOX_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vTexCoord;

uniform samplerCube uSkybox;

out vec4 fragColor;

void main() {
    fragColor =
        texture(
            uSkybox,
            normalize(vTexCoord)
        );
}
`;

export function createSkyboxProgram(
    gl
) {
    const vertexShader =
        compileShader(
            gl,
            gl.VERTEX_SHADER,
            SKYBOX_VERTEX_SHADER
        );

    const fragmentShader =
        compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            SKYBOX_FRAGMENT_SHADER
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
        const error =
            gl.getProgramInfoLog(
                program
            );

        gl.deleteProgram(program);

        throw new Error(
            `[SKYBOX_SHADER] ${error}`
        );
    }

    gl.deleteShader(
        vertexShader
    );

    gl.deleteShader(
        fragmentShader
    );

    return program;
}

function compileShader(
    gl,
    type,
    source
) {
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
        const error =
            gl.getShaderInfoLog(
                shader
            );

        gl.deleteShader(
            shader
        );

        throw new Error(
            `[SKYBOX_SHADER] ${error}`
        );
    }

    return shader;
} 
