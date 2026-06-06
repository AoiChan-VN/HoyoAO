// ./js/shaders/hologram.shader.js

export const HOLOGRAM_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;
out vec3 vWorldPosition;

void main() {
    vec4 worldPosition =
        uModelMatrix *
        vec4(aPosition, 1.0);

    vUv = aUv;
    vWorldPosition =
        worldPosition.xyz;

    gl_Position =
        uProjectionMatrix *
        uViewMatrix *
        worldPosition;
}
`;

export const HOLOGRAM_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vWorldPosition;

uniform sampler2D uGridTexture;
uniform sampler2D uNoiseTexture;

uniform float uTime;
uniform float uGlowStrength;
uniform float uOpacity;

out vec4 fragColor;

void main() {
    vec2 gridUv =
        vUv * 4.0;

    vec4 gridColor =
        texture(
            uGridTexture,
            gridUv
        );

    vec4 noiseColor =
        texture(
            uNoiseTexture,
            vUv +
            vec2(
                uTime * 0.03,
                uTime * 0.01
            )
        );

    float scanLine =
        sin(
            (vWorldPosition.y * 8.0) +
            (uTime * 4.0)
        );

    scanLine =
        (scanLine * 0.5) + 0.5;

    float edgeGlow =
        smoothstep(
            0.0,
            0.12,
            vUv.x
        ) +
        smoothstep(
            0.0,
            0.12,
            1.0 - vUv.x
        ) +
        smoothstep(
            0.0,
            0.12,
            vUv.y
        ) +
        smoothstep(
            0.0,
            0.12,
            1.0 - vUv.y
        );

    edgeGlow =
        clamp(
            edgeGlow,
            0.0,
            1.0
        );

    vec3 baseColor =
        vec3(
            0.15,
            0.95,
            1.00
        );

    vec3 finalColor =
        baseColor *
        (
            0.25 +
            gridColor.rgb +
            (noiseColor.rgb * 0.20)
        );

    finalColor +=
        edgeGlow *
        uGlowStrength;

    finalColor +=
        scanLine * 0.15;

    fragColor =
        vec4(
            finalColor,
            uOpacity
        );
}
`;

export function createHologramProgram(
    gl
) {
    const vertexShader =
        compileShader(
            gl,
            gl.VERTEX_SHADER,
            HOLOGRAM_VERTEX_SHADER
        );

    const fragmentShader =
        compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            HOLOGRAM_FRAGMENT_SHADER
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

        gl.deleteProgram(
            program
        );

        throw new Error(
            `[HOLOGRAM_SHADER] ${error}`
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
            `[HOLOGRAM_SHADER] ${error}`
        );
    }

    return shader;
} 
