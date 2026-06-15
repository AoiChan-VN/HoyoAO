/**
 * ==========================================================
 * Application Configuration
 * File: js/core/config.js
 * ==========================================================
 */

export const CONFIG = Object.freeze({

    /**
     * ======================================================
     * APPLICATION
     * ======================================================
     */
    APPLICATION: Object.freeze({
        NAME: "3D Skybox Experience",
        VERSION: "1.0.0"
    }),

    /**
     * ======================================================
     * SKYBOX
     * ======================================================
     */
    SKYBOX: Object.freeze({

        INITIAL_ROTATION_X: 0,

        INITIAL_ROTATION_Y: 0,

        MIN_ROTATION_X: -90,

        MAX_ROTATION_X: 90,

        MIN_ROTATION_Y: -Infinity,

        MAX_ROTATION_Y: Infinity,

        DRAG_SENSITIVITY_DESKTOP: 0.18,

        DRAG_SENSITIVITY_TOUCH: 0.24,

        MOMENTUM_ENABLED: true,

        MOMENTUM_DAMPING: 0.92,

        MOMENTUM_STOP_THRESHOLD: 0.01,

        FRAME_RATE_LIMIT: 60,

        TRANSFORM_PRECISION: 4
    }),

    /**
     * ======================================================
     * INPUT
     * ======================================================
     */
    INPUT: Object.freeze({

        MIN_DRAG_DISTANCE: 1,

        MAX_TOUCH_POINTS: 1,

        PASSIVE_EVENTS: true,

        POINTER_LOCK_ENABLED: false
    }),

    /**
     * ======================================================
     * NAVIGATION
     * ======================================================
     */
    NAVIGATION: Object.freeze({

        MOBILE_BREAKPOINT: 768,

        ANIMATION_DURATION_MS: 250
    }),

    /**
     * ======================================================
     * ARTICLES
     * ======================================================
     */
    ARTICLES: Object.freeze({

        DEFAULT_PAGE_SIZE: 12,

        MIN_SEARCH_LENGTH: 1,

        MAX_SEARCH_LENGTH: 100,

        MAX_TITLE_LENGTH: 200,

        MAX_CATEGORY_LENGTH: 100,

        STORAGE_KEY_CURRENT_ARTICLE:
            "current_article_id",

        STORAGE_KEY_ARTICLE_PREFERENCES:
            "article_preferences"
    }),

    /**
     * ======================================================
     * STORAGE
     * ======================================================
     */
    STORAGE: Object.freeze({

        SKYBOX_STATE_KEY:
            "skybox_state",

        APPLICATION_STATE_KEY:
            "application_state"
    }),

    /**
     * ======================================================
     * EVENTS
     * ======================================================
     */
    EVENTS: Object.freeze({

        APPLICATION_INITIALIZED:
            "application.initialized",

        APPLICATION_ERROR:
            "application.error",

        NAVIGATION_CHANGED:
            "navigation.changed",

        NAVIGATION_MOBILE_OPENED:
            "navigation.mobile.opened",

        NAVIGATION_MOBILE_CLOSED:
            "navigation.mobile.closed",

        SKYBOX_INITIALIZED:
            "skybox.initialized",

        SKYBOX_ROTATED:
            "skybox.rotated",

        SKYBOX_IMAGE_CHANGED:
            "skybox.image.changed",

        SKYBOX_LOADING_STARTED:
            "skybox.loading.started",

        SKYBOX_LOADING_COMPLETED:
            "skybox.loading.completed",

        SKYBOX_LOADING_FAILED:
            "skybox.loading.failed",

        INPUT_DRAG_STARTED:
            "input.drag.started",

        INPUT_DRAG_MOVED:
            "input.drag.moved",

        INPUT_DRAG_ENDED:
            "input.drag.ended",

        ARTICLE_SELECTED:
            "article.selected",

        ARTICLE_SEARCH_CHANGED:
            "article.search.changed",

        ARTICLE_FILTER_CHANGED:
            "article.filter.changed",

        STATE_UPDATED:
            "state.updated"
    }),

    /**
     * ======================================================
     * DOM
     * ======================================================
     */
    DOM: Object.freeze({

        NAVIGATION_ROOT_ID:
            "navigation-root",

        FOOTER_ROOT_ID:
            "footer-root",

        HOME_APP_ID:
            "home-app",

        SKYBOX_CONTAINER_ID:
            "skybox-container",

        OVERLAY_CONTAINER_ID:
            "overlay-container"
    }),

    /**
     * ======================================================
     * CSS CLASSES
     * ======================================================
     */
    CSS_CLASSES: Object.freeze({

        SKYBOX: "skybox",

        SKYBOX_LOADING:
            "skybox--loading",

        SKYBOX_ERROR:
            "skybox--error",

        MOBILE_PANEL_OPEN:
            "app-navigation__mobile-panel--open",

        ACTIVE_LINK:
            "app-navigation__link--active"
    }),

    /**
     * ======================================================
     * MOCK API
     * ======================================================
     */
    API: Object.freeze({

        SKYBOX_ENDPOINT:
            "/mock-api/skybox",

        ARTICLES_ENDPOINT:
            "/mock-api/articles"
    })

}); 
