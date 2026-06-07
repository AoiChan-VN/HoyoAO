// ./js/components/spatial-menu.js

import { BaseMesh } from './base-mesh.js';

export class SpatialMenu extends BaseMesh {
    constructor() {
        super();

        this.visible = false;

        this.title = '≡';

        this.items = [];

        this.selectedIndex = -1;

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );

        this.canvas.width = 512;
        this.canvas.height = 640;

        this.redraw();
    }

    addItem(
        id,
        label,
        callback = null
    ) {
        this.items.push({
            id,
            label,
            callback
        });

        this.redraw();

        return this;
    }

    removeItem(
        id
    ) {
        this.items =
            this.items.filter(
                (item) =>
                    item.id !== id
            );

        this.redraw();

        return this;
    }

    clearItems() {
        this.items.length = 0;

        this.selectedIndex = -1;

        this.redraw();
    }

    setVisible(
        visible
    ) {
        this.visible =
            Boolean(
                visible
            );

        this.redraw();

        return this;
    }

    toggle() {
        this.visible =
            !this.visible;

        this.redraw();

        return this.visible;
    }

    select(
        index
    ) {
        if (
            index < 0 ||
            index >= this.items.length
        ) {
            return;
        }

        this.selectedIndex =
            index;

        this.redraw();
    }

    activate(
        index
    ) {
        const item =
            this.items[index];

        if (!item) {
            return;
        }

        if (
            typeof item.callback ===
            'function'
        ) {
            item.callback(
                item
            );
        }
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

        if (
            !this.visible
        ) {
            context.fillStyle =
                'rgba(0, 229, 255, 0.85)';

            context.fillRect(
                0,
                0,
                96,
                96
            );

            context.fillStyle =
                '#ffffff';

            context.font =
                'bold 56px sans-serif';

            context.textAlign =
                'center';

            context.textBaseline =
                'middle';

            context.fillText(
                this.title,
                48,
                48
            );

            return;
        }

        context.fillStyle =
            'rgba(0, 10, 18, 0.94)';

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
            'bold 32px sans-serif';

        context.textAlign =
            'left';

        context.fillText(
            'SYSTEM MENU',
            24,
            48
        );

        let y = 110;

        for (
            let i = 0;
            i < this.items.length;
            i += 1
        ) {
            const item =
                this.items[i];

            const selected =
                i ===
                this.selectedIndex;

            context.fillStyle =
                selected
                    ? '#00e5ff'
                    : '#ffffff';

            if (
                selected
            ) {
                context.fillRect(
                    20,
                    y - 28,
                    this.canvas.width -
                        40,
                    42
                );

                context.fillStyle =
                    '#001018';
            }

            context.font =
                '24px sans-serif';

            context.fillText(
                item.label,
                36,
                y
            );

            y += 56;
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getItems() {
        return [
            ...this.items
        ];
    }

    isVisible() {
        return this.visible;
    }

    render() {
    }
} 
