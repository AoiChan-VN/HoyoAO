/**
 * Định nghĩa mã nguồn Vertex và Fragment Shader viết bằng GLSL ES 3.00 chuẩn hóa doanh nghiệp.
 */
export const ShaderSource = Object.freeze({
    skybox: Object.freeze({
        vertex: `#version 300 es
            in vec3 a_position;
            out vec3 v_texCoord;
            
            uniform mat4 u_viewDirectionProjectionInverse;
            
            void main() {
                v_texCoord = a_position;
                // Chuyển đổi clip space có chiều sâu z bằng 1.0 (chiều sâu tối đa của Skybox)
                vec4 pos = vec4(a_position, 1.0);
                gl_Position = pos;
            }
        `,
        fragment: `#version 300 es
            precision highp float;
            
            in vec3 v_texCoord;
            out vec4 fragColor;
            
            uniform samplerCube u_skyboxBase;
            uniform samplerCube u_skyboxHdri;
            
            uniform bool u_useBase;
            uniform bool u_useHdri;
            uniform float u_blendWeight;
            uniform mat4 u_viewDirectionProjectionInverse;
            
            void main() {
                // Biến đổi vector từ Clip Space sang Hướng Không Gian 3D (World Space Vector)
                vec4 farPlaneSpaceCoord = u_viewDirectionProjectionInverse * vec4(v_texCoord, 1.0);
                vec3 rayDirection = normalize(farPlaneSpaceCoord.xyz / farPlaneSpaceCoord.w);
                
                vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0);
                vec4 hdriColor = vec4(0.0, 0.0, 0.0, 1.0);
                
                if (u_useBase) {
                    baseColor = texture(u_skyboxBase, rayDirection);
                }
                if (u_useHdri) {
                    hdriColor = texture(u_skyboxHdri, rayDirection);
                }
                
                // Thuật toán hòa trộn tuyến tính dựa trên trọng số thiết lập từ UI điều khiển
                if (u_useBase && u_useHdri) {
                    fragColor = mix(baseColor, hdriColor, u_blendWeight);
                } else if (u_useHdri) {
                    fragColor = hdriColor;
                } else {
                    fragColor = baseColor;
                }
            }
        `
    })
});
 
