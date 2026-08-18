/**
 * Dashboard Application — Entry Point (§4, §12)
 *
 * Self-contained Application Package. NOT part of OS Core.
 * Contract (§5): mount(container, serviceContext), unmount().
 *
 * The Dashboard CONSUMES OS APIs and indexed data (§12).
 * It does NOT generate or fabricate data (§45).
 */

import { DashboardController } from './src/dashboard-controller.js';

let controller = null;

/**
 * @param {HTMLElement} container - mount point provided by OS Shell
 * @param {Readonly<object>} services - permission-filtered OS services
 */
export function mount(container, services) {
  controller = new DashboardController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
} 
