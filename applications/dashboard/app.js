/**
 * Dashboard Application — Entry Point (§4, §12)
 *
 * This is a self-contained Application Package.
 * It is NOT part of OS Core.
 *
 * Contract (§5):
 *   mount(container, serviceContext) — called by ApplicationLifecycle
 *   unmount()                        — called by ApplicationLifecycle
 *
 * serviceContext is a frozen object containing only the OS services
 * this application is permitted to use, based on manifest.permissions.
 *
 * Full Dashboard implementation (visualization, cards, panels,
 * data consumption) will be built in the next phase.
 */

/** @type {AbortController|null} */
let abortController = null;

/**
 * Mount the Dashboard application.
 * @param {HTMLElement} container - DOM node provided by OS Shell
 * @param {Readonly<object>} services - Permission-filtered OS services
 */
export function mount(container, services) {
  abortController = new AbortController();
  const { signal } = abortController;

  const root = document.createElement('div');
  root.className = 'dashboard-app';

  /* Header */
  const heading = document.createElement('h1');
  heading.textContent = 'Dashboard';

  const sub = document.createElement('p');
  sub.textContent = 'System monitoring and data visualization';

  /* Status indicator */
  const status = document.createElement('div');
  status.className = 'dashboard-app__status';

  const dot = document.createElement('span');
  dot.className = 'dashboard-app__dot';

  const label = document.createElement('span');
  label.textContent = 'Application Running';

  status.append(dot, label);

  /* Data feed indicator — listens to data:indexed events */
  const feed = document.createElement('div');
  feed.className = 'dashboard-app__feed';
  feed.textContent = 'Waiting for data...';

  // Subscribe to data events if data.read permission is granted
  if (services?.events) {
    const onDataIndexed = (payload) => {
      feed.textContent = `Last indexed: ${payload.id} (${payload.domain})`;
    };

    services.events.on('data:indexed', onDataIndexed);

    // Cleanup on abort (§74)
    signal.addEventListener('abort', () => {
      services.events.off('data:indexed', onDataIndexed);
    });
  }

  root.append(heading, sub, status, feed);
  container.appendChild(root);
}

/**
 * Unmount the Dashboard application.
 * Cleanup all listeners, observers, timers (§74).
 */
export function unmount() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
} 
