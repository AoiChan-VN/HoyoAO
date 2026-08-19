/**
 * Tabs — UI Primitive (§50)
 *
 * Visual/interaction responsibility: a tablist that switches between
 * panels. Implements the ARIA Tabs pattern (§38): role=tablist/tab/tabpanel,
 * aria-selected / aria-controls / aria-labelledby, roving tabindex, and
 * Arrow / Home / End keyboard navigation.
 */

export function createTabs(options = {}) {
  const {
    tabs = [],              // [{ id, label, content }]
    activeTabId = null,
    onChange = null,
  } = options;

  let activeId = activeTabId || (tabs.length > 0 ? tabs[0].id : null);

  const root = document.createElement('div');
  root.className = 'ui-tabs';

  const tablist = document.createElement('div');
  tablist.className = 'ui-tabs__tablist';
  tablist.setAttribute('role', 'tablist');

  const panelContainer = document.createElement('div');
  panelContainer.className = 'ui-tabs__panels';

  root.append(tablist, panelContainer);

  /** @type {Map<string, HTMLButtonElement>} */
  const tabButtons = new Map();
  /** @type {Map<string, HTMLElement>} */
  const panels = new Map();

  function build() {
    tablist.innerHTML = '';
    panelContainer.innerHTML = '';
    tabButtons.clear();
    panels.clear();

    for (const tab of tabs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ui-tabs__tab';
      btn.id = `tab-${tab.id}`;
      btn.textContent = tab.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', `panel-${tab.id}`);
      btn.setAttribute('aria-selected', String(tab.id === activeId));
      btn.tabIndex = tab.id === activeId ? 0 : -1;
      if (tab.id === activeId) btn.classList.add('is-active');

      btn.addEventListener('click', () => setActiveTab(tab.id));
      btn.addEventListener('keydown', (e) => onTabKeydown(e, tab.id));

      tablist.appendChild(btn);
      tabButtons.set(tab.id, btn);

      const panel = document.createElement('div');
      panel.className = 'ui-tabs__panel';
      panel.id = `panel-${tab.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
      panel.hidden = tab.id !== activeId;

      if (tab.content instanceof Node) panel.appendChild(tab.content);
      else if (tab.content != null) panel.textContent = String(tab.content);

      panelContainer.appendChild(panel);
      panels.set(tab.id, panel);
    }
  }

  function onTabKeydown(event, currentId) {
    const ids = tabs.map((t) => t.id);
    const index = ids.indexOf(currentId);
    let next = null;

    if (event.key === 'ArrowRight') next = ids[(index + 1) % ids.length];
    else if (event.key === 'ArrowLeft') next = ids[(index - 1 + ids.length) % ids.length];
    else if (event.key === 'Home') next = ids[0];
    else if (event.key === 'End') next = ids[ids.length - 1];

    if (next !== null) {
      event.preventDefault();
      setActiveTab(next);
      tabButtons.get(next)?.focus();
    }
  }

  function setActiveTab(id) {
    if (!tabButtons.has(id) || id === activeId) return;
    activeId = id;

    for (const [tid, btn] of tabButtons) {
      const isActive = tid === activeId;
      btn.setAttribute('aria-selected', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
      btn.classList.toggle('is-active', isActive);
    }
    for (const [tid, panel] of panels) {
      panel.hidden = tid !== activeId;
    }

    if (onChange) onChange(activeId);
  }

  function destroy() {
    root.innerHTML = '';
    tabButtons.clear();
    panels.clear();
  }

  build();

  return { element: root, setActiveTab, destroy };
} 
