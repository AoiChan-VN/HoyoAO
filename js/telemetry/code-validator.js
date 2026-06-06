// ./js/telemetry/code-validator.js

export class CodeValidator {
    constructor() {
        this.errors = [];

        this.maxErrors = 100;

        this.listeners =
            new Set();

        this.boundHandler =
            this.handleRuntimeError.bind(
                this
            );

        this.boundRejectionHandler =
            this.handleUnhandledRejection.bind(
                this
            );
    }

    initialize() {
        window.addEventListener(
            'error',
            this.boundHandler
        );

        window.addEventListener(
            'unhandledrejection',
            this.boundRejectionHandler
        );
    }

    destroy() {
        window.removeEventListener(
            'error',
            this.boundHandler
        );

        window.removeEventListener(
            'unhandledrejection',
            this.boundRejectionHandler
        );
    }

    handleRuntimeError(event) {
        this.pushError({
            type: 'runtime',
            message:
                event.message ||
                'Unknown runtime error',
            source:
                event.filename ||
                'unknown',
            line:
                event.lineno || 0,
            column:
                event.colno || 0,
            timestamp:
                Date.now()
        });
    }

    handleUnhandledRejection(
        event
    ) {
        let message =
            'Unhandled Promise Rejection';

        if (
            event.reason &&
            event.reason.message
        ) {
            message =
                event.reason.message;
        }

        this.pushError({
            type: 'promise',
            message,
            source: 'promise',
            line: 0,
            column: 0,
            timestamp:
                Date.now()
        });
    }

    pushError(error) {
        this.errors.unshift(
            error
        );

        if (
            this.errors.length >
            this.maxErrors
        ) {
            this.errors.length =
                this.maxErrors;
        }

        this.notify();
    }

    clear() {
        this.errors.length = 0;

        this.notify();
    }

    getErrors() {
        return [
            ...this.errors
        ];
    }

    getLatestError() {
        return (
            this.errors[0] ||
            null
        );
    }

    hasErrors() {
        return (
            this.errors.length > 0
        );
    }

    subscribe(listener) {
        if (
            typeof listener !==
            'function'
        ) {
            throw new Error(
                '[CODE_VALIDATOR] Listener must be a function.'
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
        const errors =
            this.getErrors();

        for (const listener of this.listeners) {
            listener(errors);
        }
    }
}

export const codeValidator =
    new CodeValidator(); 
