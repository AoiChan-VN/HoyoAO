// ./js/shaders/lighting.shader.js

export const LIGHTING_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vWorldPosition;
out vec3 vWorldNormal;

void main() {
    vec4 worldPosition =
        uModelMatrix *
        vec4(aPosition, 1.0);

    mat3 normalMatrix =
        mat3(uModelMatrix);

    vWorldPosition =
        worldPosition.xyz;

    vWorldNormal =
        normalize(
            normalMatrix *
            aNormal
        );

    gl_Position =
        uProjectionMatrix *
        uViewMatrix *
        worldPosition;
}
`;

export const LIGHTING_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vWorldPosition;
in vec3 vWorldNormal;

uniform vec3 uCameraPosition;

uniform vec3 uLightDirection;
uniform vec3 uLightColor;

uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

uniform float uShininess;

out vec4 fragColor;

void main() {
    vec3 normal =
        normalize(
            vWorldNormal
        );

    vec3 lightDirection =
        normalize(
            -uLightDirection
        );

    float diffuseFactor =
        max(
            dot(
                normal,
                lightDirection
            ),
            0.0
        );

    vec3 viewDirection =
        normalize(
            uCameraPosition -
            vWorldPosition
        );

    vec3 halfVector =
        normalize(
            lightDirection +
            viewDirection
        );

    float specularFactor =
        pow(
            max(
                dot(
                    normal,
                    halfVector
                ),
                0.0
            ),
            uShininess
        );

    vec3 ambient =
        uAmbientColor;

    vec3 diffuse =
        uDiffuseColor *
        diffuseFactor *
        uLightColor;

    vec3 specular =
        uSpecularColor *
        specularFactor *
        uLightColor;

    vec3 finalColor =
        ambient +
        diffuse +
        specular;

    fragColor =
        vec4(
            finalColor,
            1.0
        );
}
`;

export function createLightingProgram(
    gl
) {
    const vertexShader =
        compileShader(
            gl,
            gl.VERTEX_SHADER,
            LIGHTING_VERTEX_SHADER
        );

    const fragmentShader =
        compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            LIGHTING_FRAGMENT_SHADER
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
            `[LIGHTING_SHADER] ${error}`
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
            `[LIGHTING_SHADER] ${error}`
        );
    }

    return shader;
}
       
