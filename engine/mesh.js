export class MeshManager {

    constructor({
        renderer,
        shaderManager,
        state,
        eventBus
    }) {

        if (!renderer) {
            throw new Error(
                'MeshManager requires renderer.'
            );
        }

        if (!shaderManager) {
            throw new Error(
                'MeshManager requires shaderManager.'
            );
        }

        this.renderer = renderer;
        this.shaderManager =
            shaderManager;

        this.gl = renderer.gl;

        this.state = state;
        this.eventBus = eventBus;

        this.meshes =
            new Map();

        this.geometryCache =
            new Map();
    }

    async initialize() {

        this.registerBuiltinMeshes();

        this.eventBus.emit(
            'mesh:initialized'
        );

        console.info(
            '[Mesh] Initialized'
        );
    }

    registerBuiltinMeshes() {

        this.createCube(
            'cube'
        );

        this.createPanel(
            'panel'
        );

        this.createCard(
            'card'
        );

        this.createGrid(
            'grid'
        );

        this.createHexCluster(
            'hex-cluster'
        );
    }

    createMesh({
        name,
        vertices,
        indices,
        stride = 3
    }) {

        const gl = this.gl;

        const vao =
            gl.createVertexArray();

        const vbo =
            gl.createBuffer();

        const ebo =
            gl.createBuffer();

        gl.bindVertexArray(
            vao
        );

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            vbo
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(
                vertices
            ),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            ebo
        );

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(
                indices
            ),
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(
            0
        );

        gl.vertexAttribPointer(
            0,
            3,
            gl.FLOAT,
            false,
            stride * 4,
            0
        );

        gl.bindVertexArray(
            null
        );

        const mesh = {
            name,
            vao,
            vbo,
            ebo,
            vertexCount:
                vertices.length /
                stride,
            indexCount:
                indices.length,
            stride
        };

        this.meshes.set(
            name,
            mesh
        );

        return mesh;
    }

    createCube(name) {

        const vertices = [

            -1,-1,-1,
             1,-1,-1,
             1, 1,-1,
            -1, 1,-1,

            -1,-1, 1,
             1,-1, 1,
             1, 1, 1,
            -1, 1, 1
        ];

        const indices = [

            0,1,2,
            2,3,0,

            4,5,6,
            6,7,4,

            0,4,7,
            7,3,0,

            1,5,6,
            6,2,1,

            3,2,6,
            6,7,3,

            0,1,5,
            5,4,0
        ];

        return this.createMesh({
            name,
            vertices,
            indices
        });
    }

    createPanel(name) {

        const vertices = [

            -2,-1,0,
             2,-1,0,
             2, 1,0,
            -2, 1,0
        ];

        const indices = [
            0,1,2,
            2,3,0
        ];

        return this.createMesh({
            name,
            vertices,
            indices
        });
    }

    createCard(name) {

        const vertices = [

            -1,-0.6,0,
             1,-0.6,0,
             1, 0.6,0,
            -1, 0.6,0
        ];

        const indices = [
            0,1,2,
            2,3,0
        ];

        return this.createMesh({
            name,
            vertices,
            indices
        });
    }

    createGrid(
        name,
        size = 100,
        step = 1
    ) {

        const vertices = [];
        const indices = [];

        let index = 0;

        for (
            let i = -size;
            i <= size;
            i += step
        ) {

            vertices.push(
                -size,
                0,
                i
            );

            vertices.push(
                size,
                0,
                i
            );

            indices.push(
                index,
                index + 1
            );

            index += 2;

            vertices.push(
                i,
                0,
                -size
            );

            vertices.push(
                i,
                0,
                size
            );

            indices.push(
                index,
                index + 1
            );

            index += 2;
        }

        return this.createMesh({
            name,
            vertices,
            indices
        });
    }

    createHexCluster(name) {

        const vertices = [];

        const indices = [];

        const radius = 1;

        vertices.push(
            0,0,0
        );

        for (
            let i = 0;
            i < 6;
            i++
        ) {

            const angle =
                (Math.PI / 3) * i;

            vertices.push(
                Math.cos(angle) *
                radius,

                Math.sin(angle) *
                radius,

                0
            );
        }

        for (
            let i = 1;
            i <= 6;
            i++
        ) {

            indices.push(
                0,
                i,
                i === 6
                    ? 1
                    : i + 1
            );
        }

        return this.createMesh({
            name,
            vertices,
            indices
        });
    }

    draw(
        meshName
    ) {

        const mesh =
            this.meshes.get(
                meshName
            );

        if (!mesh) {

            throw new Error(
                `Mesh not found: ${meshName}`
            );
        }

        const gl =
            this.gl;

        gl.bindVertexArray(
            mesh.vao
        );

        gl.drawElements(
            gl.TRIANGLES,
            mesh.indexCount,
            gl.UNSIGNED_SHORT,
            0
        );

        gl.bindVertexArray(
            null
        );
    }

    getMesh(name) {

        return this.meshes.get(
            name
        );
    }

    destroyMesh(name) {

        const mesh =
            this.meshes.get(
                name
            );

        if (!mesh) {
            return;
        }

        const gl =
            this.gl;

        gl.deleteBuffer(
            mesh.vbo
        );

        gl.deleteBuffer(
            mesh.ebo
        );

        gl.deleteVertexArray(
            mesh.vao
        );

        this.meshes.delete(
            name
        );
    }

    destroy() {

        for (
            const name
            of this.meshes.keys()
        ) {

            this.destroyMesh(
                name
            );
        }

        this.geometryCache.clear();

        this.eventBus.emit(
            'mesh:destroyed'
        );
    }
} 
