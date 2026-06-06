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
        
