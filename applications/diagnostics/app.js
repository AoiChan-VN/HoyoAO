/**
 * Diagnostics Application — Entry Point (§4, §48)
 *
 * Self-contained Application Package. NOT part of OS Core.
 * Consumes the OS DiagnosticsService through the ServiceContext.
 * Contract (§5): mount(container, serviceContext), unmount().
 */

import { DiagnosticsController } from './src/diagnostics-controller.js';

let controller = null;

/**
 * @param {HTMLElement} container - mount point provided by OS Shell
 * @param {Readonly<object>} services - permission-filtered OS services
 */
export function mount(container, services) {
  controller = new DiagnosticsController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
} 
