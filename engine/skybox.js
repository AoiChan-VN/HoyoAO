export class Skybox {

    constructor({
        world,
        renderer,
        camera,
        state,
        eventBus
    }) {

        if (!world) {
            throw new Error(
                'Skybox requires world.'
            );
        }

        if (!renderer) {
            throw new Error(
                'Skybox requires renderer.'
            );
        }

        if (!camera) {
            throw new Error(
                'Skybox requires camera.'
            );
        }

        this.world = world;
        this.renderer = renderer;
        this.camera = camera;
        this.state = state;
        this.eventBus = eventBus;

        this.shells = [];

        this.hexClusters = [];

        this.loaded = false;
    }

    async initialize() {

        this.createShells();

        this.createHexDepthClusters();

        this.loaded = true;

        this.eventBus.emit(
            'skybox:initialized',
            {
                shells:
                    this.shells.length
            }
        );

        console.info(
            '[Skybox] Initialized'
        );
    }

    createShells() {

        this.shells.push(
            this.createShell({
                id: 'sky-near',
                layer: 'skybox',
                radius: 1500,
                parallax: 0.25,
                texturePath:
                    './assets/skybox/near'
            })
        );

        this.shells.push(
            this.createShell({
                id: 'sky-medium',
                layer: 'skybox',
                radius: 3500,
                parallax: 0.10,
                texturePath:
                    './assets/skybox/medium'
            })
        );

        this.shells.push(
            this.createShell({
                id: 'sky-far',
                layer: 'skybox',
                radius: 8000,
                parallax: 0.03,
                texturePath:
                    './assets/skybox/far'
            })
        );
    }

    createShell(config) {

        const shell =
            this.world.createObject({
                id: config.id,
                name: config.id,
                layer: config.layer,
                boundingRadius:
                    config.radius,

                metadata: {
                    radius:
                        config.radius,

                    parallax:
                        config.parallax,

                    texturePath:
                        config.texturePath,

                    faces: {
                        px:
                            `${config.texturePath}/px.webp`,
                        nx:
                            `${config.texturePath}/nx.webp`,
                        py:
                            `${config.texturePath}/py.webp`,
                        ny:
                            `${config.texturePath}/ny.webp`,
                        pz:
                            `${config.texturePath}/pz.webp`,
                        nz:
                            `${config.texturePath}/nz.webp`
                    }
                },

                update:
                    (deltaTime, world, camera) => {

                        shell.position.x =
                            camera.position.x *
                            config.parallax;

                        shell.position.y =
                            camera.position.y *
                            config.parallax;

                        shell.position.z =
                            camera.position.z *
                            config.parallax;
                    },

                draw:
                    (gl, renderer) => {

                        /*
                         * Cube Render Pass
                         * Renderer Layer:
                         * Skybox
                         *
                         * Actual GPU draw code
                         * will be attached later
                         * after mesh system exists.
                         */
                    }
            });

        return shell;
    }

    createHexDepthClusters() {

        const radius = 1200;

        const spacing = 600;

        const positions = [
            [0, 0],

            [-1, -1],
            [0, -1],
            [1, -1],

            [-2, 0],
            [-1, 0],
            [1, 0],
            [2, 0],

            [-1, 1],
            [0, 1],
            [1, 1]
        ];

        for (
            let i = 0;
            i < positions.length;
            i++
        ) {

            const pos =
                positions[i];

            const cluster =
                this.world.createObject({
                    id:
                        `hex-depth-${i}`,

                    name:
                        'HexDepthCluster',

                    layer:
                        'far',

                    boundingRadius:
                        radius,

                    position: {
                        x:
                            pos[0] *
                            spacing,

                        y:
                            pos[1] *
                            spacing,

                        z:
                            -3000
                    },

                    metadata: {
                        type:
                            'hex-cluster',

                        radius
                    },

                    draw:
                        (gl, renderer) => {

                            /*
                             * Depth cluster rendering.
                             *
                             * Future:
                             * billboard cloud
                             * volumetric layer
                             * atmospheric fog
                             */
                        }
                });

            this.hexClusters.push(
                cluster
            );
        }
    }

    update(deltaTime) {

        if (!this.loaded) {
            return;
        }

        for (
            const shell
            of this.shells
        ) {

            if (
                typeof shell.update ===
                'function'
            ) {

                shell.update(
                    deltaTime,
                    this.world,
                    this.camera
                );
            }
        }
    }

    destroy() {

        for (
            const shell
            of this.shells
        ) {

            this.world.destroyObject(
                shell.id
            );
        }

        for (
            const cluster
            of this.hexClusters
        ) {

            this.world.destroyObject(
                cluster.id
            );
        }

        this.shells.length = 0;

        this.hexClusters.length = 0;

        this.loaded = false;

        this.eventBus.emit(
            'skybox:destroyed'
        );
    }
} 
