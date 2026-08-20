import { WebController } from './src/web-controller.js';
import webEn from './localization/web.en.js';
import webVi from './localization/web.vi.js';

let controller = null;

export function mount(container, services) {
  if (services.localization) {
    services.localization.register('en', webEn);
    services.localization.register('vi', webVi);
  }

  controller = new WebController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
} 
