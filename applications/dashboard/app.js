import { DashboardController } from './src/dashboard-controller.js';
import dashboardEn from './localization/dashboard.en.js';
import dashboardVi from './localization/dashboard.vi.js';

let controller = null;

export function mount(container, services) {
  // Register both locales (§37)
  if (services.localization) {
    services.localization.register('en', dashboardEn);
    services.localization.register('vi', dashboardVi);
  }

  controller = new DashboardController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
}
