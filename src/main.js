import SpatialRegistry from "./core/SpatialRegistry.js";
import Camera from "./core/Camera.js";
import MatrixRenderer from "./core/MatrixRenderer.js";
import PhysicsEngine from "./core/PhysicsEngine.js";
import Engine from "./core/Engine.js";
import InputSystem from "./systems/InputSystem.js";
import TouchSystem from "./systems/TouchSystem.js";
import DragSystem from "./systems/DragSystem.js";
import SpatialPhysicsSystem from "./systems/SpatialPhysicsSystem.js";

import "./components/spatial-menu/SpatialMenu.js";
import "./components/profile-panel/ProfilePanel.js";
import "./components/document-viewer/DocumentViewer.js";

const world =
document.querySelector("#world");

const registry =
new SpatialRegistry();

const camera =
new Camera();

const renderer =
new MatrixRenderer(
world,
camera
);

const physics =
new PhysicsEngine();

const engine =
new Engine({
registry,
renderer,
camera,
physics
});

new InputSystem(camera);

new TouchSystem(camera);

new DragSystem(registry);

engine.addSystem(
new SpatialPhysicsSystem(
registry
)
);

function createEntity(
id,
element,
x,
y,
z
){

element.dataset.spatialId=id;

element.style.position=
"absolute";

world.appendChild(
element
);

registry.register({

id,
element,

x,
y,
z,

vx:0,
vy:0,
vz:0,

rx:0,
ry:0,
rz:0
});
}

createEntity(
"menu",
document.createElement(
"spatial-menu"
),
-500,
0,
0
);

createEntity(
"profile",
document.createElement(
"profile-panel"
),
0,
0,
200
);

createEntity(
"docs",
document.createElement(
"document-viewer"
),
500,
0,
0
);

engine.start(); 
