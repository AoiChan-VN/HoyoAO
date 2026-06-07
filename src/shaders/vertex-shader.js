/* ==========================================================================
   VERTEX SHADER SOURCE
   File: src/shaders/vertex-shader.js
   FIX VERSION
   - Removed inverse(mat4)
   - Mobile WebGL2 Safe
   - View Direction Passed From JS
   ========================================================================== */

export const VERTEX_SHADER_SOURCE = `#version 300 es

precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform vec3 uViewDirection;

out vec3 vDirection;
out vec3 vViewDirection;

void main() {

    vDirection =
        normalize(
            aPosition
        );

    vViewDirection =
        normalize(
            uViewDirection
        );

    gl_Position =
        uProjectionMatrix *
        uViewMatrix *
        vec4(
            aPosition,
            1.0
        );
}
`;
