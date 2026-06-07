/**
 * WebGLRenderer.js
 * Engine dựng hình WebGL2 thuần chạy hệ thống ánh sáng Phong Lighting tương tác thời gian thực.
 */
export class WebGLRenderer {
    constructor(canvasElement) {
        this.gl = canvasElement.getContext('webgl2', { alpha: true, antialias: true });
        if (!this.gl) {
            throw new Error("Trình duyệt không hỗ trợ WebGL2.");
        }
        this.program = null;
        this.initShaders();
        this.initBuffers();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    initShaders() {
        const vsSource = `#version 300 es
            in vec3 a_position;
            in vec3 a_normal;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            out vec3 v_normal;
            out vec3 v_fragPos;
            void main() {
                v_fragPos = a_position;
                v_normal = mat3(u_viewMatrix) * a_normal;
                gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);
            }
        `;

        const fsSource = `#version 300 es
            precision highp float;
            in vec3 v_normal;
            in vec3 v_fragPos;
            uniform vec3 u_viewPosition;
            out vec4 fragColor;
            void main() {
                vec3 norm = normalize(v_normal);
                vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3)); 
                
                // Ambient
                float ambientStrength = 0.25;
                vec3 ambient = ambientStrength * vec3(0.1, 0.15, 0.25);
                
                // Diffuse
                float diff = max(dot(norm, lightDir), 0.0);
                vec3 diffuse = diff * vec3(0.4, 0.5, 0.8);
                
                // Specular (Phong Highlight)
                vec3 viewDir = normalize(u_viewPosition - v_fragPos);
                vec3 reflectDir = reflect(-lightDir, norm);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                vec3 specular = 0.6 * spec * vec3(1.0, 1.0, 1.0);
                
                vec3 result = ambient + diffuse + specular;
                fragColor = vec4(result, 0.85);
            }
        `;

        const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(this.program));
        }
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const log = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(log);
        }
        return shader;
    }

    initBuffers() {
        // Tạo cấu trúc đa diện (Khối nền không gian ảo) làm mốc phản chiếu ánh sáng
        const vertices = new Float32Array([
            -50, -50, -100,  50, -50, -100,  0,  50, -100,
        ]);
        const normals = new Float32Array([
            0, 0, 1,  0, 0, 1,  0, 0, 1,
        ]);

        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        const posBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        const posLoc = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);

        const normBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);
        const normLoc = this.gl.getAttribLocation(this.program, 'a_normal');
        this.gl.enableVertexAttribArray(normLoc);
        this.gl.vertexAttribPointer(normLoc, 3, this.gl.FLOAT, false, 0, 0);
    }

    resize() {
        this.gl.canvas.width = this.gl.canvas.clientWidth;
        this.gl.canvas.height = this.gl.canvas.clientHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    render(viewMatrix, projMatrix, camPos) {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        const uView = this.gl.getUniformLocation(this.program, "u_viewMatrix");
        const uProj = this.gl.getUniformLocation(this.program, "u_projectionMatrix");
        const uCam = this.gl.getUniformLocation(this.program, "u_viewPosition");

        this.gl.uniformMatrix4fv(uView, false, viewMatrix);
        this.gl.uniformMatrix4fv(uProj, false, projMatrix);
        this.gl.uniform3f(uCam, camPos.x, camPos.y, camPos.z);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
}
 
