// ./js/app.js

import { WebGLContext } from './core/webgl-context.js';
import { CameraMatrix } from './core/camera-matrix.js';
import { Engine3D } from './core/engine-3d.js';
import { XRDevice } from './core/xr-device.js';

import { HardwareMonitor } from './telemetry/hardware-monitor.js';
import { codeValidator } from './telemetry/code-validator.js';

import { platformState } from './database/platform-state.js';

import { HUDTelemetry } from './components/hud-telemetry.js';
import { HUDValidator } from './components/hud-validator.js';
import { SpatialMenu } from './components/spatial-menu.js';
import { DocPanel } from './components/doc-panel.js';

import {
    SCENES_DB
} from './database/scenes-db.js';

import { MDParser } from './parser/md-parser.js';
import { PDFLoader } from './parser/pdf-loader.js';

class XRApplication {
    constructor() {
        this.webglContext =
            null;

        this.gl =
            null;

        this.camera =
            null;

        this.engine =
            null;

        this.xrDevice =
            null;

        this.hardwareMonitor =
            null;

        this.telemetryHUD =
            null;

        this.validatorHUD =
            null;

        this.spatialMenu =
            null;

        this.documentPanels =
            [];

        this.mdParser =
            new MDParser();

        this.pdfLoader =
            new PDFLoader();
    }

    async initialize() {
        try {
            await this.initializeCore();

            await this.initializeXR();

            await this.initializeHUD();

            await this.initializeDocuments();

            this.registerSceneObjects();

            this.bindState();

            this.start();

            console.info(
                '[AOI_DEV] XR Platform Booted.'
            );
        } catch (
            error
        ) {
            console.error(
                '[AOI_DEV]',
                error
            );

            throw error;
        }
    }

    async initializeCore() {
        this.webglContext =
            new WebGLContext(
                'xr-canvas'
            );

        this.gl =
            this.webglContext
                .initialize();

        this.camera =
            new CameraMatrix();

        this.hardwareMonitor =
            new HardwareMonitor();

        this.engine =
            new Engine3D({
                gl: this.gl,
                camera:
                    this.camera,
                hardwareMonitor:
                    this.hardwareMonitor
            });

        codeValidator.initialize();
    }

    async initializeXR() {
        this.xrDevice =
            new XRDevice();

        const supported =
            await this.xrDevice
                .initialize();

        platformState.set(
            'xrMode',
            supported
                ? 'xr-ready'
                : 'desktop'
        );

        this.xrDevice
            .setSessionStartCallback(
                (
                    session,
                    referenceSpace
                ) => {
                    this.engine
                        .attachXRSession(
                            session,
                            referenceSpace
                        );
                }
            );

        this.xrDevice
            .setSessionEndCallback(
                () => {
                    platformState.set(
                        'xrMode',
                        'desktop'
                    );
                }
            );
    }

    async initializeHUD() {
        this.telemetryHUD =
            new HUDTelemetry();

        this.telemetryHUD
            .setPosition(
                2,
                1.8,
                -2.5
            );

        this.validatorHUD =
            new HUDValidator();

        this.validatorHUD
            .setPosition(
                2,
                0.8,
                -2.5
            );

        this.spatialMenu =
            new SpatialMenu();

        this.spatialMenu
            .setPosition(
                -2,
                2,
                -2
            );

        this.spatialMenu
            .addItem(
                'toggle-telemetry',
                'Toggle Telemetry',
                () => {
                    const current =
                        platformState.get(
                            'telemetryVisible'
                        );

                    platformState.set(
                        'telemetryVisible',
                        !current
                    );
                }
            );

        this.spatialMenu
            .addItem(
                'toggle-validator',
                'Toggle Validator',
                () => {
                    const current =
                        platformState.get(
                            'validatorVisible'
                        );

                    platformState.set(
                        'validatorVisible',
                        !current
                    );
                }
            );

        this.spatialMenu
            .addItem(
                'start-xr',
                'Enter XR',
                async () => {
                    if (
                        this.xrDevice
                            .isSupported()
                    ) {
                        await this.xrDevice
                            .startSession();
                    }
                }
            );
    }

    async initializeDocuments() {
        for (
            let i = 0;
            i <
            SCENES_DB.documents
                .length;
            i += 1
        ) {
            const documentConfig =
                SCENES_DB
                    .documents[i];

            const panel =
                new DocPanel();

            panel.setTitle(
                documentConfig.title
            );

            panel.setPosition(
                documentConfig
                    .position.x,
                documentConfig
                    .position.y,
                documentConfig
                    .position.z
            );

            try {
                if (
                    documentConfig.type ===
                    'markdown'
                ) {
                    const tokens =
                        await this
                            .mdParser
                            .load(
                                documentConfig.source
                            );

                    const content =
                        tokens.map(
                            (
                                token
                            ) =>
                                token.text
                        );

                    panel.setContent(
                        content
                    );
                }

                if (
                    documentConfig.type ===
                    'pdf'
                ) {
                    const result =
                        await this
                            .pdfLoader
                            .load(
                                documentConfig.source
                            );

                    panel.setContent([
                        `PDF Size: ${result.metadata.size}`,
                        `Pages: ${result.metadata.pageCount}`,
                        '',
                        'PDF loaded successfully.'
                    ]);
                }
            } catch (
                error
            ) {
                panel.setContent([
                    'DOCUMENT LOAD ERROR',
                    error.message
                ]);
            }

            this.documentPanels.push(
                panel
            );
        }
    }

    registerSceneObjects() {
        this.engine.add(
            this.telemetryHUD
        );

        this.engine.add(
            this.validatorHUD
        );

        this.engine.add(
            this.spatialMenu
        );

        for (
            let i = 0;
            i <
            this.documentPanels
                .length;
            i += 1
        ) {
            this.engine.add(
                this.documentPanels[
                    i
                ]
            );
        }
    }

    bindState() {
        platformState.subscribe(
            (state) => {
                this.telemetryHUD
                    .setVisible(
                        state.telemetryVisible
                    );

                this.validatorHUD
                    .setVisible(
                        state.validatorVisible
                    );

                this.spatialMenu
                    .setVisible(
                        state.menuVisible
                    );
            }
        );

        codeValidator.subscribe(
            (errors) => {
                this.validatorHUD
                    .updateErrors(
                        errors
                    );
            }
        );
    }

    start() {
        this.engine.start();

        this.updateLoop();
    }

    updateLoop() {
        const metrics =
            this.hardwareMonitor
                .getMetrics();

        this.telemetryHUD
            .updateMetrics(
                metrics
            );

        requestAnimationFrame(
            () =>
                this.updateLoop()
        );
    }
}

const application =
    new XRApplication();

window.addEventListener(
    'DOMContentLoaded',
    async () => {
        await application
            .initialize();
    }
);

export default application; 
