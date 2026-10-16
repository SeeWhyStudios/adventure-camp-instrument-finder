// Copy to Wix Public Code as custom-header-navigation.js.
// Uses only the documented CustomElement on()/setAttribute() bridge.
const instances = new WeakMap();

export async function setupCustomHeaderNavigation($w, options) {
  const nav = $w(options.headerTabsId || '#headerTabs');
  if (!nav || typeof nav.on !== 'function' || typeof nav.setAttribute !== 'function') {
    throw new Error('Replace the old HTML iframe with the navigation Custom Element and reuse its headerTabs ID.');
  }
  if (instances.has(nav)) {
    const existing = instances.get(nav);
    existing.configure(options);
    return existing;
  }
  let settings = options;
  let selected = options.defaultStateId || 'instruments';
  let revision = 0;
  function tabs() {
    return Object.entries(settings.tabMenu).map(([id, label]) => ({ id, label }));
  }
  function isTab(id) { return tabs().some(tab => tab.id === id); }
  function current() {
    const actual = settings.getCurrentStateId?.();
    return isTab(actual) ? actual : selected;
  }
  function sync(id = current()) {
    if (!isTab(id)) return;
    selected = id;
    nav.setAttribute('selected-state', id);
  }
  function configure(next = settings) {
    settings = next;
    if (!settings.tabMenu || !Object.keys(settings.tabMenu).length || typeof settings.onChange !== 'function') {
      throw new Error('Navigation requires tabMenu and the existing onChange section-switch function.');
    }
    selected = isTab(current()) ? current() : tabs()[0].id;
    nav.setAttribute('config', JSON.stringify({ tabs: tabs(), activeStateId: selected }));
    sync(selected);
  }
  nav.on('nl-nav-change', async event => {
    const id = event.detail?.stateId;
    if (!isTab(id)) return;
    const request = ++revision;
    try {
      // Keep the page's existing animation queue; do not add a second one.
      const result = await settings.onChange(id);
      if (request !== revision) return; // An older completion must not replace a newer choice.
      sync(isTab(result) ? result : current());
    } catch (error) {
      if (request === revision) sync(current());
      console.error('Header section change failed; selection restored to the actual section.', error);
    }
  });
  nav.on('nl-nav-ready', () => configure());
  nav.on('nl-nav-error', event => console.error('Navigation configuration:', event.detail?.message));
  const controller = { configure, syncCurrentState: sync };
  instances.set(nav, controller);
  configure(); // Attributes persist even if the external component loads later.
  return controller;
}
