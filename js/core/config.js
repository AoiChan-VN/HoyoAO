/**
 * ============================================================================
 * File: js/core/config.js
 * Purpose: Centralized application configuration and constants
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

export const APP_CONFIG = Object.freeze({
    APPLICATION: Object.freeze({
        NAME: 'Vanilla Skybox Platform',
        VERSION: '1.0.0'
    }),

    SKYBOX: Object.freeze({
        ROTATION_SENSITIVITY_MOUSE: 0.15,
        ROTATION_SENSITIVITY_TOUCH: 0.18,

        MIN_PITCH_DEGREE: -85,
        MAX_PITCH_DEGREE: 85,

        INITIAL_YAW: 0,
        INITIAL_PITCH: 0,

        PERSPECTIVE_PX: 1200,

        CUBE_SIZE_PX: 2000,

        TRANSITION_DURATION_MS: 120,

        WILL_CHANGE_PROPERTY: 'transform'
    }),

    INPUT: Object.freeze({
        MOUSE_BUTTON_PRIMARY: 0,

        TOUCH_MIN_POINTS: 1,

        PASSIVE_EVENT_OPTIONS: Object.freeze({
            passive: true
        }),

        ACTIVE_EVENT_OPTIONS: Object.freeze({
            passive: false
        })
    }),

    EVENTS: Object.freeze({
        SKYBOX_ROTATION_REQUESTED: 'skybox.rotation.requested',

        SKYBOX_ROTATION_UPDATED: 'skybox.rotation.updated',

        SKYBOX_IMAGE_CHANGED: 'skybox.image.changed',

        OVERLAY_ACTION_TRIGGERED: 'overlay.action.triggered',

        OVERLAY_NEXT_SKYBOX_REQUESTED: 'overlay.next.skybox.requested',

        OVERLAY_PREVIOUS_SKYBOX_REQUESTED: 'overlay.previous.skybox.requested',

        OVERLAY_RESET_VIEW_REQUESTED: 'overlay.reset.view.requested',
        
        NAVIGATION_REQUESTED: 'navigation.requested',

        APPLICATION_ERROR: 'application.error'
    }),

    STORAGE: Object.freeze({
        CURRENT_SKYBOX_INDEX: 'skybox_current_index'
    }),

    REPOSITORY: Object.freeze({
        SKYBOX_IMAGE_LIMIT: 100
    })
}); 
