/**
 * Content Application — Entry Point (§4, §17)
 *
 * Self-contained Application Package. NOT part of OS Core.
 * Uses the standard Application Runtime contract — no special privileges (§89, §90).
 * Contract (§5): mount(container, serviceContext), unmount().
 */

import { ContentController } from './src/content-controller.js';

let controller = null;

/**
 * @param {HTMLElement} container - mount point provided by OS Shell
 * @param {Readonly<object>} services - permission-filtered OS services
 */
export function mount(container, services) {
  controller = new ContentController(container, services);
  controller.start();
}

export function unmount() {
  if (controller) {
    controller.destroy();
    controller = null;
  }
} 
