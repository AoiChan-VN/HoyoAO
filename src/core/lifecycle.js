export class Lifecycle {

    constructor() {

        this.modules = [];

    }

    register(module) {

        this.modules.push(module);

    }

    async initialize() {

        for (const module of this.modules) {

            if (module.initialize) {

                await module.initialize();

            }

        }

    }

    async destroy() {

        for (const module of this.modules.reverse()) {

            if (module.destroy) {

                await module.destroy();

            }

        }

    }

} 
