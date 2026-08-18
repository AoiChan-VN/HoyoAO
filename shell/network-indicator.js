/**
 * NetworkIndicator — OS Shell system status (§87)
 *
 * Persistent connectivity indicator shown in the Shell header.
 * Accessible: role="status" + aria-live so screen readers announce changes (§38).
 */
export function createNetworkIndicator({ network, localization }) {
  const el = document.createElement('div');
  el.className = 'network-indicator';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  const dot = document.createElement('span');
  dot.className = 'network-indicator__dot';
  dot.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'network-indicator__label';

  el.append(dot, label);

  function render() {
    const online = network.isOnline();

    el.classList.toggle('network-indicator--online', online);
    el.classList.toggle('network-indicator--offline', !online);

    const text = online
      ? localization.t('network.online')
      : localization.t('network.offline');

    label.textContent = text;
    el.setAttribute('aria-label', text);
    el.title = text;
  }

  const unsubscribe = network.subscribe(render);
  render();

  function destroy() {
    unsubscribe();
  }

  return { element: el, destroy };
} 
