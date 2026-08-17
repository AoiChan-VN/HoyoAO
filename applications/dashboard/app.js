/**
 * Dashboard Application — Entry Point (§4, §12)
 *
 * This is a self-contained Application Package.
 * It is NOT part of OS Core.
 * It exports mount() / unmount() per the Application contract (§5).
 *
 * Full Dashboard implementation (visualization, cards, panels)
 * will be built in the next phase.
 */

export function mount(container) {
  const root = document.createElement('div');
  root.className = 'dashboard-app';

  const heading = document.createElement('h1');
  heading.textContent = 'Dashboard';

  const sub = document.createElement('p');
  sub.textContent = 'System monitoring and data visualization';

  const status = document.createElement('div');
  status.className = 'dashboard-app__status';

  const dot = document.createElement('span');
  dot.className = 'dashboard-app__dot';

  const label = document.createElement('span');
  label.textContent = 'Application Running';

  status.append(dot, label);
  root.append(heading, sub, status);
  container.appendChild(root);
}

export function unmount() {
  // Cleanup (§74): remove listeners, observers, timers here
  // when the full Dashboard is implemented.
} 
