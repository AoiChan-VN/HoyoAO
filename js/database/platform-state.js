// ./js/database/platform-state.js

const DEFAULT_STATE = {
    dashboardVisible: true,

    telemetryVisible: false,

    validatorVisible: false,

    menuVisible: false,

    activeDocument: 'system-guide.md',

    hudPosition: {
        x: 0,
        y: 1.5,
        z: -2.5
    },

    hudRotation: {
        x: 0,
        y: 0,
        z: 0,
        w: 1
    },

    xrMode: 'desktop',

    fps: 0,

    drawCalls: 0,

    heapMemory: 0,

    lastError: null
};

export class PlatformState {
    constructor() {
        this.state =
            structuredClone(
                DEFAULT_STATE
            );

        this.listeners =
            new Set();
    }

    getState() {
        return structuredClone(
            this.state
        );
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;

        this.notify();
    }

    update(partialState) {
        this.state = {
            ...this.state,
            ...partialState
        };

        this.notify();
    }

    subscribe(listener) {
        if (
            typeof listener !==
            'function'
        ) {
            throw new Error(
                '[PLATFORM_STATE] Listener must be a function.'
            );
        }

        this.listeners.add(
            listener
        );

        return () => {
            this.listeners.delete(
                listener
            );
        };
    }

    notify() {
        const snapshot =
            this.getState();

        for (const listener of this.listeners) {
            listener(
                snapshot
            );
        }
    }

    reset() {
        this.state =
            structuredClone(
                DEFAULT_STATE
            );

        this.notify();
    }
}

export const platformState =
    new PlatformState(); 
