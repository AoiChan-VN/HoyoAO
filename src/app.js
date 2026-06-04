import globalStore from './core/store.js';
import globalRouter from './core/router.js';
import globalEventBus from './core/event-bus.js';
import { WebGL2Renderer } from './vr/webgl-renderer.js';
import { MenuPanel } from './components/menu-panel.js';
import { SettingsPanel } from './components/settings-panel.js';
import { ContentModal } from './components/content-modal.js';

class App {
  constructor() {
    this.renderer = null;
    this.animationFrameId = null;
    this.components = [];
    this.loop = this.loop.bind(this);
  }

  async bootstrap() {
    try {
      await globalStore.init();

      const canvas = document.getElementById('vr-canvas');
      if (canvas) {
        this.renderer = new WebGL2Renderer(canvas);
        this.renderer.initShaders();
        this.renderer.initCube();

        const state = globalStore.getState();
        const defaultScene = state.portfolio?.scenes[0];
        if (defaultScene && defaultScene.assets) {
          await this.renderer.loadSkybox(defaultScene.assets);
        }

        globalEventBus.on('vr:gyro:toggle', (enabled) => {
          if (this.renderer && this.renderer.mouseState) {
            this.renderer.mouseState.useGyro = enabled;
          }
        });

        this.startLoop();
      }

      this.initComponents();
      globalRouter.init();
      this.initServiceWorker();
    } catch (error) {
      console.error(error);
    }
  }

  initComponents() {
    const menu = new MenuPanel('ui-menu-panel');
    menu.init();
    this.components.push(menu);

    const settings = new SettingsPanel('ui-settings-panel');
    settings.init();
    this.components.push(settings);

    const modal = new ContentModal('ui-content-modal');
    modal.init();
    this.components.push(modal);

    const state = globalStore.getState();
    if (state && state.uiState) {
      globalEventBus.emit('state:ui', state.uiState);
    }
  }

  startLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  loop() {
    if (this.renderer) {
      this.renderer.render();
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.error(err);
        });
      });
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.destroy();
    }
    const len = this.components.length;
    for (let i = 0; i < len; i++) {
      this.components[i].destroy();
    }
    this.components = [];
    globalRouter.destroy();
    globalEventBus.clear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.bootstrap();
}); 
