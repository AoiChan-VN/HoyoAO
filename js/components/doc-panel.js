// ./js/components/doc-panel.js

import { BaseMesh } from './base-mesh.js';

export class DocPanel extends BaseMesh {
    constructor() {
        super();

        this.title =
            'Document';

        this.content = [];

        this.scrollOffset = 0;

        this.maxVisibleLines = 20;

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );

        this.canvas.width = 1024;
        this.canvas.height = 768;

        this.redraw();
    }

    setTitle(
        title
    ) {
        this.title = title;

        this.redraw();

        return this;
    }

    setContent(
        content
    ) {
        if (
            Array.isArray(
                content
            )
        ) {
            this.content =
                [...content];
        } else {
            this.content =
                String(content)
                    .split('\n');
        }

        this.scrollOffset = 0;

        this.redraw();

        return this;
    }

    scroll(
        delta
    ) {
        const maxScroll =
            Math.max(
                0,
                this.content.length -
                    this.maxVisibleLines
            );

        this.scrollOffset =
            Math.max(
                0,
                Math.min(
                    maxScroll,
                    this.scrollOffset +
                        delta
                )
            );

        this.redraw();
    }

    scrollUp() {
        this.scroll(-1);
    }

    scrollDown() {
        this.scroll(1);
    }

    redraw() {
        const context =
            this.context;

        context.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.fillStyle =
            'rgba(0, 8, 16, 0.92)';

        context.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.strokeStyle =
            '#00e5ff';

        context.lineWidth = 3;

        context.strokeRect(
            2,
            2,
            this.canvas.width - 4,
            this.canvas.height - 4
        );

        context.fillStyle =
            '#00e5ff';

        context.font =
            'bold 34px sans-serif';

        context.fillText(
            this.title,
            32,
            56
        );

        context.strokeStyle =
            'rgba(0,229,255,0.4)';

        context.beginPath();

        context.moveTo(
            24,
            84
        );

        context.lineTo(
            this.canvas.width - 24,
            84
        );

        context.stroke();

        context.fillStyle =
            '#ffffff';

        context.font =
            '22px monospace';

        const visibleLines =
            this.content.slice(
                this.scrollOffset,
                this.scrollOffset +
                    this.maxVisibleLines
            );

        let y = 130;

        for (
            let i = 0;
            i < visibleLines.length;
            i += 1
        ) {
            const line =
                visibleLines[i];

            context.fillText(
                String(line).slice(
                    0,
                    78
                ),
                32,
                y
            );

            y += 30;
        }

        this.drawScrollbar();
    }

    drawScrollbar() {
        const context =
            this.context;

        const trackX =
            this.canvas.width -
            20;

        const trackY = 100;

        const trackHeight =
            this.canvas.height -
            130;

        context.fillStyle =
            'rgba(255,255,255,0.1)';

        context.fillRect(
            trackX,
            trackY,
            8,
            trackHeight
        );

        const ratio =
            this.content.length <=
            this.maxVisibleLines
                ? 1
                : this.maxVisibleLines /
                  this.content.length;

        const thumbHeight =
            Math.max(
                40,
                trackHeight *
                    ratio
            );

        const maxScroll =
            Math.max(
                1,
                this.content.length -
                    this.maxVisibleLines
            );

        const thumbOffset =
            (this.scrollOffset /
                maxScroll) *
            (trackHeight -
                thumbHeight);

        context.fillStyle =
            '#00e5ff';

        context.fillRect(
            trackX,
            trackY +
                thumbOffset,
            8,
            thumbHeight
        );
    }

    getCanvas() {
        return this.canvas;
    }

    getContent() {
        return [
            ...this.content
        ];
    }

    getScrollOffset() {
        return this.scrollOffset;
    }

    render() {
    }
} 
