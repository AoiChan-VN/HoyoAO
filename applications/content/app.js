import { ContentController } from './src/content-controller.js';
import contentEn from './localization/content.en.js';
import contentVi from './localization/content.vi.js';

let controller = null;

export function mount(container, services) {
  if (services.localization) {
    services.localization.register('en', contentEn);
    services.localization.register('vi', contentVi);
  }

  controller = new ContentController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
}
