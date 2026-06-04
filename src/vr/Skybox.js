export class Skybox {
    constructor(gl, store) {
        this.gl = gl;
        this.store = store;
        this.program = null;
        this.vao = null;
        this.texture = null;
    }

    async loadTextures() {
        const gl = this.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

        const faces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: './assets/images/skybox/px.jpg' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: './assets/images/skybox/nx.jpg' },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: './assets/images/skybox/py.jpg' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: './assets/images/skybox/ny.jpg' },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: './assets/images/skybox/pz.jpg' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: './assets/images/skybox/nz.jpg' }
        ];

        const loadFace = (face) => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.src = face.url;
                image.onload = () => {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
                    gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    resolve();
                };
                image.onerror = () => reject(new Error(`Failed to load texture: ${face.url}`));
            });
        };

        await Promise.all(faces.map(loadFace));

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        this.initializeGeometry();
    }

    initializeGeometry() {
        const gl = this.gl;

        const vsSource = `#version 300 es
            in vec3 a_position;
            out vec3 v_texCoord;
            uniform mat4 u_viewProjection;
            void main() {
                v_texCoord = a_position;
                vec4 pos = u_viewProjection * vec4(a_position, 1.0);
                gl_Position = pos.xyww;
            }`;

        const fsSource = `#version 300 es
            precision highp float;
            in vec3 v_texCoord;
            uniform samplerCube u_skybox;
            out vec4 outColor;
            void main() {
                outColor = texture(u_skybox, v_texCoord);
            }`;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        const positions = new Float32Array([
            -1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0,
            -1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
            -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0
        ]);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    }

    draw(viewMatrix, projectionMatrix) {
        const gl = this.gl;

        const cleanViewMatrix = new Float32Array(viewMatrix);
        cleanViewMatrix[12] = 0.0;
        cleanViewMatrix[13] = 0.0;
        cleanViewMatrix[14] = 0.0;

        const viewProjection = new Float32Array(16);
        this.multiplyMatrices(viewProjection, projectionMatrix, cleanViewMatrix);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        const vpLocation = gl.getUniformLocation(this.program, 'u_viewProjection');
        gl.uniformMatrix4fv(vpLocation, false, viewProjection);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.uniform1i(gl.getUniformLocation(this.program, 'u_skybox'), 0);

        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    multiplyMatrices(out, a, b) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[i * 4 + k] * b[k * 4 + j];
                }
                out[i * 4 + j] = sum;
            }
        }
    }

    destroy() {
        const gl = this.gl;
        if (this.vao) gl.deleteVertexArray(this.vao);
        if (this.texture) gl.deleteTexture(this.texture);
        if (this.program) gl.deleteProgram(this.program);
    }
}
 
