export default class SpatialRegistry {

    constructor() {
        this.entities = new Map();
    }

    register(entity) {
        this.entities.set(entity.id, entity);
    }

    unregister(id) {
        this.entities.delete(id);
    }

    get(id) {
        return this.entities.get(id);
    }

    getAll() {
        return [...this.entities.values()];
    }

    update(id,data){

        const entity=this.entities.get(id);

        if(!entity) return;

        Object.assign(entity,data);
    }
} 
