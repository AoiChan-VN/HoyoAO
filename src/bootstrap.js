import { Engine }
from "./core/engine.js";

import { EventBus }
from "./core/event-bus.js";

import { Lifecycle }
from "./core/lifecycle.js";

import { ModuleRegistry }
from "./core/module-registry.js";

const registry =
    new ModuleRegistry();

const lifecycle =
    new Lifecycle();

const events =
    new EventBus();

const engine =
    new Engine({

        registry,
        lifecycle,
        events

    });

await engine.start(); 
