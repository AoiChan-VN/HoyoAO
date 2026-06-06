// ./js/core/xr-device.js

export class XRDevice {
    constructor() {
        this.isSupported = false;
        this.isSessionActive = false;

        this.xr = null;
        this.session = null;
        this.referenceSpace = null;

        this.viewerPose = null;

        this.supportedModes = {
            immersiveVR: false,
            immersiveAR: false,
            inline: false
        };
    }

    async initialize() {
        if (!('xr' in navigator)) {
            return;
        }

        this.xr = navigator.xr;
        this.isSupported = true;

        this.supportedModes.inline =
            await this.checkSessionSupport(
                'inline'
            );

        this.supportedModes.immersiveVR =
            await this.checkSessionSupport(
                'immersive-vr'
            );

        this.supportedModes.immersiveAR =
            await this.checkSessionSupport(
                'immersive-ar'
            );
    }

    async checkSessionSupport(mode) {
        try {
            return await this.xr.isSessionSupported(
                mode
            );
        } catch {
            return false;
        }
    }

    async startSession(
        mode = 'immersive-vr'
    ) {
        if (!this.xr) {
            throw new Error(
                '[XR] WebXR API unavailable.'
            );
        }

        if (this.session) {
            return this.session;
        }

        const session =
            await this.xr.requestSession(
                mode,
                {
                    optionalFeatures: [
                        'local',
                        'local-floor',
                        'bounded-floor'
                    ]
                }
            );

        session.addEventListener(
            'end',
            () => {
                this.isSessionActive = false;
                this.session = null;
                this.referenceSpace = null;
                this.viewerPose = null;
            }
        );

        this.referenceSpace =
            await session.requestReferenceSpace(
                'local-floor'
            );

        this.session = session;
        this.isSessionActive = true;

        return session;
    }

    async endSession() {
        if (!this.session) {
            return;
        }

        await this.session.end();
    }

    updateFrame(frame) {
        if (
            !frame ||
            !this.referenceSpace
        ) {
            return;
        }

        this.viewerPose =
            frame.getViewerPose(
                this.referenceSpace
            );
    }

    getViewerPose() {
        return this.viewerPose;
    }

    getSession() {
        return this.session;
    }

    getReferenceSpace() {
        return this.referenceSpace;
    }

    hasXRSupport() {
        return this.isSupported;
    }

    hasActiveSession() {
        return this.isSessionActive;
    }

    supportsInline() {
        return this.supportedModes.inline;
    }

    supportsImmersiveVR() {
        return this.supportedModes.immersiveVR;
    }

    supportsImmersiveAR() {
        return this.supportedModes.immersiveAR;
    }
}
