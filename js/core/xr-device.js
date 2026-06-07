// ./js/core/xr-device.js

export class XRDevice {
    constructor() {
        this.supported = false;

        this.session = null;

        this.referenceSpace = null;

        this.mode =
            'immersive-vr';

        this.onSessionStart =
            null;

        this.onSessionEnd =
            null;
    }

    async initialize() {
        if (
            !('xr' in navigator)
        ) {
            return false;
        }

        try {
            this.supported =
                await navigator.xr.isSessionSupported(
                    this.mode
                );

            return this.supported;
        } catch (
            error
        ) {
            console.error(
                '[XR_DEVICE]',
                error
            );

            return false;
        }
    }

    async startSession() {
        if (
            !this.supported
        ) {
            throw new Error(
                '[XR_DEVICE] XR session not supported.'
            );
        }

        if (
            this.session
        ) {
            return this.session;
        }

        this.session =
            await navigator.xr.requestSession(
                this.mode,
                {
                    requiredFeatures: [
                        'local-floor'
                    ],
                    optionalFeatures: [
                        'hand-tracking',
                        'layers',
                        'bounded-floor'
                    ]
                }
            );

        this.referenceSpace =
            await this.session.requestReferenceSpace(
                'local-floor'
            );

        this.session.addEventListener(
            'end',
            () =>
                this.handleSessionEnd()
        );

        if (
            typeof this.onSessionStart ===
            'function'
        ) {
            this.onSessionStart(
                this.session,
                this.referenceSpace
            );
        }

        return this.session;
    }

    async endSession() {
        if (
            !this.session
        ) {
            return;
        }

        await this.session.end();
    }

    handleSessionEnd() {
        const previousSession =
            this.session;

        this.session = null;

        this.referenceSpace =
            null;

        if (
            typeof this.onSessionEnd ===
            'function'
        ) {
            this.onSessionEnd(
                previousSession
            );
        }
    }

    setSessionStartCallback(
        callback
    ) {
        this.onSessionStart =
            callback;

        return this;
    }

    setSessionEndCallback(
        callback
    ) {
        this.onSessionEnd =
            callback;

        return this;
    }

    getViewerPose(
        frame
    ) {
        if (
            !frame ||
            !this.referenceSpace
        ) {
            return null;
        }

        return frame.getViewerPose(
            this.referenceSpace
        );
    }

    getInputSources() {
        if (
            !this.session
        ) {
            return [];
        }

        return [
            ...this.session
                .inputSources
        ];
    }

    getSession() {
        return this.session;
    }

    getReferenceSpace() {
        return this.referenceSpace;
    }

    isSupported() {
        return this.supported;
    }

    isRunning() {
        return (
            this.session !== null
        );
    }
} 
