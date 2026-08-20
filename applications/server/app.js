import { ServerController } from './src/server-controller.js';
import serverEn from './localization/server.en.js';
import serverVi from './localization/server.vi.js';

let controller = null;

export function mount(container, services) {
  if (services.localization) {
    services.localization.register('en', serverEn);
    services.localization.register('vi', serverVi);
  }

  controller = new ServerController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
}
