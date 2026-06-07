/* ==========================================================================
   GLOBAL APPLICATION STORE
   File: src/core/store.js
   ========================================================================== */

import { getSceneConfig } from '../../database/scene-config.js';

const sceneConfig = getSceneConfig();

const listeners = new Map();

const state = {
    camera: {
        yaw: sceneConfig.camera.yaw,
        pitch: sceneConfig.camera.pitch,
        fov: sceneConfig.camera.fov
    },

    activeArticleId: null,

    activeArticlePath: null,

    activeHotspotId: null,

    menuOpen: true,

    panelVisible: false,

    viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
    }
};

function emit(eventName, payload) {
    const callbacks = listeners.get(eventName);

    if (!callbacks) {
        return;
    }

    for (const callback of callbacks) {
        callback(payload);
    }
}

export function subscribe(eventName, callback) {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(callback);

    return () => {
        const callbacks = listeners.get(eventName);

        if (!callbacks) {
            return;
        }

        callbacks.delete(callback);

        if (callbacks.size === 0) {
            listeners.delete(eventName);
        }
    };
}

export function getState() {
    return state;
}

export function getCameraState() {
    return state.camera;
}

export function setCameraYaw(yaw) {
    state.camera.yaw = yaw;

    emit('camera:change', {
        ...state.camera
    });
}

export function setCameraPitch(pitch) {
    const {
        minPitch,
        maxPitch
    } = sceneConfig.camera;

    state.camera.pitch =
        Math.max(
            minPitch,
            Math.min(maxPitch, pitch)
        );

    emit('camera:change', {
        ...state.camera
    });
}

export function setCameraRotation(yaw, pitch) {
    const {
        minPitch,
        maxPitch
    } = sceneConfig.camera;

    state.camera.yaw = yaw;

    state.camera.pitch =
        Math.max(
            minPitch,
            Math.min(maxPitch, pitch)
        );

    emit('camera:change', {
        ...state.camera
    });
}

export function setCameraFov(fov) {
    const {
        minFov,
        maxFov
    } = sceneConfig.camera;

    state.camera.fov =
        Math.max(
            minFov,
            Math.min(maxFov, fov)
        );

    emit('camera:fov', state.camera.fov);
}

export function openArticle(
    hotspotId,
    articlePath
) {
    state.activeHotspotId = hotspotId;
    state.activeArticleId = hotspotId;
    state.activeArticlePath = articlePath;

    state.panelVisible = true;

    emit('article:open', {
        hotspotId,
        articlePath
    });

    emit('panel:visibility', true);
}

export function closeArticle() {
    state.activeHotspotId = null;
    state.activeArticleId = null;
    state.activeArticlePath = null;

    state.panelVisible = false;

    emit('article:close', null);

    emit('panel:visibility', false);
}

export function setMenuOpen(isOpen) {
    state.menuOpen = Boolean(isOpen);

    emit(
        'menu:visibility',
        state.menuOpen
    );
}

export function setViewportSize(
    width,
    height,
    pixelRatio
) {
    state.viewport.width = width;
    state.viewport.height = height;
    state.viewport.pixelRatio = pixelRatio;

    emit(
        'viewport:resize',
        {
            ...state.viewport
        }
    );
}

export function getViewportState() {
    return state.viewport;
}

window.addEventListener('resize', () => {
    setViewportSize(
        window.innerWidth,
        window.innerHeight,
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );
}); 
