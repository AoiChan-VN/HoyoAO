/* ==========================================================================
   SCENE CONFIGURATION DATABASE
   File: database/scene-config.js
   ========================================================================== */

export const SCENE_CONFIG = {
    id: 'scene-default',

    title: 'Default VR Scene',

    texturePath:
        './assets/textures/scene-default',

    skybox: {
        baseLayer: {
            px: './assets/textures/scene-default/layer-0-base/px.webp',
            nx: './assets/textures/scene-default/layer-0-base/nx.webp',
            py: './assets/textures/scene-default/layer-0-base/py.webp',
            ny: './assets/textures/scene-default/layer-0-base/ny.webp',
            pz: './assets/textures/scene-default/layer-0-base/pz.webp',
            nz: './assets/textures/scene-default/layer-0-base/nz.webp'
        },

        parallaxLayer: {
            px: './assets/textures/scene-default/layer-1-parallax/px.png',
            nx: './assets/textures/scene-default/layer-1-parallax/nx.png',
            py: './assets/textures/scene-default/layer-1-parallax/py.png',
            ny: './assets/textures/scene-default/layer-1-parallax/ny.png',
            pz: './assets/textures/scene-default/layer-1-parallax/pz.png',
            nz: './assets/textures/scene-default/layer-1-parallax/nz.png'
        }
    },

    camera: {
        yaw: 0,
        pitch: 0,

        minPitch: -85,
        maxPitch: 85,

        fov: 75,

        minFov: 35,
        maxFov: 110
    },

    hotspots: [
        {
            id: 'intro-livingroom',

            title: 'Phòng Khách VR',

            article:
                './content/articles/intro-livingroom.md',

            position: {
                x: 2.5,
                y: 0.8,
                z: -4.5
            },

            radius: 0.45
        },

        {
            id: 'intro-showroom',

            title: 'Showroom Sản Phẩm',

            article:
                './content/articles/intro-showroom.md',

            position: {
                x: -3.2,
                y: 1.0,
                z: 4.2
            },

            radius: 0.45
        }
    ]
};

export function getSceneConfig() {
    return SCENE_CONFIG;
}

export function getHotspotById(hotspotId) {
    for (const hotspot of SCENE_CONFIG.hotspots) {
        if (hotspot.id === hotspotId) {
            return hotspot;
        }
    }

    return null;
}

export function getArticlePathByHotspotId(hotspotId) {
    const hotspot = getHotspotById(hotspotId);

    if (!hotspot) {
        return null;
    }

    return hotspot.article;
} 
