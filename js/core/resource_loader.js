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
        if (id.includes("bullet")) {
            return {
                vertices: [-0.5,-0.5,-2, 0.5,-0.5,-2, 0.5,0.5,-2, -0.5,0.5,-2, -0.5,-0.5,2, 0.5,-0.5,2, 0.5,0.5,2, -0.5,0.5,2],
                indices: [0,1,2, 0,2,3, 4,5,6, 4,6,7, 0,4,5, 0,5,1, 1,5,6, 1,6,2, 2,6,7, 2,7,3, 3,7,4, 3,4,0]
            };
        }
        return {
            vertices: [0,15,0, -20,-5,-15, 20,-5,-15, 0,-5,25],
            indices: [0,1,2, 0,2,3, 0,3,1, 1,3,2]
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
 
