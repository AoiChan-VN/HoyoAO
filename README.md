```txt
4d-cinematic-engine/
│
├── public/
│   ├── index.html              # canvas + UI shell only
│
├── core/
│   ├── engine/
│   │   ├── bootstrap.js        # app init
│   │   ├── lifecycle.js        # start/stop system
│   │
│   ├── camera/
│   │   ├── camera.js           # 3D camera matrix
│   │   ├── motion.js           # smoothing / damping
│   │
│   ├── input/
│   │   ├── mouse.js
│   │   ├── touch.js
│   │   ├── gyro.js             # permission + sensor
│   │
│   ├── state/
│   │   ├── app.state.js        # global UI + engine state
│
├── webgl/
│   ├── gl.context.js
│   ├── renderer.js
│   ├── texture.manager.js
│   ├── mesh.plane.js
│
├── shaders/
│   ├── vertex.glsl
│   ├── fragment.glsl           # cinematic kaleidoscope core
│
├── scenes/
│   ├── cinematic.json
│   ├── kaleidoscope.json
│   ├── universe.json
│
├── ui/
│   ├── overlay/
│   │   ├── hud.js              # control panel
│   │   ├── buttons.js
│   │
│   ├── blog/
│   │   ├── markdown.renderer.js
│   │   ├── blog.panel.js
│   │
│   ├── menu/
│   │   ├── main.menu.js
│
├── services/
│   ├── scene.loader.js
│   ├── markdown.loader.js
│   ├── asset.loader.js
│
├── styles/
│   ├── base.css
│   ├── ui.css
│   ├── overlay.css
│
├── content/
│   ├── posts/
│   │   ├── welcome.md
│   │   ├── dreamscape.md
│
└── app.js 
```
