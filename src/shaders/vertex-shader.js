/* ==========================================================================
   VERTEX SHADER SOURCE
   File: src/shaders/vertex-shader.js
   ========================================================================== */

export const VERTEX_SHADER_SOURCE = `#version 300 es

precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 vDirection;
out vec3 vViewDirection;

void main() {

    vec4 clipPosition =
        uProjectionMatrix *
        uViewMatrix *
        vec4(aPosition, 1.0);

    gl_Position = clipPosition;

    vDirection = normalize(aPosition);

    vec3 cameraDirection =
        normalize(
            (inverse(uViewMatrix) * vec4(0.0, 0.0, -1.0, 0.0)).xyz
        );

    vViewDirection = cameraDirection;
}
`; 
