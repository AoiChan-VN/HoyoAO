// ./js/database/scenes-db.js

export const SCENES_DB = {
    documents: [
        {
            id: 'system-guide',
            title: 'System Guide',
            type: 'markdown',
            source:
                './assets/docs/system-guide.md',
            position: {
                x: -1.6,
                y: 1.4,
                z: -3.0
            },
            scale: {
                x: 1.2,
                y: 1.2,
                z: 1.0
            }
        },
        {
            id: 'security-policy',
            title: 'Security Policy',
            type: 'markdown',
            source:
                './assets/docs/security-policy.md',
            position: {
                x: 0.0,
                y: 1.4,
                z: -3.0
            },
            scale: {
                x: 1.2,
                y: 1.2,
                z: 1.0
            }
        },
        {
            id: 'whitepaper',
            title: 'Whitepaper',
            type: 'pdf',
            source:
                './assets/docs/whitepaper.pdf',
            position: {
                x: 1.6,
                y: 1.4,
                z: -3.0
            },
            scale: {
                x: 1.2,
                y: 1.2,
                z: 1.0
            }
        }
    ],

    menus: [
        {
            id: 'main-menu',
            label: '≡',
            position: {
                x: -2.2,
                y: 2.0,
                z: -2.2
            }
        }
    ],

    telemetryPanels: [
        {
            id: 'telemetry-panel',
            position: {
                x: 2.0,
                y: 1.8,
                z: -2.5
            },
            visible: false
        }
    ],

    validatorPanels: [
        {
            id: 'validator-panel',
            position: {
                x: 2.0,
                y: 0.8,
                z: -2.5
            },
            visible: false
        }
    ],

    environment: {
        skybox: {
            positiveX:
                './assets/textures/skybox/px.jpg',
            negativeX:
                './assets/textures/skybox/nx.jpg',
            positiveY:
                './assets/textures/skybox/py.jpg',
            negativeY:
                './assets/textures/skybox/ny.jpg',
            positiveZ:
                './assets/textures/skybox/pz.jpg',
            negativeZ:
                './assets/textures/skybox/nz.jpg'
        },

        hologramGrid:
            './assets/textures/ui-hologram/grid.png',

        hologramNoise:
            './assets/textures/ui-hologram/noise.png'
    },

    audio: {
        click:
            './assets/audio/spatial-click.mp3',

        ambient:
            './assets/audio/ambient-space.mp3'
    }
};

export function getSceneDocument(
    documentId
) {
    return (
        SCENES_DB.documents.find(
            (document) =>
                document.id ===
                documentId
        ) || null
    );
}

export function getMenu(
    menuId
) {
    return (
        SCENES_DB.menus.find(
            (menu) =>
                menu.id === menuId
        ) || null
    );
}

export function getTelemetryPanel(
    panelId
) {
    return (
        SCENES_DB.telemetryPanels.find(
            (panel) =>
                panel.id === panelId
        ) || null
    );
}

export function getValidatorPanel(
    panelId
) {
    return (
        SCENES_DB.validatorPanels.find(
            (panel) =>
                panel.id === panelId
        ) || null
    );
} 
