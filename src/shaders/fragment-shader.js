/* ==========================================================================
   FRAGMENT SHADER SOURCE
   File: src/shaders/fragment-shader.js

   Dual Layer Cubemap Renderer
   Base Layer  : Environment Lighting
   Parallax    : View Dependent Depth Illusion
   ========================================================================== */

export const FRAGMENT_SHADER_SOURCE = `#version 300 es

precision highp float;

uniform samplerCube uBaseTexture;
uniform samplerCube uParallaxTexture;

in vec3 vDirection;
in vec3 vViewDirection;

out vec4 fragColor;

float calculateViewFactor(
    vec3 direction,
    vec3 viewDirection
) {
    float factor =
        dot(
            normalize(direction),
            normalize(viewDirection)
        );

    factor =
        factor * 0.5 + 0.5;

    return clamp(
        factor,
        0.0,
        1.0
    );
}

float calculateLighting(
    vec3 direction
) {
    float skyLight =
        direction.y * 0.5 + 0.5;

    float ambient =
        0.72;

    float directional =
        skyLight * 0.28;

    return clamp(
        ambient + directional,
        0.0,
        1.0
    );
}

void main() {

    vec3 sampleDirection =
        normalize(vDirection);

    vec4 baseColor =
        texture(
            uBaseTexture,
            sampleDirection
        );

    vec4 parallaxColor =
        texture(
            uParallaxTexture,
            sampleDirection
        );

    float viewFactor =
        calculateViewFactor(
            sampleDirection,
            vViewDirection
        );

    float parallaxStrength =
        smoothstep(
            0.15,
            0.95,
            viewFactor
        );

    vec3 blendedColor =
        mix(
            baseColor.rgb,
            mix(
                baseColor.rgb,
                parallaxColor.rgb,
                parallaxColor.a
            ),
            parallaxStrength
        );

    float lighting =
        calculateLighting(
            sampleDirection
        );

    blendedColor *= lighting;

    blendedColor =
        pow(
            blendedColor,
            vec3(1.0 / 2.2)
        );

    fragColor =
        vec4(
            blendedColor,
            1.0
        );
}
`; 
