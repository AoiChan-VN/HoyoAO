import { FileManagerController } from './src/file-manager-controller.js';
import fileManagerEn from './localization/file-manager.en.js';
import fileManagerVi from './localization/file-manager.vi.js';

let controller = null;

export function mount(container, services) {
  if (services.localization) {
    services.localization.register('en', fileManagerEn);
    services.localization.register('vi', fileManagerVi);
  }

  controller = new FileManagerController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
}
