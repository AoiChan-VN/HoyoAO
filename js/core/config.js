/* ==========================================================================
   js/core/config.js
   Native Browser Experience Engine
   Global Configuration
   ========================================================================== */

export const CONFIG = {

    /* ====================================================================== */
    /* EXPERIENCE */
    /* ====================================================================== */

    EXPERIENCE: {

        TARGET_FPS: 60,

        MAX_DELTA_TIME: 0.05,

        /* CAMERA */

        CAMERA_DEFAULT_ZOOM: 1,

        CAMERA_ZOOM_MIN: 0.75,

        CAMERA_ZOOM_MAX: 2.25,

        CAMERA_ROTATION_LIMIT_X: 12,

        CAMERA_ROTATION_LIMIT_Y: 18,

        CAMERA_SMOOTHING: 0.08,

        WHEEL_ZOOM_SPEED: 0.0012,

        /* PARALLAX */

        PARALLAX_DAMPING: 0.08,

        PARALLAX_SCROLL_FACTOR: 0.04,

        /* GYROSCOPE */

        GYRO_SENSITIVITY: 1.15,

        /* HDRI */

        HDRI_SCALE: 1.12,

        /* SKYBOX */

        SKYBOX_SMOOTHING: 0.06,

        SKYBOX_DEPTH_BACK: 12,

        SKYBOX_DEPTH_MIDDLE: 26,

        SKYBOX_DEPTH_FRONT: 48,

        SKYBOX_SPEED_BACK: 0.35,

        SKYBOX_SPEED_MIDDLE: 0.65,

        SKYBOX_SPEED_FRONT: 1.0

    },

    /* ====================================================================== */
    /* SEARCH */
    /* ====================================================================== */

    SEARCH: {

        MIN_QUERY_LENGTH: 1,

        MAX_RESULTS: 100

    },

    /* ====================================================================== */
    /* UI */
    /* ====================================================================== */

    UI: {

        DEFAULT_THEME: 'dark',

        LOADING_FADE_DURATION: 300,

        TRANSITION_DURATION: 220

    },

    /* ====================================================================== */
    /* STORAGE */
    /* ====================================================================== */

    STORAGE: {

        THEME_KEY:
            'native-wiki-theme'

    },

    /* ====================================================================== */
    /* DATA */
    /* ====================================================================== */

    DATA: {

        ROOT:
            './data/',

        INDEX:
            './data/localdata.json'

    },

    /* ====================================================================== */
    /* FILE TYPES */
    /* ====================================================================== */

    FILE_TYPES: {

        MARKDOWN: [

            '.md',
            '.markdown'

        ],

        PDF: [

            '.pdf'

        ],

        DOCX: [

            '.docx'

        ]

    },

    /* ====================================================================== */
    /* CACHE */
    /* ====================================================================== */

    CACHE: {

        ENABLED: true,

        MAX_ITEMS: 512

    },

    /* ====================================================================== */
    /* VIEWER */
    /* ====================================================================== */

    VIEWER: {

        PDF_HEIGHT_RATIO: 0.85,

        DOCX_MAX_SIZE:
            50 * 1024 * 1024,

        MARKDOWN_MAX_SIZE:
            20 * 1024 * 1024

    },

    /* ====================================================================== */
    /* PERFORMANCE */
    /* ====================================================================== */

    PERFORMANCE: {

        PASSIVE_EVENTS: true,

        LAZY_LOADING: true,

        IMAGE_DECODING: true,

        OBSERVER_THRESHOLD: 0.1

    },

    /* ====================================================================== */
    /* SKYBOX */
    /* ====================================================================== */

    SKYBOX: {

        BACKGROUND: {

            front:
                './assets/skybox/background/front.webp',

            back:
                './assets/skybox/background/back.webp',

            left:
                './assets/skybox/background/left.webp',

            right:
                './assets/skybox/background/right.webp',

            top:
                './assets/skybox/background/top.webp',

            bottom:
                './assets/skybox/background/bottom.webp'

        },

        ATMOSPHERE: {

            front:
                './assets/skybox/atmosphere/front.webp',

            back:
                './assets/skybox/atmosphere/back.webp',

            left:
                './assets/skybox/atmosphere/left.webp',

            right:
                './assets/skybox/atmosphere/right.webp',

            top:
                './assets/skybox/atmosphere/top.webp',

            bottom:
                './assets/skybox/atmosphere/bottom.webp'

        },

        FOREGROUND: {

            front:
                './assets/skybox/foreground/front.webp',

            back:
                './assets/skybox/foreground/back.webp',

            left:
                './assets/skybox/foreground/left.webp',

            right:
                './assets/skybox/foreground/right.webp',

            top:
                './assets/skybox/foreground/top.webp',

            bottom:
                './assets/skybox/foreground/bottom.webp'

        }

    }

};

/* ==========================================================================
   IMMUTABLE CONFIG
   ========================================================================== */

Object.freeze(
    CONFIG
);

Object.freeze(
    CONFIG.EXPERIENCE
);

Object.freeze(
    CONFIG.SEARCH
);

Object.freeze(
    CONFIG.UI
);

Object.freeze(
    CONFIG.STORAGE
);

Object.freeze(
    CONFIG.DATA
);

Object.freeze(
    CONFIG.FILE_TYPES
);

Object.freeze(
    CONFIG.CACHE
);

Object.freeze(
    CONFIG.VIEWER
);

Object.freeze(
    CONFIG.PERFORMANCE
);

Object.freeze(
    CONFIG.SKYBOX
); 
