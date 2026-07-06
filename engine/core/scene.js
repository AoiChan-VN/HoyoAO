import { eventBus } from '../events/event-bus.js';

class Scene {
    #layers       = new Map();
    #sortedLayers = [];
    #dirty        = false;

    add(layer) {
        if (!layer || typeof layer.id !== 'string') {
            console.error('[Scene] Layer must have a string id');
            return false;
        }

        if (this.#layers.has(layer.id)) {
            console.error(`[Scene] Layer already registered: "${layer.id}"`);
            return false;
        }

        this.#layers.set(layer.id, layer);
        this.#dirty = true;

        eventBus.emit('scene:layerAdded', { id: layer.id });

        return true;
    }

    remove(id) {
        if (!this.#layers.has(id)) return false;
        this.#layers.delete(id);
        this.#dirty = true;
        eventBus.emit('scene:layerRemoved', { id });
        return true;
    }

    has(id) {
        return this.#layers.has(id);
    }

    get(id) {
        return this.#layers.get(id) ?? null;
    }

    clear() {
        const ids = [...this.#layers.keys()];
        this.#layers.clear();
        this.#sortedLayers = [];
        this.#dirty = false;
        eventBus.emit('scene:cleared', { ids });
    }

    #sort() {
        this.#sortedLayers = [...this.#layers.values()].sort(
            (a, b) => (b.depth ?? 0) - (a.depth ?? 0)
        );
        this.#dirty = false;
    }

    update(dt) {
        if (this.#dirty) this.#sort();

        for (const layer of this.#sortedLayers) {
            if (layer.enabled === false) continue;
            if (typeof layer.update === 'function') {
                try {
                    layer.update(dt);
                } catch (err) {
                    console.error(`[Scene] update error in layer "${layer.id}":`, err);
                }
            }
        }
    }

    getLayers() {
        if (this.#dirty) this.#sort();
        return this.#sortedLayers;
    }

    getVisibleLayers() {
        if (this.#dirty) this.#sort();
        return this.#sortedLayers.filter(l => l.enabled !== false);
    }

    get layerCount() {
        return this.#layers.size;
    }

    get visibleCount() {
        let count = 0;
        for (const layer of this.#layers.values()) {
            if (layer.enabled !== false) count++;
        }
        return count;
    }
}

export const scene = new Scene(); 
