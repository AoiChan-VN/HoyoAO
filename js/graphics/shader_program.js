export class ShaderProgram {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = this.createProgram(vertexSource, fragmentSource);
        this.attribs = {};
        this.uniforms = {};
    }

    createShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vs = this.createShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fs = this.createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    use() {
        if (this.program) {
            this.gl.useProgram(this.program);
        }
    }

    getAttribLocation(name) {
        if (this.attribs[name] !== undefined) return this.attribs[name];
        const location = this.gl.getAttribLocation(this.program, name);
        this.attribs[name] = location;
        return location;
    }

    getUniformLocation(name) {
        if (this.uniforms[name] !== undefined) return this.uniforms[name];
        const location = this.gl.getUniformLocation(this.program, name);
        this.uniforms[name] = location;
        return location;
    }

    setMat4(name, matrix) {
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniformMatrix4fv(loc, false, matrix);
        }
    }

    setVec3(name, x, y, z) {
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform3f(loc, x, y, z);
        }
    }

    setVec4(name, x, y, z, w) {
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform4f(loc, x, y, z, w);
        }
    }

    setFloat(name, value) {
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform1f(loc, value);
        }
    }

    setInt(name, value) {
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform1i(loc, value);
        }
    }

    destroy() {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
    }
}
 
