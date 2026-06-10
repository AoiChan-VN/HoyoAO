/* ==========================================================================
   js/renderers/pdf-renderer.js
   Native Browser Experience Engine
   ========================================================================== */

export class PDFRenderer {

    constructor() {

        this.container = null;
        this.iframe = null;

    }

    async render(
        pdfData,
        mountPoint
    ) {

        this.container =
            document.createElement(
                'div'
            );

        this.container.id =
            'pdf-viewer';

        this.iframe =
            document.createElement(
                'iframe'
            );

        this.iframe.id =
            'pdf-frame';

        this.iframe.loading =
            'lazy';

        this.iframe.referrerPolicy =
            'no-referrer';

        this.iframe.allow =
            'fullscreen';

        this.iframe.src =
            pdfData.url;

        this.iframe.title =
            pdfData.path
                .split('/')
                .pop() ||
            'PDF Document';

        this.container.appendChild(
            this.iframe
        );

        mountPoint.appendChild(
            this.container
        );

        await this.waitForLoad();

    }

    waitForLoad() {

        if (!this.iframe) {
            return Promise.resolve();
        }

        return new Promise(
            (
                resolve
            ) => {

                const cleanup =
                    () => {

                        this.iframe?.removeEventListener(
                            'load',
                            onLoad
                        );

                        this.iframe?.removeEventListener(
                            'error',
                            onError
                        );

                    };

                const onLoad =
                    () => {

                        cleanup();

                        resolve();

                    };

                const onError =
                    () => {

                        cleanup();

                        this.showError(
                            'Unable to open PDF document.'
                        );

                        resolve();

                    };

                this.iframe.addEventListener(
                    'load',
                    onLoad,
                    {
                        once: true
                    }
                );

                this.iframe.addEventListener(
                    'error',
                    onError,
                    {
                        once: true
                    }
                );

            }
        );

    }

    showError(
        message
    ) {

        if (
            !this.container
        ) {
            return;
        }

        this.container.innerHTML =
            `
            <div class="empty-viewer-content">
                <h2>PDF Viewer Error</h2>
                <p>${message}</p>
            </div>
            `;

    }

    resize() {

        if (
            !this.iframe
        ) {
            return;
        }

        this.iframe.style.height =
            `${window.innerHeight * 0.8}px`;

    }

    destroy() {

        if (
            this.iframe
        ) {

            this.iframe.src =
                'about:blank';

        }

        this.iframe = null;

        if (
            this.container
        ) {

            this.container.remove();

        }

        this.container = null;

    }

} 
