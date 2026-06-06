// ./js/parser/pdf-loader.js

export class PDFLoader {
    constructor() {
        this.buffer = null;

        this.metadata = {
            size: 0,
            pageCount: 0,
            loaded: false
        };

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );
    }

    async load(path) {
        const response =
            await fetch(path);

        if (!response.ok) {
            throw new Error(
                `[PDF_LOADER] Failed to load ${path}`
            );
        }

        const arrayBuffer =
            await response.arrayBuffer();

        this.buffer =
            arrayBuffer;

        this.metadata.size =
            arrayBuffer.byteLength;

        this.metadata.loaded =
            true;

        this.metadata.pageCount =
            this.estimatePageCount(
                arrayBuffer
            );

        return {
            buffer:
                this.buffer,
            metadata:
                this.getMetadata()
        };
    }

    estimatePageCount(
        arrayBuffer
    ) {
        const bytes =
            new Uint8Array(
                arrayBuffer
            );

        let count = 0;

        const pattern = [
            0x2f,
            0x50,
            0x61,
            0x67,
            0x65
        ];

        for (
            let i = 0;
            i <
            bytes.length -
                pattern.length;
            i += 1
        ) {
            let matched =
                true;

            for (
                let j = 0;
                j <
                pattern.length;
                j += 1
            ) {
                if (
                    bytes[
                        i + j
                    ] !==
                    pattern[j]
                ) {
                    matched =
                        false;

                    break;
                }
            }

            if (
                matched
            ) {
                count += 1;
            }
        }

        return Math.max(
            count,
            1
        );
    }

    createPreview(
        width = 1024,
        height = 1448
    ) {
        if (
            !this.metadata.loaded
        ) {
            throw new Error(
                '[PDF_LOADER] No PDF loaded.'
            );
        }

        this.canvas.width =
            width;

        this.canvas.height =
            height;

        this.context.clearRect(
            0,
            0,
            width,
            height
        );

        this.context.fillStyle =
            '#111111';

        this.context.fillRect(
            0,
            0,
            width,
            height
        );

        this.context.fillStyle =
            '#00e5ff';

        this.context.font =
            'bold 48px sans-serif';

        this.context.fillText(
            'PDF DOCUMENT',
            48,
            100
        );

        this.context.font =
            '28px sans-serif';

        this.context.fillText(
            `Size: ${this.metadata.size} bytes`,
            48,
            180
        );

        this.context.fillText(
            `Pages: ${this.metadata.pageCount}`,
            48,
            240
        );

        return this.canvas;
    }

    getCanvas() {
        return this.canvas;
    }

    getBuffer() {
        return this.buffer;
    }

    getMetadata() {
        return {
            size:
                this.metadata.size,
            pageCount:
                this.metadata.pageCount,
            loaded:
                this.metadata.loaded
        };
    }

    clear() {
        this.buffer = null;

        this.metadata.size = 0;
        this.metadata.pageCount = 0;
        this.metadata.loaded = false;

        this.canvas.width = 1;
        this.canvas.height = 1;
    }
} 
