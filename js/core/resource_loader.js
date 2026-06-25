export const resourceLoader = {
    resources: {
        models: {},
        audio: {},
        textures: {}
    },
    totalItems: 0,
    loadedItems: 0,

    load(manifest, onProgress, onComplete) {
        this.totalItems = (manifest.models?.length || 0) + (manifest.audio?.length || 0) + (manifest.textures?.length || 0);
        this.loadedItems = 0;

        if (this.totalItems === 0) {
            onComplete(this.resources);
            return;
        }

        const checkProgress = () => {
            this.loadedItems++;
            const progress = Math.floor((this.loadedItems / this.totalItems) * 100);
            onProgress(progress);
            if (this.loadedItems === this.totalItems) {
                onComplete(this.resources);
            }
        };

        manifest.models?.forEach(item => {
            fetch(item.url)
                .then(response => {
                    if (!response.ok) throw new Error();
                    return response.json();
                })
                .then(data => {
                    this.resources.models[item.id] = data;
                    checkProgress();
                })
                .catch(() => {
                    this.resources.models[item.id] = this.createFallbackModel(item.id);
                    checkProgress();
                });
        });

        manifest.audio?.forEach(item => {
            fetch(item.url)
                .then(response => {
                    if (!response.ok) throw new Error();
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    this.resources.audio[item.id] = { buffer, type: item.type };
                    checkProgress();
                })
                .catch(() => {
                    this.resources.audio[item.id] = { buffer: null, type: item.type };
                    checkProgress();
                });
        });

        manifest.textures?.forEach(item => {
            const img = new Image();
            img.src = item.url;
            img.onload = () => {
                this.resources.textures[item.id] = img;
                checkProgress();
            };
            img.onerror = () => {
                this.resources.textures[item.id] = this.createFallbackTexture();
                checkProgress();
            };
        });
    },

    createFallbackModel(id) {
        if (id === "bullet" || id.includes("bullet")) {
            return {
                vertices: [
                    -1.0, -1.0, -4.0,
                     1.0, -1.0, -4.0,
                     1.0,  1.0, -4.0,
                    -1.0,  1.0, -4.0,
                    -1.0, -1.0,  4.0,
                     1.0, -1.0,  4.0,
                     1.0,  1.0,  4.0,
                    -1.0,  1.0,  4.0
                ],
                indices: [
                    0, 1, 2,  0, 2, 3,
                    4, 5, 6,  4, 6, 7,
                    0, 1, 5,  0, 5, 4,
                    2, 3, 7,  2, 7, 6,
                    0, 3, 7,  0, 7, 4,
                    1, 2, 6,  1, 6, 5
                ]
            };
        }
        if (id.includes("boss")) {
            return {
                vertices: [
                    0.0, 0.0, -60.0,
                    -40.0, 10.0, 20.0,
                    40.0, 10.0, 20.0,
                    0.0, -15.0, 30.0,
                    0.0, 20.0, -10.0
                ],
                indices: [
                    0, 1, 4,  0, 4, 2,
                    0, 2, 3,  0, 3, 1,
                    3, 2, 4,  3, 4, 1
                ]
            };
        }
        return {
            vertices: [
                0.0, 0.0, 25.0,
                -15.0, -5.0, -15.0,
                15.0, -5.0, -15.0,
                0.0, 8.0, -10.0
            ],
            indices: [
                0, 1, 3,
                0, 3, 2,
                0, 2, 1,
                1, 2, 3
            ]
        };
    },

    createFallbackTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 2;
        canvas.height = 2;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(0, 0, 2, 2);
        return canvas;
    }
};
