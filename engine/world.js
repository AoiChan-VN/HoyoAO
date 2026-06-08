export class World {

    constructor({
        renderer,
        camera,
        state,
        eventBus
    }) {

        if (!renderer) {
            throw new Error(
                'World requires renderer.'
            );
        }

        if (!camera) {
            throw new Error(
                'World requires camera.'
            );
        }

        if (!state) {
            throw new Error(
                'World requires state.'
            );
        }

        if (!eventBus) {
            throw new Error(
                'World requires eventBus.'
            );
        }

        this.renderer = renderer;
        this.camera = camera;
        this.state = state;
        this.eventBus = eventBus;

        this.objects = new Map();

        this.rootNodes = [];

        this.layers = {
            skybox: [],
            far: [],
            medium: [],
            near: [],
            ui: []
        };

        this.pendingDestroy =
            new Set();

        this.worldBounds = {
            minX: -5000,
            maxX: 5000,
            minY: -5000,
            maxY: 5000,
            minZ: -5000,
            maxZ: 5000
        };

        this.nextObjectId = 1;
    }

    async initialize() {

        this.registerEvents();

        this.state.merge({
            world: {
                loaded: true,
                objectCount: 0
            }
        });

        this.eventBus.emit(
            'world:initialized',
            {
                timestamp: Date.now()
            }
        );

        console.info(
            '[World] Initialized'
        );
    }

    registerEvents() {

        this.eventBus.on(
            'world:create',
            (config) => {

                this.createObject(
                    config
                );
            }
        );

        this.eventBus.on(
            'world:destroy',
            (objectId) => {

                this.destroyObject(
                    objectId
                );
            }
        );

        this.eventBus.on(
            'world:navigate',
            ({ route }) => {

                this.handleRoute(
                    route
                );
            }
        );
    }

    createObject(config = {}) {

        const object = {
            id:
                config.id ||
                `obj-${this.nextObjectId++}`,

            name:
                config.name ||
                'WorldObject',

            parentId:
                config.parentId ||
                null,

            layer:
                config.layer ||
                'near',

            visible:
                config.visible !== false,

            active:
                config.active !== false,

            position: {
                x:
                    config.position?.x || 0,
                y:
                    config.position?.y || 0,
                z:
                    config.position?.z || 0
            },

            rotation: {
                x:
                    config.rotation?.x || 0,
                y:
                    config.rotation?.y || 0,
                z:
                    config.rotation?.z || 0
            },

            scale: {
                x:
                    config.scale?.x || 1,
                y:
                    config.scale?.y || 1,
                z:
                    config.scale?.z || 1
            },

            boundingRadius:
                config.boundingRadius ||
                1,

            metadata:
                config.metadata || {},

            children: [],

            update:
                typeof config.update ===
                'function'
                    ? config.update
                    : null,

            draw:
                typeof config.draw ===
                'function'
                    ? config.draw
                    : null,

            isVisible:
                typeof config.isVisible ===
                'function'
                    ? config.isVisible
                    : null
        };

        this.objects.set(
            object.id,
            object
        );

        if (
            object.parentId
        ) {

            const parent =
                this.objects.get(
                    object.parentId
                );

            if (parent) {

                parent.children.push(
                    object.id
                );
            }

        } else {

            this.rootNodes.push(
                object.id
            );
        }

        this.attachLayer(
            object
        );

        this.renderer.addObject(
            object
        );

        this.updateState();

        this.eventBus.emit(
            'world:object-created',
            object
        );

        return object;
    }

    destroyObject(objectId) {

        const object =
            this.objects.get(
                objectId
            );

        if (!object) {
            return;
        }

        this.pendingDestroy.add(
            objectId
        );
    }

    processDestroyQueue() {

        for (
            const objectId
            of this.pendingDestroy
        ) {

            const object =
                this.objects.get(
                    objectId
                );

            if (!object) {
                continue;
            }

            if (
                object.parentId
            ) {

                const parent =
                    this.objects.get(
                        object.parentId
                    );

                if (parent) {

                    parent.children =
                        parent.children.filter(
                            id =>
                                id !== objectId
                        );
                }

            } else {

                this.rootNodes =
                    this.rootNodes.filter(
                        id =>
                            id !== objectId
                    );
            }

            this.detachLayer(
                object
            );

            this.renderer.removeObject(
                objectId
            );

            this.objects.delete(
                objectId
            );

            this.eventBus.emit(
                'world:object-destroyed',
                {
                    id: objectId
                }
            );
        }

        this.pendingDestroy.clear();

        this.updateState();
    }

    attachLayer(object) {

        const layer =
            this.layers[
                object.layer
            ];

        if (!layer) {
            return;
        }

        layer.push(
            object.id
        );
    }

    detachLayer(object) {

        const layer =
            this.layers[
                object.layer
            ];

        if (!layer) {
            return;
        }

        const index =
            layer.indexOf(
                object.id
            );

        if (
            index !== -1
        ) {

            layer.splice(
                index,
                1
            );
        }
    }

    update(deltaTime) {

        this.processDestroyQueue();

        for (
            const object
            of this.objects.values()
        ) {

            if (
                !object.active
            ) {
                continue;
            }

            if (
                typeof object.update ===
                'function'
            ) {

                object.update(
                    deltaTime,
                    this,
                    this.camera
                );
            }
        }
    }

    handleRoute(route) {

        this.eventBus.emit(
            'world:route-transition',
            {
                route
            }
        );
    }

    updateState() {

        this.state.merge({
            world: {
                loaded: true,
                objectCount:
                    this.objects.size
            }
        });
    }

    getObject(id) {

        return this.objects.get(
            id
        );
    }

    getObjects() {

        return Array.from(
            this.objects.values()
        );
    }

    getLayer(name) {

        return (
            this.layers[name] || []
        );
    }

    setVisible(
        objectId,
        visible
    ) {

        const object =
            this.objects.get(
                objectId
            );

        if (!object) {
            return;
        }

        object.visible =
            Boolean(
                visible
            );
    }

    setActive(
        objectId,
        active
    ) {

        const object =
            this.objects.get(
                objectId
            );

        if (!object) {
            return;
        }

        object.active =
            Boolean(
                active
            );
    }

    traverse(callback) {

        if (
            typeof callback !==
            'function'
        ) {
            return;
        }

        for (
            const object
            of this.objects.values()
        ) {

            callback(
                object
            );
        }
    }

    clear() {

        for (
            const object
            of this.objects.values()
        ) {

            this.renderer.removeObject(
                object.id
            );
        }

        this.objects.clear();

        this.rootNodes.length = 0;

        for (
            const layerName
            of Object.keys(
                this.layers
            )
        ) {

            this.layers[
                layerName
            ].length = 0;
        }

        this.updateState();
    }

    destroy() {

        this.clear();

        this.pendingDestroy.clear();

        this.eventBus.emit(
            'world:destroyed'
        );
    }
}
