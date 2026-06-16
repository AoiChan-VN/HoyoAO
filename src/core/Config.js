const SKYBOX_VERSION = 'skybox-v1';

const LAYER0_BASE_PATH =
    `/assets/textures/${SKYBOX_VERSION}/layer0-base`;

const LAYER1_HDRI_PATH =
    `/assets/textures/${SKYBOX_VERSION}/layer1-hdri`;

const CUBEMAP_FACES = Object.freeze([
    'px',
    'nx',
    'py',
    'ny',
    'pz',
    'nz'
]);

const CONFIG = Object.freeze({
    APPLICATION: Object.freeze({
        NAME: 'Enterprise Native 3D Platform',
        VERSION: '1.0.0'
    }),

    FEATURE_FLAGS: Object.freeze({
        ENABLE_GYROSCOPE: true,
        ENABLE_TOUCH_INPUT: true,
        ENABLE_MOUSE_INPUT: true,
        ENABLE_MIPMAPS: true,
        ENABLE_ANISOTROPIC_FILTERING: true
    }),

    CAMERA: Object.freeze({
        DEFAULT_YAW: 0.0,
        DEFAULT_PITCH: 0.0,
        DEFAULT_FOV_DEGREES: 75.0,
        NEAR_CLIP: 0.01,
        FAR_CLIP: 1000.0,

        ROTATION_SPEED_MOUSE: 0.0025,
        ROTATION_SPEED_TOUCH: 0.0035,
        ROTATION_SPEED_GYRO: 0.0015
    }),

    RENDERING: Object.freeze({
        TARGET_FPS: 60,

        CLEAR_COLOR: Object.freeze([
            0.0,
            0.0,
            0.0,
            1.0
        ]),

        DEPTH_TEST: false,
        CULL_FACE: false,

        CANVAS_ATTRIBUTES: Object.freeze({
            alpha: false,
            antialias: true,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            premultipliedAlpha: false,
            powerPreference: 'high-performance',
            desynchronized: true
        })
    }),

    SKYBOX: Object.freeze({
        SIZE: 1.0,

        BLEND_FACTOR: 0.65,

        BASE_LAYER: Object.freeze({
            PATH: LAYER0_BASE_PATH,
            EXTENSION: 'webp'
        }),

        HDRI_LAYER: Object.freeze({
            PATH: LAYER1_HDRI_PATH,
            EXTENSION: 'png'
        }),

        FACES: CUBEMAP_FACES
    }),

    EVENTS: Object.freeze({
        INPUT_ROTATE: 'input.rotate',
        INPUT_ZOOM: 'input.zoom',

        CAMERA_UPDATED: 'camera.updated',

        ENGINE_READY: 'engine.ready',
        ENGINE_DESTROYED: 'engine.destroyed',

        GYRO_PERMISSION_GRANTED:
            'gyro.permission.granted',

        GYRO_PERMISSION_DENIED:
            'gyro.permission.denied'
    }),

    TEXTURES: Object.freeze({
        MIN_FILTER: 'LINEAR_MIPMAP_LINEAR',
        MAG_FILTER: 'LINEAR',
        WRAP_S: 'CLAMP_TO_EDGE',
        WRAP_T: 'CLAMP_TO_EDGE',
        WRAP_R: 'CLAMP_TO_EDGE'
    }),

    INPUT: Object.freeze({
        MOUSE_WHEEL_ZOOM_FACTOR: 0.05,

        TOUCH_PINCH_FACTOR: 0.008,

        MAX_DELTA_YAW: 2.0,
        MAX_DELTA_PITCH: 2.0
    })
});

export {
    CONFIG
};
