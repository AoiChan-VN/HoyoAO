export class Engine {

    constructor({
        registry,
        lifecycle,
        events
    }) {

        this.registry = registry;
        this.lifecycle = lifecycle;
        this.events = events;

    }

    async start() {

        await this.lifecycle.initialize();

        this.events.emit(
            "engine:started"
        );

    }

} 
