import { h, icon } from './dom.js';
import { store, hasKey } from './services.js';
import { applyTheme } from './theme.js';
import { renderTour } from './ui/tour.js';
import { renderKeySetup } from './ui/keysetup.js';
import { renderHome, renderLibrary } from './ui/home.js';
import { renderVoices } from './ui/voices.js';
import { renderSettings } from './ui/settings.js';
import { toast } from './dom.js';
import { autoCheckUpdate } from './updater.js';

const app = document.getElementById('app');
const NAV = [['home', 'Home', 'home'], ['voices', 'Voices', 'voices'], null, ['library', 'Library', 'library'], ['settings', 'Settings', 'settings']];
let cleanup = null;

export function go(route) {
  if (location.hash === `#/${route}`) render();
  else location.hash = `#/${route}`;
}

function currentRoute() {
  return (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
}

function nav(route) {
  return h('nav', { class: 'nav', 'aria-label': 'Main' },
    NAV.map((n) => (n
      ? h('button', { 'aria-current': n[0] === route ? 'page' : null, onclick: () => go(n[0]) }, icon(n[2], 24), n[1])
      : h('span', { class: 'gap' }))),
    h('button', { class: 'centre', 'aria-label': 'New voiceover',
      onclick: () => (hasKey() ? toast('The scene editor arrives in the next build.') : go('key')) }, icon('mic', 26)));
}

function render() {
  if (cleanup) { cleanup(); cleanup = null; }
  const s = store.get();
  const route = currentRoute();

  if (!s.onboarded) {
    if (route === 'key') {
      renderKeySetup(app, {
        onDone: () => { store.set({ onboarded: true }); go('home'); autoCheckUpdate(); },
        onSkip: () => { store.set({ onboarded: true }); go('home'); autoCheckUpdate(); },
        onBack: () => go('welcome'),
      });
    } else {
      renderTour(app, () => go('key'));
    }
    return;
  }

  app.replaceChildren();
  const ctx = { go, rerender: render };
  if (route === 'key') {
    renderKeySetup(app, { onDone: () => { toast('Key saved.'); go('settings'); }, onBack: () => go('settings') });
    return;
  }
  let result;
  if (route === 'voices') result = renderVoices(app, ctx);
  else if (route === 'settings') renderSettings(app, ctx);
  else if (route === 'library') renderLibrary(app);
  else renderHome(app, ctx);
  if (typeof result === 'function') cleanup = result;
  app.append(nav(['voices', 'settings', 'library'].includes(route) ? route : 'home'));
}

applyTheme(store.get().theme);
window.addEventListener('hashchange', render);
render();
if (store.get().onboarded) autoCheckUpdate();
