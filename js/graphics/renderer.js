import { webglContext } from "../core/webgl_context.js";
import { ShaderProgram } from "./shader_program.js";
import { MeshBuffer } from "./mesh_buffer.js";
import { Camera } from "./camera.js";
import { mat4 } from "../core/math_3d.js";
import { gameState } from "../state/game_state.js";

const vertexShaderSource = `#version 300 es
in vec3 aPosition;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec3(aPosition, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 fragColor;
void main() {
    fragColor = uColor;
}`;

export const renderer = {
    gl: null,
    shader: null,
    camera: null,
    meshes: {},
    modelMatrix: null,

    initialize(canvas) {
        if (!webglContext.initialize(canvas)) {
            return false;
        }
        this.gl = webglContext.getGL();
        this.shader = new ShaderProgram(this.gl, vertexShaderSource, fragmentShaderSource);
        this.camera = new Camera();
        this.modelMatrix = mat4.create();
        this.setViewPort(canvas.width, canvas.height);
        return true;
    },

    setViewPort(width, height) {
        webglContext.setViewPort(width, height);
        if (this.camera) {
            this.camera.setPerspective(width, height);
        }
    },

    clear() {
        webglContext.clear();
    },

    getMesh(id, resourceModels) {
        if (this.meshes[id]) return this.meshes[id];
        const data = resourceModels[id] || resourceLoader.createFallbackModel(id);
        this.meshes[id] = new MeshBuffer(this.gl, data);
        return this.meshes[id];
    },

    renderScene(resources) {
        const gl = this.gl;
        if (!gl || !this.shader) return;

        this.shader.use();
        
        const playerPos = new Float32Array([gameState.player.x, gameState.player.y, gameState.player.z]);
        this.camera.update(0.016, playerPos);

        this.shader.setMat4("uViewMatrix", this.camera.getViewMatrix());
        this.shader.setMat4("uProjectionMatrix", this.camera.getProjectionMatrix());

        const posLoc = this.shader.getAttribLocation("aPosition");
        gl.enableVertexAttribArray(posLoc);

        const pMesh = this.getMesh("player_ship", resources.models);
        pMesh.bind();
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        mat4.identity(this.modelMatrix);
        mat4.translate(this.modelMatrix, this.modelMatrix, playerPos);
        this.shader.setMat4("uModelMatrix", this.modelMatrix);
        this.shader.setVec4("uColor", 0.0, 1.0, 0.8, 1.0);
        pMesh.draw();

        gameState.bullets.forEach(b => {
            const bMesh = this.getMesh("bullet", resources.models);
            bMesh.bind();
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, new Float32Array([b.x, b.y, b.z]));
            this.shader.setMat4("uModelMatrix", this.modelMatrix);
            if (b.type === "BULLET_PLAYER") {
                this.shader.setVec4("uColor", 1.0, 0.9, 0.2, 1.0);
            } else {
                this.shader.setVec4("uColor", 1.0, 0.1, 0.3, 1.0);
            }
            bMesh.draw();
        });

        gameState.enemies.forEach(e => {
            const meshId = e.type === "ENEMY_BOSS" ? "enemy_boss" : "enemy_drone";
            const eMesh = this.getMesh(meshId, resources.models);
            eMesh.bind();
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, new Float32Array([e.x, e.y, e.z]));
            this.shader.setMat4("uModelMatrix", this.modelMatrix);
            if (e.type === "ENEMY_BOSS") {
                this.shader.setVec4("uColor", 0.6, 0.1, 1.0, 1.0);
            } else {
                this.shader.setVec4("uColor", 1.0, 0.2, 0.2, 1.0);
            }
            eMesh.draw();
        });

        const pMeshSingle = this.getMesh("bullet", resources.models);
        pMeshSingle.bind();
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gameState.particles.forEach(p => {
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, new Float32Array([p.x, p.y, p.z]));
            mat4.scale(this.modelMatrix, this.modelMatrix, new Float32Array([p.size, p.size, p.size]));
            this.shader.setMat4("uModelMatrix", this.modelMatrix);
            const ratio = p.life / p.maxLife;
            this.shader.setVec4("uColor", 1.0, 0.5 * ratio + 0.2, 0.0, ratio);
            pMeshSingle.draw();
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
};
 
