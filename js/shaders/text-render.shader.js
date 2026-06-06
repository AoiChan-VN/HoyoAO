// ./js/shaders/text-render.shader.js

export const TEXT_RENDER_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;

void main() {
    vUv = aUv;

    gl_Position =
        uProjectionMatrix *
        uViewMatrix *
        uModelMatrix *
        vec4(
            aPosition,
            1.0
        );
}
`;

export const TEXT_RENDER_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uFontTexture;
uniform vec3 uTextColor;
uniform float uOpacity;

out vec4 fragColor;

void main() {
    vec4 glyph =
        texture(
            uFontTexture,
            vUv
        );

    float alpha =
        glyph.r *
        uOpacity;

    if (
        alpha < 0.01
    ) {
        discard;
    }

    fragColor =
        vec4(
            uTextColor,
            alpha
        );
}
`;

export function createTextRenderProgram(
    gl
) {
    const vertexShader =
        compileShader(
            gl,
            gl.VERTEX_SHADER,
            TEXT_RENDER_VERTEX_SHADER
        );

    const fragmentShader =
        compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            TEXT_RENDER_FRAGMENT_SHADER
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

    gl.linkProgram(
        program
    );

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

        gl.deleteProgram(
            program
        );

        throw new Error(
            `[TEXT_SHADER] ${error}`
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

    gl.compileShader(
        shader
    );

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
            `[TEXT_SHADER] ${error}`
        );
    }

    return shader;
} 
