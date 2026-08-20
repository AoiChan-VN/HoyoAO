import { DiagnosticsController } from './src/diagnostics-controller.js';
import diagnosticsEn from './localization/diagnostics.en.js';
import diagnosticsVi from './localization/diagnostics.vi.js';

let controller = null;

export function mount(container, services) {
  if (services.localization) {
    services.localization.register('en', diagnosticsEn);
    services.localization.register('vi', diagnosticsVi);
  }

  controller = new DiagnosticsController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
}
