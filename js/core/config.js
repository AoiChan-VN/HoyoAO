/* ==========================================================================
   js/core/config.js
   Native Browser Experience Engine
   ========================================================================== */

export const CONFIG = Object.freeze({

    APP: Object.freeze({

        NAME: 'Native Browser Experience Engine',

        VERSION: '1.0.0',

        AUTHOR: 'Aoi Dev'

    }),

    PATHS: Object.freeze({

        LOCAL_DATA: './data/localdata.json',

        MARKDOWN_ROOT: './data/md/',

        PDF_ROOT: './data/pdf/',

        DOCX_ROOT: './data/docs/',

        HDRI_ROOT: './assets/hdri/',

        SKYBOX_ROOT: './assets/skybox/',

        LOGO_ROOT: './assets/logo/'

    }),

    EXPERIENCE: Object.freeze({

        TARGET_FPS: 60,

        MAX_DELTA_TIME: 0.05,

        CAMERA_SMOOTHING: 0.08,

        CAMERA_ZOOM_MIN: 0.75,

        CAMERA_ZOOM_MAX: 2.5,

        CAMERA_DEFAULT_ZOOM: 1,

        CAMERA_ROTATION_LIMIT_X: 35,

        CAMERA_ROTATION_LIMIT_Y: 35,

        POINTER_SENSITIVITY: 0.08,

        TOUCH_SENSITIVITY: 0.14,

        GYRO_SENSITIVITY: 0.55,

        WHEEL_ZOOM_SPEED: 0.0009,

        PARALLAX_DAMPING: 0.09,

        PARALLAX_SCROLL_FACTOR: 0.08,

        HDRI_SCALE: 1.05

    }),

    SKYBOX: Object.freeze({

        LAYER_1: Object.freeze({

            DEPTH: 120,

            SPEED: 0.35

        }),

        LAYER_2: Object.freeze({

            DEPTH: 260,

            SPEED: 0.65

        }),

        LAYER_3: Object.freeze({

            DEPTH: 420,

            SPEED: 1.0

        })

    }),

    CACHE: Object.freeze({

        MAX_JSON_CACHE: 128,

        MAX_TEXT_CACHE: 256,

        MAX_BINARY_CACHE: 64

    }),

    SEARCH: Object.freeze({

        MIN_QUERY_LENGTH: 1,

        MAX_RESULTS: 500

    }),

    THEME: Object.freeze({

        STORAGE_KEY: 'aoi-theme',

        DEFAULT_THEME: 'dark'

    }),

    EVENTS: Object.freeze({

        RESIZE: 'app:resize',

        THEME_CHANGED: 'theme:changed',

        CAMERA_UPDATED: 'camera:updated',

        CONTENT_LOADED: 'content:loaded',

        CATEGORY_CHANGED: 'category:changed',

        FILE_OPENED: 'file:opened',

        SEARCH_UPDATED: 'search:updated'

    })

});

/* ==========================================================================
   DOM HELPERS
   ========================================================================== */

export const DOM = Object.freeze({

    html: document.documentElement,

    body: document.body

});

/* ==========================================================================
   FEATURE DETECTION
   ========================================================================== */

export const FEATURES = Object.freeze({

    touch:
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0,

    pointer:
        'PointerEvent' in window,

    deviceOrientation:
        'DeviceOrientationEvent' in window,

    deviceMotion:
        'DeviceMotionEvent' in window,

    intersectionObserver:
        'IntersectionObserver' in window,

    resizeObserver:
        'ResizeObserver' in window,

    requestIdleCallback:
        'requestIdleCallback' in window

});

/* ==========================================================================
   RUNTIME STATE
   ========================================================================== */

export const RUNTIME = {

    started: false,

    page: (() => {

        const path = location.pathname
            .split('/')
            .pop()
            ?.toLowerCase() || '';

        if (path === 'wiki.html') {
            return 'wiki';
        }

        return 'experience';

    })(),

    width: window.innerWidth,

    height: window.innerHeight,

    pixelRatio: Math.min(
        window.devicePixelRatio || 1,
        2
    ),

    lastFrameTime: performance.now()

};

/* ==========================================================================
   ENVIRONMENT
   ========================================================================== */

export function isWikiPage() {

    return RUNTIME.page === 'wiki';

}

export function isExperiencePage() {

    return RUNTIME.page === 'experience';

}

export function updateViewportState() {

    RUNTIME.width = window.innerWidth;
    RUNTIME.height = window.innerHeight;
    RUNTIME.pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        2
    );

} 
