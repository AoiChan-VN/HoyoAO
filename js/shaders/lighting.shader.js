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
            
